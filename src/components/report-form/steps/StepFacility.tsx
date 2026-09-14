import { useMemo, useState } from 'react'
import { Field } from '../../ui/Field'
import { TextInput } from '../../ui/TextInput'
import { useFacilities } from '../../../lib/facilities'
import { appSchema } from '../../../lib/supabase'
import type { StepUpdater } from '../types'

export function StepFacility({
  facilityId,
  update,
}: {
  facilityId: string | null
  update: StepUpdater
}) {
  const { facilities, loading, error } = useFacilities()
  const [search, setSearch] = useState('')
  const [requesting, setRequesting] = useState(false)
  const [requestSent, setRequestSent] = useState(false)
  const [rawName, setRawName] = useState('')
  const [rawInstallation, setRawInstallation] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return facilities
    return facilities.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.installation.toLowerCase().includes(q) ||
        (f.state ?? '').toLowerCase().includes(q),
    )
  }, [facilities, search])

  async function submitFacilityRequest() {
    if (!rawName.trim()) return
    await appSchema()
      .from('facility_requests')
      .insert({ raw_name: rawName.trim(), raw_installation: rawInstallation.trim() || null })
    setRequestSent(true)
  }

  return (
    <div className="space-y-4">
      <Field
        label="Search for your facility"
        hint="Search by facility name, installation, or state."
        required
      >
        <TextInput
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="e.g. Langley, 633d, Portsmouth, VA"
        />
      </Field>

      {loading && <p className="text-sm text-slate-500">Loading facilities…</p>}
      {error && (
        <p className="text-sm text-red-600">
          Couldn't load the facility list ({error}). Check your connection and reload.
        </p>
      )}

      {!loading && !error && (
        <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200">
          {filtered.length === 0 && (
            <p className="p-3 text-sm text-slate-500">No facilities match that search.</p>
          )}
          {filtered.map((f) => {
            const checked = facilityId === f.id
            return (
              <label
                key={f.id}
                className={`flex cursor-pointer items-start gap-2.5 border-b border-slate-100 p-3 text-sm last:border-b-0 ${
                  checked ? 'bg-blue-50' : 'hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="facility"
                  checked={checked}
                  onChange={() => update({ facilityId: f.id })}
                  className="mt-0.5 h-4 w-4 accent-blue-600"
                />
                <span>
                  <span className="block font-medium text-slate-800">{f.name}</span>
                  <span className="block text-xs text-slate-500">
                    {f.installation}
                    {f.state ? `, ${f.state}` : ''} · {f.branch}
                  </span>
                </span>
              </label>
            )
          })}
        </div>
      )}

      <div className="rounded-lg border border-dashed border-slate-300 p-3">
        {!requesting && !requestSent && (
          <button
            type="button"
            onClick={() => setRequesting(true)}
            className="text-sm font-medium text-blue-700 hover:underline"
          >
            My facility isn't listed
          </button>
        )}
        {requesting && !requestSent && (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">
              We keep facilities in a controlled list so the data stays clean. Tell us the name
              and installation and we'll review it for addition — you won't be able to finish a
              full report until it's added, but this gets the ball rolling.
            </p>
            <Field label="Facility name">
              <TextInput value={rawName} onChange={(e) => setRawName(e.target.value)} />
            </Field>
            <Field label="Installation">
              <TextInput
                value={rawInstallation}
                onChange={(e) => setRawInstallation(e.target.value)}
              />
            </Field>
            <button
              type="button"
              onClick={submitFacilityRequest}
              disabled={!rawName.trim()}
              className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Send request
            </button>
          </div>
        )}
        {requestSent && (
          <p className="text-sm text-green-700">
            Thanks — that facility has been queued for review.
          </p>
        )}
      </div>
    </div>
  )
}
