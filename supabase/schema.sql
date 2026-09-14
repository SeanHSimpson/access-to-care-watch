-- =====================================================================
-- TRICARE Prime Access-to-Care Reporting — Database Schema
-- Target: PostgreSQL 15+ / Supabase
--
-- DESIGN RULES (do not violate in later migrations):
--   1. No PHI. No diagnoses, no provider names, no EDIPI/DoD ID,
--      no date of birth, no free-text that is solicited as medical detail.
--      This is APPOINTMENT ACCESS data, not health data.
--   2. Public role may INSERT reports and SELECT aggregates only.
--      Raw rows are never publicly readable.
--   3. Reports are append-only from the public side. Edits happen only
--      through the service role (moderation).
--   4. Contact info lives in a separate table from the report body and
--      is never exposed by any public view.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Schemas
-- ---------------------------------------------------------------------
create schema if not exists app;       -- private tables
create schema if not exists app_public; -- views the anon role may read

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

create type app.care_type as enum (
  'urgent',
  'routine_primary',
  'specialty',
  'preventive',
  'behavioral_health'
);

create type app.plan_type as enum (
  'prime',
  'prime_remote',
  'prime_overseas',
  'select',
  'tricare_for_life',
  'other',
  'unsure'
);

create type app.beneficiary_category as enum (
  'active_duty',
  'guard_reserve',
  'active_duty_family',
  'retiree',
  'retiree_family',
  'survivor',
  'other'
);

create type app.care_venue as enum (
  'mtf',              -- military treatment facility
  'network',          -- civilian TRICARE network
  'unsure'
);

-- How the submitter chose to be identified.
create type app.disclosure_tier as enum (
  'anonymous',        -- no contact info at all
  'verified_private', -- email confirmed, never displayed
  'public'            -- willing to be named / contacted by press or staff
);

create type app.report_status as enum (
  'pending',          -- awaiting moderation
  'published',
  'rejected',
  'withdrawn'         -- submitter asked for removal
);

-- =====================================================================
-- 2. REFERENCE DATA
-- =====================================================================

-- Access standards, stored as data rather than hard-coded, with the
-- citation attached. If DHA changes a standard, add a new row with a new
-- effective_from date instead of editing history.
create table app.access_standards (
  id              serial primary key,
  care_type       app.care_type not null,
  max_days        integer not null,
  citation        text not null,
  effective_from  date not null default '1995-10-05',
  effective_to    date,
  unique (care_type, effective_from)
);

insert into app.access_standards (care_type, max_days, citation) values
  ('urgent',            1,  '32 CFR 199.17(p)(5)(ii)'),
  ('routine_primary',   7,  '32 CFR 199.17(p)(5)(i)'),
  ('specialty',        28,  '32 CFR 199.17(p)(5)(iv)'),
  ('preventive',       28,  '32 CFR 199.17(p)(5)(i)'),
  ('behavioral_health', 7,  '32 CFR 199.17(p)(5)(i); ASD(HA) Memo 11-005');

-- Controlled list of facilities. Free-text base names destroy your
-- ability to aggregate; force a foreign key and let users request
-- additions via the moderation queue.
create table app.facilities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,              -- '633d Medical Group'
  installation  text not null,              -- 'Joint Base Langley-Eustis'
  branch        text not null,              -- 'Air Force' | 'Army' | ...
  state         text,                       -- 'VA'; null if OCONUS
  country       text not null default 'US',
  tricare_region text,                      -- 'East' | 'West' | 'Overseas'
  dmis_id       text,                       -- DoD facility identifier if known
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (name, installation)
);

create index on app.facilities (installation);
create index on app.facilities (state) where is_active;

-- =====================================================================
-- 3. REPORTS (the core table)
-- =====================================================================

create table app.reports (
  id                    uuid primary key default gen_random_uuid(),

  -- Who (categorical only — never identifying)
  facility_id           uuid not null references app.facilities(id),
  plan                  app.plan_type not null,
  beneficiary_category  app.beneficiary_category not null,

  -- What kind of care
  care_type             app.care_type not null,
  venue                 app.care_venue not null,
  referral_required     boolean not null default false,

  -- The clock. Per tricare.mil, when a referral is involved the wait
  -- starts on the date the referral was APPROVED, not the date of the
  -- original request.
  date_requested        date not null,
  referral_approved_date date,
  date_first_offered    date,   -- first appointment the system offered
  date_seen             date,   -- actually seen; null if still waiting
  still_waiting         boolean not null default false,

  -- Derived clock start, immutable so it can be a generated column.
  clock_start           date generated always as
                          (coalesce(referral_approved_date, date_requested))
                          stored,

  days_to_offer         integer generated always as
                          (date_first_offered - coalesce(referral_approved_date, date_requested))
                          stored,

  days_to_seen          integer generated always as
                          (date_seen - coalesce(referral_approved_date, date_requested))
                          stored,

  -- Consequences / context (booleans, so they aggregate cleanly)
  told_to_use_urgent_care boolean not null default false,
  told_to_use_er          boolean not null default false,
  sought_care_off_base    boolean not null default false,
  paid_out_of_pocket      boolean not null default false,
  appointment_cancelled_by_mtf boolean not null default false,
  pcm_unassigned          boolean not null default false,
  missed_duty_or_work     boolean not null default false,
  condition_worsened      boolean not null default false,

  -- Escalation already attempted (proves the internal channels failed)
  contacted_patient_advocate boolean not null default false,
  filed_ice_complaint        boolean not null default false,
  contacted_congress         boolean not null default false,

  -- Narrative. Clearly labeled in the UI as optional and as
  -- "do not include medical details or names."
  narrative             text check (char_length(narrative) <= 2000),

  -- Disclosure and moderation
  disclosure_tier       app.disclosure_tier not null default 'anonymous',
  status                app.report_status not null default 'pending',
  moderation_note       text,          -- staff-only, never exposed
  redacted_narrative    text,          -- moderator-cleaned version; this
                                       -- is the ONLY narrative ever published

  submitted_at          timestamptz not null default now(),
  published_at          timestamptz,

  -- Integrity constraints
  constraint chk_dates_sane check (
    (referral_approved_date is null or referral_approved_date >= date_requested)
    and (date_first_offered is null or date_first_offered >= date_requested)
    and (date_seen is null or date_seen >= date_requested)
  ),
  constraint chk_waiting_or_seen check (
    still_waiting = true or date_first_offered is not null or date_seen is not null
  ),
  constraint chk_referral_logic check (
    referral_approved_date is null or referral_required = true
  )
);

-- Time-relative validation lives in a trigger, NOT a CHECK constraint.
-- A CHECK that references current_date would re-validate old rows on
-- restore or update and start rejecting perfectly good history.
create or replace function app.validate_report_dates()
returns trigger language plpgsql as $$
begin
  if new.date_requested > current_date + 1
     or coalesce(new.date_seen, current_date) > current_date + 1
     or coalesce(new.date_first_offered, current_date) > current_date + 400 then
    raise exception 'Dates cannot be in the future.';
  end if;
  -- Keep the dataset to a defensible recent window.
  if new.date_requested < current_date - interval '3 years' then
    raise exception 'Reports are limited to the last three years.';
  end if;
  return new;
end;
$$;

create trigger trg_validate_report_dates
  before insert on app.reports
  for each row execute function app.validate_report_dates();

create index on app.reports (facility_id, care_type) where status = 'published';
create index on app.reports (submitted_at desc);
create index on app.reports (status) where status = 'pending';

-- ---------------------------------------------------------------------
-- Contact info: separate table, separate blast radius.
-- Nothing here is readable by any public view or the anon role.
-- ---------------------------------------------------------------------
create table app.report_contacts (
  report_id        uuid primary key references app.reports(id) on delete cascade,
  email            text not null,
  display_name     text,               -- only shown if tier = 'public'
  email_verified   boolean not null default false,
  verify_token_hash text,              -- store the hash, never the token
  verify_sent_at   timestamptz,
  verified_at      timestamptz,
  ok_to_contact_press boolean not null default false,
  ok_to_contact_congress boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Facility addition requests (keeps facilities table clean)
-- ---------------------------------------------------------------------
create table app.facility_requests (
  id           uuid primary key default gen_random_uuid(),
  raw_name     text not null,
  raw_installation text,
  submitted_at timestamptz not null default now(),
  resolved     boolean not null default false
);

-- ---------------------------------------------------------------------
-- Abuse control. The edge function records a coarse hashed fingerprint —
-- never a raw IP — so you can throttle without logging identity.
-- ---------------------------------------------------------------------
create table app.submission_throttle (
  fingerprint_hash text primary key,   -- sha256(ip + daily_salt), salt rotates
  submission_count integer not null default 1,
  window_start     timestamptz not null default now()
);

-- =====================================================================
-- 4. PUBLIC VIEWS  (the only thing anon may SELECT)
-- =====================================================================

-- Each published report joined to the standard in force, with the
-- headline number: days over the legal standard.
create view app_public.reports_scored as
select
  r.id,
  f.name          as facility_name,
  f.installation,
  f.branch,
  f.state,
  f.tricare_region,
  r.care_type,
  r.venue,
  r.plan,
  r.beneficiary_category,
  s.max_days      as standard_days,
  s.citation      as standard_citation,
  -- Still-waiting reports count their elapsed days so they are not
  -- silently dropped from the averages. They are the worst cases.
  case
    when r.still_waiting then current_date - r.clock_start
    else coalesce(r.days_to_seen, r.days_to_offer)
  end as days_waited,
  case
    when r.still_waiting then (current_date - r.clock_start) - s.max_days
    else coalesce(r.days_to_seen, r.days_to_offer) - s.max_days
  end as days_over_standard,
  r.still_waiting,
  r.told_to_use_er,
  r.told_to_use_urgent_care,
  r.sought_care_off_base,
  r.paid_out_of_pocket,
  r.condition_worsened,
  r.contacted_patient_advocate,
  r.disclosure_tier,
  case when r.disclosure_tier = 'public' then c.display_name end as display_name,
  r.redacted_narrative as narrative,
  date_trunc('month', r.submitted_at)::date as submitted_month
from app.reports r
join app.facilities f on f.id = r.facility_id
join app.access_standards s
  on s.care_type = r.care_type and s.effective_to is null
left join app.report_contacts c on c.report_id = r.id
where r.status = 'published';

-- Facility-level rollup — this is what the map and the leaderboard read,
-- and what you hand a committee staffer as a CSV.
create view app_public.facility_stats as
select
  facility_name,
  installation,
  branch,
  state,
  tricare_region,
  care_type,
  count(*)                                   as report_count,
  round(avg(days_waited))                    as avg_days_waited,
  percentile_cont(0.5) within group (order by days_waited) as median_days_waited,
  max(days_waited)                           as worst_days_waited,
  count(*) filter (where days_over_standard > 0) as over_standard_count,
  round(
    100.0 * count(*) filter (where days_over_standard > 0) / nullif(count(*), 0)
  )                                          as pct_over_standard,
  count(*) filter (where disclosure_tier <> 'anonymous') as verified_count,
  count(*) filter (where still_waiting)      as still_waiting_count
from app_public.reports_scored
group by 1,2,3,4,5,6;

-- Report tiers separately so nobody can wave off the whole dataset as
-- unverified anecdote.
create view app_public.summary_by_tier as
select
  disclosure_tier,
  care_type,
  count(*) as report_count,
  round(avg(days_waited)) as avg_days_waited,
  round(100.0 * count(*) filter (where days_over_standard > 0)
        / nullif(count(*),0)) as pct_over_standard
from app_public.reports_scored
group by 1,2;

create view app_public.facilities_list as
select id, name, installation, branch, state, tricare_region
from app.facilities where is_active;

-- =====================================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================================

alter table app.reports            enable row level security;
alter table app.report_contacts    enable row level security;
alter table app.facilities         enable row level security;
alter table app.facility_requests  enable row level security;
alter table app.access_standards   enable row level security;
alter table app.submission_throttle enable row level security;

-- Anon: insert reports, nothing else. No SELECT, no UPDATE, no DELETE.
create policy anon_insert_reports on app.reports
  for insert to anon
  with check (
    status = 'pending'
    and published_at is null
    and redacted_narrative is null
    and moderation_note is null
  );

create policy anon_insert_contacts on app.report_contacts
  for insert to anon
  with check (email_verified = false and verified_at is null);

create policy anon_insert_facility_requests on app.facility_requests
  for insert to anon with check (resolved = false);

-- Anon: read the reference lists only.
create policy anon_read_facilities on app.facilities
  for select to anon using (is_active);

create policy anon_read_standards on app.access_standards
  for select to anon using (true);

-- No policies for the throttle table: service role only, by omission.

-- Grants
grant usage on schema app, app_public to anon, authenticated;
grant insert on app.reports, app.report_contacts, app.facility_requests to anon;
grant select on app.facilities, app.access_standards to anon;
grant select on all tables in schema app_public to anon, authenticated;

-- Belt and braces: anon must never be able to read raw report rows.
revoke select, update, delete on app.reports         from anon;
revoke select, update, delete on app.report_contacts from anon;

-- =====================================================================
-- 6. MODERATION HELPERS (service role only)
-- =====================================================================

create or replace function app.publish_report(p_id uuid, p_redacted text)
returns void
language plpgsql
security definer
set search_path = app, public
as $$
begin
  update app.reports
     set status = 'published',
         redacted_narrative = p_redacted,
         published_at = now()
   where id = p_id and status = 'pending';
end;
$$;

revoke execute on function app.publish_report(uuid, text) from anon, authenticated;

-- Submitter-initiated withdrawal, keyed on a token they were emailed.
create or replace function app.withdraw_report(p_id uuid, p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = app, public
as $$
declare ok boolean;
begin
  select exists (
    select 1 from app.report_contacts
     where report_id = p_id and verify_token_hash = p_token_hash
  ) into ok;
  if ok then
    update app.reports set status = 'withdrawn' where id = p_id;
    delete from app.report_contacts where report_id = p_id;
  end if;
  return ok;
end;
$$;

-- =====================================================================
-- 7. SEED — Langley, so there is something to test against
-- =====================================================================

insert into app.facilities (name, installation, branch, state, tricare_region)
values
  ('633d Medical Group', 'Joint Base Langley-Eustis', 'Air Force', 'VA', 'East'),
  ('McDonald Army Health Center', 'Joint Base Langley-Eustis', 'Army', 'VA', 'East'),
  ('Naval Medical Center Portsmouth', 'Naval Station Norfolk', 'Navy', 'VA', 'East')
on conflict do nothing;
