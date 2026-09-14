import { Link } from 'react-router-dom'
import { CARE_TYPE_LABELS, CONTEXT_ONLY_STANDARDS, FALLBACK_STANDARDS } from '../lib/standards'
import type { CareType } from '../types/database'

export function Home() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <section className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          How long did you actually wait for care?
        </h1>
        <p className="mx-auto max-w-xl text-slate-600">
          TRICARE Prime beneficiaries are entitled by federal regulation to be seen within fixed
          time limits. This site collects real wait times, measures them against that legal
          standard, and publishes the aggregate — so the pattern is documented, not anecdotal.
        </p>
        <Link
          to="/report"
          className="inline-block rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Report your wait time
        </Link>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          The legal standard — 32 CFR 199.17(p)(5)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          When a referral is involved, the clock starts on the date the referral is{' '}
          <strong>approved</strong>, not the date you first asked for care.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="pb-2 pr-4">Type of care</th>
                <th className="pb-2 pr-4">Standard</th>
                <th className="pb-2">Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(Object.keys(CARE_TYPE_LABELS) as CareType[]).map((careType) => (
                <tr key={careType}>
                  <td className="py-2 pr-4 font-medium text-slate-800">
                    {CARE_TYPE_LABELS[careType]}
                  </td>
                  <td className="py-2 pr-4">
                    {FALLBACK_STANDARDS[careType].maxDays} day
                    {FALLBACK_STANDARDS[careType].maxDays === 1 ? '' : 's'}
                  </td>
                  <td className="py-2 text-slate-500">{FALLBACK_STANDARDS[careType].citation}</td>
                </tr>
              ))}
              {CONTEXT_ONLY_STANDARDS.map((s) => (
                <tr key={s.label} className="text-slate-400">
                  <td className="py-2 pr-4">{s.label}</td>
                  <td className="py-2 pr-4">{s.value}</td>
                  <td className="py-2">{s.citation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          The last two rows (office wait time, drive time to your PCM) are part of the regulation
          but not yet scored from submitted reports — see{' '}
          <Link to="/methodology" className="underline">
            methodology
          </Link>
          .
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-800">No PHI</h3>
          <p className="mt-1 text-sm text-slate-600">
            No diagnoses, no provider names, no DoD ID. This measures appointment access, not
            health information.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-800">Anonymous by default</h3>
          <p className="mt-1 text-sm text-slate-600">
            Report with no contact info at all, or opt into a verified or public tier — your
            choice, reported separately either way.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-semibold text-slate-800">Auditable methodology</h3>
          <p className="mt-1 text-sm text-slate-600">
            Every figure traces back to a documented calculation, an open schema, and MIT-licensed
            code.
          </p>
        </div>
      </section>
    </div>
  )
}
