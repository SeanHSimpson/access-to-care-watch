// Set VITE_REPO_URL if you want this page to link straight to the repo's
// METHODOLOGY.md (e.g. once you know the GitHub org/repo it's published
// under). Left unset, the page just names the file instead of guessing a URL.
const REPO_URL = import.meta.env.VITE_REPO_URL as string | undefined

export function Methodology() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Methodology</h1>
        <p className="mt-1 text-sm text-slate-600">
          This page summarizes{' '}
          {REPO_URL ? (
            <a href={`${REPO_URL}/blob/main/METHODOLOGY.md`} className="text-blue-700 underline">
              METHODOLOGY.md
            </a>
          ) : (
            <code>METHODOLOGY.md</code>
          )}{' '}
          in the project repository, which is the definitive, version-controlled source. If this
          page and that file ever disagree, the file is right.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">When the clock starts</h2>
        <p className="text-sm text-slate-700">
          If a referral was required, the wait is measured from the date the referral was{' '}
          <strong>approved</strong>. Otherwise it's measured from the date you first asked for
          care.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">How "days waited" is computed</h2>
        <p className="text-sm text-slate-700">
          Measured to the date you were actually seen, or — if you were never seen — the date you
          were first offered an appointment. If you're still waiting, the count is your elapsed
          wait as of today, and it is <strong>included</strong> in the averages, not dropped: an
          open-ended wait is the clearest evidence of an access failure this dataset can contain.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Disclosure tiers</h2>
        <p className="text-sm text-slate-700">
          Every report is tagged <em>anonymous</em>, <em>verified private</em> (real email
          confirmed, never shown), or <em>public</em> (willing to be named). Statistics are always
          reported broken out by tier as well as combined, so the dataset can't be dismissed as
          unverifiable.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Facility name suppression</h2>
        <p className="text-sm text-slate-700">
          A facility's name is withheld from public display until it has 5 or more published
          reports total. Below that, it appears only in an aggregate "under 5 reports" bucket.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Known limitations</h2>
        <p className="text-sm text-slate-700">
          This is self-reported data, not an administrative record, and not a random sample —
          people with an access failure to report are more likely to find and use this site than
          people whose care was routine. Read it as documented evidence that failures of this kind
          are occurring, not as a population-wide statistic.
        </p>
      </section>

      <p className="text-sm text-slate-500">
        Full detail, including the exact SQL and every constraint, is in{' '}
        {REPO_URL ? (
          <a href={REPO_URL} className="text-blue-700 underline">
            the repository
          </a>
        ) : (
          'the project repository'
        )}{' '}
        — <code>METHODOLOGY.md</code> and <code>supabase/schema.sql</code>.
      </p>
    </div>
  )
}
