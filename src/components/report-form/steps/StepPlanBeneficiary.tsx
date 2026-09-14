import { FieldGroup } from '../../ui/FieldGroup'
import { RadioCards } from '../../ui/RadioCards'
import type { BeneficiaryCategory, PlanType } from '../../../types/database'
import type { StepUpdater } from '../types'

const PLAN_OPTIONS: { value: PlanType; label: string }[] = [
  { value: 'prime', label: 'TRICARE Prime' },
  { value: 'prime_remote', label: 'TRICARE Prime Remote' },
  { value: 'prime_overseas', label: 'TRICARE Prime Overseas' },
  { value: 'select', label: 'TRICARE Select' },
  { value: 'tricare_for_life', label: 'TRICARE For Life' },
  { value: 'other', label: 'Other' },
  { value: 'unsure', label: "I'm not sure" },
]

const BENEFICIARY_OPTIONS: { value: BeneficiaryCategory; label: string }[] = [
  { value: 'active_duty', label: 'Active duty service member' },
  { value: 'guard_reserve', label: 'Guard / Reserve' },
  { value: 'active_duty_family', label: 'Active duty family member' },
  { value: 'retiree', label: 'Retiree' },
  { value: 'retiree_family', label: 'Retiree family member' },
  { value: 'survivor', label: 'Survivor' },
  { value: 'other', label: 'Other' },
]

export function StepPlanBeneficiary({
  plan,
  beneficiaryCategory,
  update,
}: {
  plan: PlanType | null
  beneficiaryCategory: BeneficiaryCategory | null
  update: StepUpdater
}) {
  return (
    <div className="space-y-6">
      <FieldGroup label="Which TRICARE plan?" required>
        <RadioCards
          name="plan"
          options={PLAN_OPTIONS}
          value={plan}
          onChange={(value) => update({ plan: value })}
        />
      </FieldGroup>
      <FieldGroup label="Which best describes you?" required>
        <RadioCards
          name="beneficiaryCategory"
          options={BENEFICIARY_OPTIONS}
          value={beneficiaryCategory}
          onChange={(value) => update({ beneficiaryCategory: value })}
        />
      </FieldGroup>
    </div>
  )
}
