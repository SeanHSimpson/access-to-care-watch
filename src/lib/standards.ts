import { useEffect, useState } from 'react'
import { appSchema } from './supabase'
import type { AccessStandard, CareType } from '../types/database'

/**
 * Mirrors the seed rows in supabase/schema.sql. This is a fallback for the
 * first paint (and for the front page, which shouldn't block on a network
 * round trip to render a legal citation) — the source of truth is always
 * `app.access_standards` in the database. See METHODOLOGY.md section 1.
 */
export const FALLBACK_STANDARDS: Record<CareType, { maxDays: number; citation: string }> = {
  urgent: { maxDays: 1, citation: '32 CFR 199.17(p)(5)(ii)' },
  routine_primary: { maxDays: 7, citation: '32 CFR 199.17(p)(5)(i)' },
  specialty: { maxDays: 28, citation: '32 CFR 199.17(p)(5)(iv)' },
  preventive: { maxDays: 28, citation: '32 CFR 199.17(p)(5)(i)' },
  behavioral_health: {
    maxDays: 7,
    citation: '32 CFR 199.17(p)(5)(i); ASD(HA) Memo 11-005',
  },
}

export const CARE_TYPE_LABELS: Record<CareType, string> = {
  urgent: 'Urgent care',
  routine_primary: 'Routine / primary care',
  specialty: 'Specialty care',
  preventive: 'Preventive care',
  behavioral_health: 'Behavioral health',
}

// Standards not currently scored from submitted data (schema doesn't yet
// collect the inputs) but part of the regulation and shown for context.
export const CONTEXT_ONLY_STANDARDS = [
  { label: 'Office wait time', value: '30 minutes', citation: '32 CFR 199.17(p)(5)(v)' },
  { label: 'Drive time to your PCM', value: '30 minutes', citation: '32 CFR 199.17(p)(5)(v)' },
]

/**
 * Loads the currently-in-force access standards from the database.
 * Falls back to FALLBACK_STANDARDS (and reports loading/error state) so the
 * UI never blocks on this, but the "X days over standard" the user sees
 * before submitting is drawn from the live database once it resolves.
 */
export function useAccessStandards() {
  const [standards, setStandards] =
    useState<Record<CareType, { maxDays: number; citation: string }>>(FALLBACK_STANDARDS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    appSchema()
      .from('access_standards')
      .select('care_type, max_days, citation')
      .is('effective_to', null)
      .then(({ data, error: err }: { data: Pick<AccessStandard, 'care_type' | 'max_days' | 'citation'>[] | null; error: { message: string } | null }) => {
        if (cancelled) return
        if (err) {
          setError(err.message)
        } else if (data) {
          const next = { ...FALLBACK_STANDARDS }
          for (const row of data) {
            next[row.care_type] = { maxDays: row.max_days, citation: row.citation }
          }
          setStandards(next)
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { standards, loading, error }
}

export function daysBetween(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay)
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
