import { useEffect, useState } from 'react'
import { appPublicSchema } from './supabase'
import type { Facility } from '../types/database'

export function useFacilities() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    appPublicSchema()
      .from('facilities_list')
      .select('id, name, installation, branch, state, tricare_region')
      .order('installation', { ascending: true })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setFacilities((data as Facility[]) ?? [])
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { facilities, loading, error }
}
