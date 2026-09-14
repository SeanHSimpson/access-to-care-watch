import { FieldGroup } from '../../ui/FieldGroup'
import { RadioCards } from '../../ui/RadioCards'
import { CheckboxRow } from '../../ui/CheckboxRow'
import { CARE_TYPE_LABELS, FALLBACK_STANDARDS } from '../../../lib/standards'
import type { CareType, CareVenue } from '../../../types/database'
import type { StepUpdater } from '../types'

const CARE_TYPE_OPTIONS: { value: CareType; label: string; description: string }[] = (
  Object.keys(CARE_TYPE_LABELS) as CareType[]
).map((value) => ({
  value,
  label: CARE_TYPE_LABELS[value],
  description: `Standard: ${FALLBACK_STANDARDS[value].maxDays} day${
    FALLBACK_STANDARDS[value].maxDays === 1 ? '' : 's'
  }`,
}))

const VENUE_OPTIONS: { value: CareVenue; label: string }[] = [
  { value: 'mtf', label: 'Military treatment facility' },
  { value: 'network', label: 'Civilian TRICARE network' },
  { value: 'unsure', label: "I'm not sure" },
]

export function StepCareType({
  careType,
  venue,
  referralRequired,
  update,
}: {
  careType: CareType | null
  venue: CareVenue | null
  referralRequired: boolean
  update: StepUpdater
}) {
  return (
    <div className="space-y-6">
      <FieldGroup label="What type of care did you need?" required>
        <RadioCards
          name="careType"
          options={CARE_TYPE_OPTIONS}
          value={careType}
          onChange={(value) => update({ careType: value })}
        />
      </FieldGroup>
      <FieldGroup label="Where were you trying to be seen?" required>
        <RadioCards
          name="venue"
          options={VENUE_OPTIONS}
          value={venue}
          onChange={(value) => update({ venue: value })}
        />
      </FieldGroup>
      <CheckboxRow
        label="A referral was required for this care"
        hint="If checked, we'll ask for the date the referral was approved — that's when the access-standard clock legally starts."
        checked={referralRequired}
        onChange={(checked) => update({ referralRequired: checked })}
      />
    </div>
  )
}
