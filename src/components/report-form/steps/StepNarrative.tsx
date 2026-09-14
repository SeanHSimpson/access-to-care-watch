import { Field } from '../../ui/Field'
import type { StepUpdater } from '../types'

const MAX_LENGTH = 2000

export function StepNarrative({
  narrative,
  update,
}: {
  narrative: string
  update: StepUpdater
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <p className="font-semibold">Before you write anything here:</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>No medical details — diagnoses, symptoms, or treatment specifics.</li>
          <li>No provider names, rank, unit, or duty title.</li>
          <li>No DoD ID / EDIPI, date of birth, or other ID numbers.</li>
        </ul>
        <p className="mt-1">
          A moderator reviews every narrative before publication and will redact anything that
          shouldn't be there — but the fastest way to protect your privacy is to leave it out in
          the first place.
        </p>
      </div>

      <Field
        label="What happened, in your own words (optional)"
        hint={`${narrative.length} / ${MAX_LENGTH} characters`}
      >
        <textarea
          value={narrative}
          maxLength={MAX_LENGTH}
          onChange={(e) => update({ narrative: e.target.value })}
          rows={6}
          placeholder="Focus on the access problem: what you asked for, what you were told, what you had to do instead."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </Field>
    </div>
  )
}
