import { Field } from '../../ui/Field'
import { FieldGroup } from '../../ui/FieldGroup'
import { RadioCards } from '../../ui/RadioCards'
import { CheckboxRow } from '../../ui/CheckboxRow'
import { TextInput } from '../../ui/TextInput'
import type { DisclosureTier } from '../../../types/database'
import type { StepUpdater } from '../types'

const TIER_OPTIONS: { value: DisclosureTier; label: string; description: string }[] = [
  {
    value: 'anonymous',
    label: 'Fully anonymous',
    description: 'No contact info collected at all.',
  },
  {
    value: 'verified_private',
    label: 'Verified, but private',
    description: 'Confirm a real email so your report counts as verified. Never shown publicly.',
  },
  {
    value: 'public',
    label: 'Public',
    description: 'Willing to be named and possibly contacted by press or congressional staff.',
  },
]

export function StepDisclosure({
  disclosureTier,
  email,
  displayName,
  okToContactPress,
  okToContactCongress,
  update,
}: {
  disclosureTier: DisclosureTier
  email: string
  displayName: string
  okToContactPress: boolean
  okToContactCongress: boolean
  update: StepUpdater
}) {
  const needsEmail = disclosureTier !== 'anonymous'

  return (
    <div className="space-y-5">
      <FieldGroup
        label="How do you want to be identified?"
        hint="Reported separately from anonymous data, so the dataset can't be dismissed as unverifiable anecdote — see METHODOLOGY.md."
        required
      >
        <RadioCards
          name="disclosureTier"
          options={TIER_OPTIONS}
          value={disclosureTier}
          onChange={(value) => update({ disclosureTier: value })}
        />
      </FieldGroup>

      {needsEmail && (
        <>
          <Field label="Email address" hint="Never displayed publicly, at any tier." required>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="you@example.com"
            />
          </Field>

          {disclosureTier === 'public' && (
            <Field label="Name to display publicly" hint="Optional — leave blank to stay unnamed even at the public tier.">
              <TextInput
                value={displayName}
                onChange={(e) => update({ displayName: e.target.value })}
              />
            </Field>
          )}

          <div className="space-y-2">
            <CheckboxRow
              label="OK to be contacted by press"
              checked={okToContactPress}
              onChange={(checked) => update({ okToContactPress: checked })}
            />
            <CheckboxRow
              label="OK to be contacted by congressional staff"
              checked={okToContactCongress}
              onChange={(checked) => update({ okToContactCongress: checked })}
            />
          </div>
        </>
      )}
    </div>
  )
}
