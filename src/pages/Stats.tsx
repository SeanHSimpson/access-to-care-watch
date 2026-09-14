import { useMemo } from 'react'
import { useFacilityStats, totalReportsByFacility, facilityKey } from '../lib/facilityStats'
import { useSummaryByTier } from '../lib/summaryByTier'
import { displayFacilityName, isFacilityIdentifiable } from '../lib/facilityDisplay'
import { CARE_TYPE_LABELS } from '../lib/standards'
import { toCsv, downloadCsv } from '../lib/csv'
import type { CareType } from '../types/database'

export function Stats() {
  const { rows: facilityRows, loading: facilitiesLoading, error: facilitiesError } = useFacilityStats()
  const { rows: tierRows, loading: tiersLoading, error: tiersError } = useSummaryByTier()

  const totals = useMemo(() => totalReportsByFacility(facilityRows), [facilityRows])

  const nationalByCareType = useMemo(() => {
    const map = new Map<CareType, { reportCount: number; weightedDays: number; overCount: number }>()
    for (const row of tierRows) {
      const entry = map.get(row.care_type) ?? { reportCount: 0, weightedDays: 0, overCount: 0 }
      entry.reportCount += row.report_count
      entry.weightedDays += row.avg_days_waited * row.report_count
      entry.overCount += Math.round((row.pct_over_standard / 100) * row.report_count)
      map.set(row.care_type, entry)
    }
    return map
  }, [tierRows])

  function handleExport() {
    const exportRows = facilityRows.map((row) => {
      const total = totals.get(facilityKey(row)) ?? row.report_count
      return {
        facility_name: displayFacilityName(row.facility_name, total),
        installation: isFacilityIdentifiable(total) ? row.installation : 'withheld',
        branch: row.branch,
        state: row.state ?? '',
        tricare_region: row.tricare_region ?? '',
        care_type: row.care_type,
        report_count: row.report_count,
        avg_days_waited: row.avg_days_waited,
        median_days_waited: row.median_days_waited,
        worst_days_waited: row.worst_days_waited,
        over_standard_count: row.over_standard_count,
        pct_over_standard: row.pct_over_standard,
        verified_count: row.verified_count,
        still_waiting_count: row.still_waiting_count,
      }
    })
    downloadCsv('tricare-access-watch-facility-stats.csv', toCsv(exportRows))
  }

  const loading = facilitiesLoading || tiersLoading
  const error = facilitiesError ?? tiersError

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Access-to-care statistics</h1>
        <p className="mt-1 text-sm text-slate-600">
          Computed from published reports as described in{' '}
          <a href="/methodology" className="text-blue-700 underline">
            METHODOLOGY.md
          </a>
          . Still-waiting reports count their elapsed wait, so these numbers move as reports age.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading statistics…</p>}
      {error && <p className="text-sm text-red-600">Couldn't load statistics ({error}).</p>}

      {!loading && !error && (
        <>
          <section>
            <h2 className="text-lg font-semibold text-slate-900">National summary</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[...nationalByCareType.entries()].map(([careType, agg]) => {
                const pct = agg.reportCount > 0 ? Math.round((100 * agg.overCount) / agg.reportCount) : 0
                const avg = agg.reportCount > 0 ? Math.round(agg.weightedDays / agg.reportCount) : 0
                return (
                  <div key={careType} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">{CARE_TYPE_LABELS[careType]}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{avg} days</p>
                    <p className="text-xs text-slate-500">average wait · {agg.reportCount} reports</p>
                    <p className="mt-1 text-sm font-semibold text-red-700">{pct}% over standard</p>
                  </div>
                )
              })}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">By disclosure tier</h2>
            <p className="mt-1 text-sm text-slate-600">
              Reported separately so the dataset can't be waved off as unverified anecdote — see
              METHODOLOGY.md section 6.
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Tier</th>
                    <th className="px-3 py-2">Care type</th>
                    <th className="px-3 py-2">Reports</th>
                    <th className="px-3 py-2">Avg days waited</th>
                    <th className="px-3 py-2">% over standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tierRows.map((row) => (
                    <tr key={`${row.disclosure_tier}-${row.care_type}`}>
                      <td className="px-3 py-2 capitalize">{row.disclosure_tier.replace('_', ' ')}</td>
                      <td className="px-3 py-2">{CARE_TYPE_LABELS[row.care_type]}</td>
                      <td className="px-3 py-2">{row.report_count}</td>
                      <td className="px-3 py-2">{row.avg_days_waited}</td>
                      <td className="px-3 py-2">{row.pct_over_standard}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">By facility</h2>
              <button
                type="button"
                onClick={handleExport}
                disabled={facilityRows.length === 0}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Export CSV
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Facility names are withheld until a facility has 5 or more published reports (see
              METHODOLOGY.md section 7).
            </p>
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Facility</th>
                    <th className="px-3 py-2">Care type</th>
                    <th className="px-3 py-2">Reports</th>
                    <th className="px-3 py-2">Avg days</th>
                    <th className="px-3 py-2">Median days</th>
                    <th className="px-3 py-2">% over standard</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {facilityRows.map((row) => {
                    const total = totals.get(facilityKey(row)) ?? row.report_count
                    return (
                      <tr key={`${facilityKey(row)}-${row.care_type}`}>
                        <td className="px-3 py-2">
                          <span className="block font-medium text-slate-800">
                            {displayFacilityName(row.facility_name, total)}
                          </span>
                          {isFacilityIdentifiable(total) && (
                            <span className="block text-xs text-slate-500">
                              {row.installation}
                              {row.state ? `, ${row.state}` : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">{CARE_TYPE_LABELS[row.care_type]}</td>
                        <td className="px-3 py-2">{row.report_count}</td>
                        <td className="px-3 py-2">{row.avg_days_waited}</td>
                        <td className="px-3 py-2">{row.median_days_waited}</td>
                        <td className="px-3 py-2">{row.pct_over_standard}%</td>
                      </tr>
                    )
                  })}
                  {facilityRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                        No published reports yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
