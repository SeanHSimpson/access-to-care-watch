import { useEffect, useState } from 'react'
import { appPublicSchema } from './supabase'
import type { SummaryByTier } from '../types/database'

export function useSummaryByTier() {
  const [rows, setRows] = useState<SummaryByTier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    appPublicSchema()
      .from('summary_by_tier')
      .select('*')
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setRows((data as SummaryByTier[]) ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { rows, loading, error }
}
