import { useEffect, useState } from 'react'
import { appPublicSchema } from './supabase'
import type { FacilityStats } from '../types/database'

export function useFacilityStats() {
  const [rows, setRows] = useState<FacilityStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    appPublicSchema()
      .from('facility_stats')
      .select('*')
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setRows((data as FacilityStats[]) ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { rows, loading, error }
}

/** Key that identifies one physical facility across its per-care-type rows. */
export function facilityKey(row: Pick<FacilityStats, 'facility_name' | 'installation'>): string {
  return `${row.facility_name}|${row.installation}`
}

/**
 * Total published reports for a facility across all care types — the
 * number the >=5 name-suppression threshold is measured against (see
 * METHODOLOGY.md section 7), not any single care-type row's count.
 */
export function totalReportsByFacility(rows: FacilityStats[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const key = facilityKey(row)
    totals.set(key, (totals.get(key) ?? 0) + row.report_count)
  }
  return totals
}
