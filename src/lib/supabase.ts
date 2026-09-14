import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill them in.',
  )
}

/**
 * One client, schema-scoped per call with `.schema(...)`.
 *
 * The schema.sql design deliberately splits data across two Postgres
 * schemas — `app` (reference data + append-only inserts) and `app_public`
 * (read-only aggregate views) — so this requires both to be enabled under
 * Project Settings -> API -> Exposed schemas in Supabase. See README.md.
 */
export const supabase = createClient(url, anonKey)

export const appSchema = () => supabase.schema('app')
export const appPublicSchema = () => supabase.schema('app_public')
