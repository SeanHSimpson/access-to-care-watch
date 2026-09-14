# Methodology

This document is the audit trail for every number this site publishes. If a
figure on the site can't be traced to a step below, that's a bug — [open an
issue](https://github.com/) rather than take the number on faith.

The source of truth is the database schema itself, [`supabase/schema.sql`](supabase/schema.sql).
This document explains it; it does not override it. Where the two disagree,
the schema is right and this file needs fixing.

## 1. Legal standards

All standards below are TRICARE Prime access-to-care standards under
**32 CFR 199.17(p)(5)**, stored as data in `app.access_standards` (not
hard-coded in application logic) so a future change in the regulation can be
added as a new row with its own `effective_from` date rather than by editing
history.

| Care type            | Standard    | Citation                                            |
|-----------------------|-------------|------------------------------------------------------|
| Urgent care           | 24 hours (1 day) | 32 CFR 199.17(p)(5)(ii)                        |
| Routine / primary care| 7 days      | 32 CFR 199.17(p)(5)(i)                                |
| Specialty care        | 28 days     | 32 CFR 199.17(p)(5)(iv)                               |
| Preventive care       | 28 days     | 32 CFR 199.17(p)(5)(i)                                |
| Behavioral health     | 7 days      | 32 CFR 199.17(p)(5)(i); ASD(HA) Memo 11-005           |

Two additional standards exist in the regulation and are shown for context on
the site, but are **not yet computed from submitted data**, because the
schema does not currently collect the inputs needed to score them:

- **Office wait time**: 30 minutes from scheduled appointment time.
- **Drive time to PCM**: 30 minutes under normal circumstances.

If we start collecting office-wait-time or drive-time data, this section (and
the schema) will be updated together, and that update will be called out in
the changelog — not silently folded into the existing "days over standard"
number.

## 2. When the clock starts

Per TRICARE policy, if a referral is involved, the access-standard clock
starts on the date the referral was **approved**, not the date the
beneficiary first asked for care. This is `clock_start` in the schema:

```sql
clock_start = coalesce(referral_approved_date, date_requested)
```

If there was no referral, or `referral_approved_date` was never entered, the
clock starts at `date_requested`. A report where `referral_approved_date` is
set requires `referral_required = true` (enforced by a check constraint) —
you cannot backdate a clock to a referral that wasn't required.

## 3. How "days waited" is computed

For a report where the beneficiary was seen or offered an appointment, days
waited is measured to whichever actually happened, preferring the date the
beneficiary was **seen** over the date an appointment was merely **offered**
(an offer that was later rescheduled or cancelled isn't the beneficiary
getting care):

```sql
days_waited = coalesce(days_to_seen, days_to_offer)
```

where `days_to_seen` and `days_to_offer` are both measured from
`clock_start`, as generated columns on `app.reports`:

```sql
days_to_offer = date_first_offered - clock_start
days_to_seen  = date_seen           - clock_start
```

**Still-waiting reports are not excluded from the averages.** A beneficiary
who has been waiting 90 days with no appointment yet is the clearest evidence
of an access failure this dataset can contain, and dropping them because
they have no `date_seen` would systematically hide the worst cases. Instead,
for `still_waiting = true` reports, days waited is the elapsed time as of
today:

```sql
days_waited = current_date - clock_start   -- when still_waiting
```

This means a still-open report's "days waited" figure increases every day it
remains open, until it is updated or the beneficiary is eventually seen.
Facility-level averages and medians (`app_public.facility_stats`) are
recomputed live from the view, not cached, so this is automatic.

## 4. How "days over standard" is computed

```sql
days_over_standard = days_waited - standard_days
```

where `standard_days` comes from the `app.access_standards` row in force for
that report's `care_type` (`effective_to is null`, i.e. the current
standard). A positive number means the wait exceeded the legal standard; zero
or negative means it was met. `pct_over_standard` at the facility level is
the share of that facility's published reports with `days_over_standard > 0`.

## 5. Data integrity guards

These are enforced in the database, not just the UI, so they hold regardless
of what client submits the data:

- **Dates cannot be in the future** (beyond a 1-day grace window for time
  zone slop), checked in a trigger rather than a `CHECK` constraint — a
  `CHECK` referencing `current_date` would re-validate old rows on every
  restore and could start rejecting good history as time passes.
- **Reports are limited to a 3-year rolling window.** Older reports fall out
  of new submissions; this keeps the dataset defensible as "current
  conditions," not a mix of eras with different staffing and policy.
- **Referral logic**: `referral_approved_date` can only be set if
  `referral_required` is true.
- **Date ordering**: `referral_approved_date`, `date_first_offered`, and
  `date_seen`, when present, must each be on or after `date_requested`.
- **No orphan waits**: a report must either be `still_waiting`, or have a
  `date_first_offered` or `date_seen` — you can't submit a closed-out report
  with no resolution date at all.

## 6. Disclosure tiers

Every report is tagged with how the submitter chose to identify themselves,
and this tag is **never discarded** — it travels with the report through
every public view, and `app_public.summary_by_tier` reports the same
headline numbers broken out by tier. This exists specifically so the dataset
cannot be dismissed as "unverifiable anonymous internet complaints": a
reader can see the anonymous-only numbers, the numbers from people who
confirmed a real email, and the numbers from people willing to be named
side by side.

| Tier                | Meaning                                                                 |
|----------------------|--------------------------------------------------------------------------|
| `anonymous`          | No contact information collected at all.                                |
| `verified_private`   | Submitter confirmed a real email via a verification link. Never shown publicly; used only to prove the report isn't a bot and to let the submitter withdraw it later. |
| `public`             | Submitter is willing to be identified and possibly contacted by press or congressional staff. Only for this tier is a `display_name` ever shown, and only after the submitter opts in. |

Verification does not change a report's `days_over_standard` figure — a
`verified_private` report and an `anonymous` report reporting the same wait
are scored identically. What changes is only the confidence a reader can
place in the tier as a whole, which is why the tiers are reported separately
rather than blended into one number.

## 7. Facility name suppression

To avoid a single self-selected report defining a facility's public
reputation, a facility's name is withheld from the public-facing display
(shown only in an aggregate "under 5 reports" bucket at that facility's
branch/region level) **until it has accumulated 5 or more published
reports.** This is an application-layer display rule — the underlying
`app_public.facility_stats` view returns rows regardless of count, so the
threshold is enforced in the frontend (see `src/lib/facilityDisplay.ts`) and
applied consistently everywhere a facility could otherwise be identified
(stats table, CSV export, facility detail page).

## 8. What counts as a "published" report

A report only appears in any public view after moderation:

- Submissions land in `app.reports` with `status = 'pending'` via an
  anonymous-insert-only RLS policy — the public role can never read,
  update, or delete rows in this table, published or not.
  \
- A moderator (service role) calls `app.publish_report()`, which sets
  `status = 'published'`, stamps `published_at`, and — critically — swaps in
  a **moderator-reviewed `redacted_narrative`.** The submitter's raw
  `narrative` field is never itself exposed by any public view;
  `redacted_narrative` is the only narrative text that is ever published,
  specifically to catch cases where a submitter accidentally included a
  name, unit, or medical detail despite the form's warning.
- A submitter can withdraw a report later via `app.withdraw_report()`,
  authenticated by a token hash mailed to them at submission time (never the
  raw token). Withdrawn reports move to `status = 'withdrawn'` and drop out
  of every public view immediately.

## 9. Known limitations

Stated plainly, because a credible dataset names its own limits instead of
waiting for someone else to:

- **Self-reported, not administrative data.** These are not the DHA's own
  access-to-care metrics; they are what beneficiaries report about their own
  experience. That is the point (DHA-reported compliance and lived
  experience frequently diverge), but it means this dataset measures
  reported experience, not a verified administrative record of every
  appointment request.
- **Not a random sample.** People with a bad experience are more likely to
  hear about and use a site like this than people whose care was routine.
  This dataset should be read as "here is documented evidence that access
  failures of this kind and scale are happening," not as "X% of all TRICARE
  Prime beneficiaries at this facility wait this long."
- **No independent verification of dates.** The `verified_private` and
  `public` tiers verify that a real person stands behind the report; they do
  not verify the underlying appointment dates against a clinic's scheduling
  system.
- **Office wait time and drive-time-to-PCM standards are not yet scored**
  (see Section 1).
