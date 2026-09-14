# TRICARE Access Watch

A public, independent site where TRICARE Prime beneficiaries report how long
they actually waited for appointments, measured against the legal access
standards TRICARE is required to meet. The goal is an aggregate dataset
credible enough to hand to a patient advocacy organization or a
congressional staffer — not anecdotes, a documented pattern with citations.

**This is a private civic project. It is not affiliated with, endorsed by,
or run by the Department of Defense, the Department of the Air Force, or any
branch of the U.S. military.** No rank, duty title, unit, or `.mil` contact
information is collected or displayed anywhere on this site.

## Why this exists

TRICARE Prime beneficiaries are entitled by regulation to see a provider
within a fixed number of days depending on the type of care needed. When a
military treatment facility can't meet that standard, beneficiaries are
supposed to be referred out to network care instead of just... waiting. This
project exists because that isn't always what happens in practice, and there
was no public, structured way to document it.

## The legal standard

TRICARE Prime access-to-care standards, **32 CFR 199.17(p)(5)**:

| Type of care                | Standard          |
|------------------------------|-------------------|
| Urgent care                  | 24 hours           |
| Routine / primary care       | 7 days             |
| Specialty care                | 28 days           |
| Preventive care                | 28 days          |
| Office wait time                | 30 minutes      |
| Drive time to your PCM (primary care manager) | 30 minutes |

**When a referral is involved, the clock starts on the date the referral was
approved** — not the date you first asked for care.

See [`METHODOLOGY.md`](METHODOLOGY.md) for exactly how every number on this
site is computed from submitted reports, including which of the standards
above are currently scored by the data model and which are collected for
context only. If you're a staffer or reporter asking "where did this number
come from," that file is the answer.

## What this is not

- **Not a medical records system.** No diagnoses, no provider names, no DoD
  ID / EDIPI, no date of birth, and no free-text field solicits medical
  detail. This is appointment-access data — how long someone waited — not
  health data.
- **Not a complaint mailbox monitored by anyone in your chain of command.**
  Reports are anonymous by default and moderated before publication.
- **Not a random, representative sample** of all TRICARE beneficiaries — see
  the limitations section of `METHODOLOGY.md`.

## How it works

1. You submit a report: which facility, what kind of care, the relevant
   dates, and (optionally) what happened as a result — sent for urgent care
   or the ER instead, paid out of pocket, condition got worse while waiting,
   etc.
2. You choose how identifiable you want to be: fully anonymous, a verified
   email that's never shown publicly, or public (willing to be named or
   contacted by press/congressional staff).
3. A moderator reviews the report before it's published, redacting anything
   that shouldn't be there.
4. Published reports feed facility-level and national statistics, exportable
   as CSV.

## Privacy and data model

The database schema (`supabase/schema.sql`) enforces most of this at the
database layer, not just in application code:

- The public role can **insert** reports but has **no** `SELECT`, `UPDATE`,
  or `DELETE` access on the raw reports table — ever. Public pages read from
  separate aggregate views (`app_public.*`), never the underlying table.
- Contact information lives in a table isolated from the report body itself
  and is never exposed by any public view, at any disclosure tier.
- Facilities are a foreign key into a controlled list, never free text —
  unrecognized facilities go into a moderation queue instead of polluting
  the dataset with typos and duplicates.
- No raw IP address is ever written to the database — submissions go
  through an edge function that hashes a rate-limiting fingerprint before
  it touches storage.

## Tech stack

- [Vite](https://vite.dev/) + React + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) (mobile-first)
- [Supabase](https://supabase.com/) (Postgres, RLS, edge functions)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) for
  bot mitigation on submission

## Project structure

```
supabase/
  schema.sql                 -- full DB schema: tables, RLS, views (source of truth)
  functions/submit-report/   -- edge function: verifies Turnstile, hashes
                                fingerprint, inserts report + contact server-side
src/
  components/                -- ReportForm steps, stats table, etc.
  pages/                     -- Home, Report, Stats, Methodology
  lib/                       -- Supabase client, access-standards data, CSV export
  types/                     -- TypeScript types mirroring the DB schema
```

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL/anon key + Turnstile site key
npm run dev
```

### Environment variables

| Variable                      | Description                                      |
|--------------------------------|---------------------------------------------------|
| `VITE_SUPABASE_URL`            | Your Supabase project URL                          |
| `VITE_SUPABASE_ANON_KEY`       | Supabase anon (public) key — safe to expose client-side |
| `VITE_TURNSTILE_SITE_KEY`      | Cloudflare Turnstile site key                      |

Server-side secrets (Turnstile secret key, Supabase service role key) belong
only in the edge function's environment, never in the frontend `.env`.

### Database setup

Run `supabase/schema.sql` against a fresh Supabase Postgres project (SQL
editor, or `psql`/the Supabase CLI). It's idempotent-ish for reference data
(`on conflict do nothing` on the seed facilities) but is meant to run once
against a clean database — it's not a migration chain.

**Expose the custom schemas.** PostgREST only serves the `public` schema by
default. Under Project Settings → API → Exposed schemas, add `app` and
`app_public` (both — reference-data reads and reports inserts go through
`app`; the aggregate views the frontend reads live in `app_public`).

### Edge function

Report submissions go through `supabase/functions/submit-report`, never a
direct client-side insert — see the comment at the top of that file for why.
Deploy it and set its secrets with the Supabase CLI:

```bash
supabase functions deploy submit-report
supabase secrets set TURNSTILE_SECRET_KEY=your-turnstile-secret-key
supabase secrets set FINGERPRINT_SALT=$(openssl rand -hex 32)
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by
the Supabase runtime. Rotate `FINGERPRINT_SALT` periodically — it's what
makes the rate-limiting fingerprint non-reversible to an IP address, and
rotating it periodically ages out old fingerprints on top of that.

## Contributing

Issues and pull requests are welcome, especially:

- Additional military treatment facilities / TRICARE network regions.
- Accessibility fixes.
- Anything that makes the methodology easier to audit, not just easier to
  read.

Please don't propose adding rank, unit, duty title, or any `.mil` contact
path to the schema or UI — that's a hard constraint, not an oversight.

## License

MIT — see [`LICENSE`](LICENSE). This project is intentionally public from
day one; the methodology, the schema, and the code are all meant to be
auditable by anyone deciding how much to trust the numbers.
