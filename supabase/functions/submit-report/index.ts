// Supabase Edge Function: submit-report
//
// Every public report submission goes through here instead of a direct
// client-side insert, even though `app.reports` grants anon INSERT. Two
// things have to happen server-side and nowhere else:
//   1. The Turnstile token is verified against Cloudflare using a secret
//      key that must never reach the browser.
//   2. The submitter's IP is hashed into a rate-limit fingerprint and
//      immediately discarded — the raw IP is never written to Postgres,
//      logged, or returned. Only `app.submission_throttle.fingerprint_hash`
//      persists, and that table has no anon policies at all.
//
// Required secrets (`supabase secrets set ...`):
//   TURNSTILE_SECRET_KEY   Cloudflare Turnstile secret key
//   FINGERPRINT_SALT       Any long random string, rotate periodically
// Provided automatically by the Supabase runtime:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Max submissions per fingerprint per rolling window.
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) {
    console.error('TURNSTILE_SECRET_KEY is not configured')
    return false
  }
  const form = new URLSearchParams()
  form.set('secret', secret)
  form.set('response', token)
  form.set('remoteip', ip)

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: form,
  })
  const outcome = await res.json()
  return outcome.success === true
}

function randomToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let payload: { report?: unknown; contact?: unknown; turnstileToken?: string }
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const { report, contact, turnstileToken } = payload
  if (!report || typeof turnstileToken !== 'string') {
    return json({ error: 'Missing report or turnstileToken' }, 400)
  }

  // Cloudflare's connecting-ip header; this is the only place the raw
  // value is ever held, and only in memory for this request.
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown'

  const turnstileOk = await verifyTurnstile(turnstileToken, ip)
  if (!turnstileOk) {
    return json({ error: 'Verification challenge failed. Please try again.' }, 403)
  }

  const salt = Deno.env.get('FINGERPRINT_SALT') ?? ''
  const daySalt = await sha256Hex(`${salt}:${new Date().toISOString().slice(0, 10)}`)
  const fingerprintHash = await sha256Hex(`${ip}:${daySalt}`)
  // `ip` and `daySalt` fall out of scope here — nothing below this line
  // references the raw IP again.

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: throttleRow } = await supabase
    .schema('app')
    .from('submission_throttle')
    .select('submission_count, window_start')
    .eq('fingerprint_hash', fingerprintHash)
    .maybeSingle()

  const now = Date.now()
  if (throttleRow) {
    const windowAge = now - new Date(throttleRow.window_start).getTime()
    if (windowAge > RATE_LIMIT_WINDOW_MS) {
      await supabase
        .schema('app')
        .from('submission_throttle')
        .update({ submission_count: 1, window_start: new Date().toISOString() })
        .eq('fingerprint_hash', fingerprintHash)
    } else if (throttleRow.submission_count >= RATE_LIMIT_MAX) {
      return json({ error: 'Submission limit reached. Please try again later.' }, 429)
    } else {
      await supabase
        .schema('app')
        .from('submission_throttle')
        .update({ submission_count: throttleRow.submission_count + 1 })
        .eq('fingerprint_hash', fingerprintHash)
    }
  } else {
    await supabase.schema('app').from('submission_throttle').insert({ fingerprint_hash: fingerprintHash })
  }

  const { data: inserted, error: insertError } = await supabase
    .schema('app')
    .from('reports')
    .insert(report)
    .select('id')
    .single()

  if (insertError || !inserted) {
    console.error('report insert failed', insertError)
    return json({ error: 'Could not save report.' }, 500)
  }

  if (contact && typeof contact === 'object') {
    const verifyTokenHash = await sha256Hex(randomToken())
    const { error: contactError } = await supabase
      .schema('app')
      .from('report_contacts')
      .insert({ ...contact, report_id: inserted.id, verify_token_hash: verifyTokenHash })

    if (contactError) {
      // The report itself is already saved; log and continue rather than
      // fail the whole submission over the optional contact record.
      console.error('report_contacts insert failed', contactError)
    }
    // TODO: send a verification email containing the raw token (never the
    // hash) via a transactional email provider, once one is configured.
    // Until then, disclosure_tier != 'anonymous' reports are stored but
    // remain functionally "unverified" — email_verified stays false.
  }

  return json({ id: inserted.id }, 201)
})
