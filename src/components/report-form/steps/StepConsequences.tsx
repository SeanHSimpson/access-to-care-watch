import { FieldGroup } from '../../ui/FieldGroup'
import { CheckboxRow } from '../../ui/CheckboxRow'
import type { ReportFormState, StepUpdater } from '../types'

type Key = keyof Pick<
  ReportFormState,
  | 'toldToUseUrgentCare'
  | 'toldToUseEr'
  | 'soughtCareOffBase'
  | 'paidOutOfPocket'
  | 'appointmentCancelledByMtf'
  | 'pcmUnassigned'
  | 'missedDutyOrWork'
  | 'conditionWorsened'
>

const CONSEQUENCE_OPTIONS: { key: Key; label: string }[] = [
  { key: 'toldToUseUrgentCare', label: 'Told to use urgent care instead' },
  { key: 'toldToUseEr', label: 'Told to use the emergency room instead' },
  { key: 'soughtCareOffBase', label: 'Sought care off base / outside the network on my own' },
  { key: 'paidOutOfPocket', label: 'Paid out of pocket for care' },
  { key: 'appointmentCancelledByMtf', label: 'My appointment was cancelled by the facility' },
  { key: 'pcmUnassigned', label: 'I had no assigned primary care manager (PCM) at the time' },
  { key: 'missedDutyOrWork', label: 'Missed duty or work because of the wait' },
  { key: 'conditionWorsened', label: 'My condition got worse while waiting' },
]

type EscalationKey = keyof Pick<
  ReportFormState,
  'contactedPatientAdvocate' | 'filedIceComplaint' | 'contactedCongress'
>

const ESCALATION_OPTIONS: { key: EscalationKey; label: string }[] = [
  { key: 'contactedPatientAdvocate', label: 'Contacted a patient advocate' },
  { key: 'filedIceComplaint', label: 'Filed an ICE (Interactive Customer Evaluation) complaint' },
  { key: 'contactedCongress', label: "Contacted a member of Congress's office" },
]

export function StepConsequences({
  state,
  update,
}: {
  state: ReportFormState
  update: StepUpdater
}) {
  return (
    <div className="space-y-6">
      <FieldGroup label="Did any of these happen as a result of the wait?" hint="Check all that apply.">
        <div className="space-y-2">
          {CONSEQUENCE_OPTIONS.map((opt) => (
            <CheckboxRow
              key={opt.key}
              label={opt.label}
              checked={state[opt.key]}
              onChange={(checked) => update({ [opt.key]: checked })}
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup
        label="Had you already tried to escalate this?"
        hint="This helps show that internal channels were tried before this report."
      >
        <div className="space-y-2">
          {ESCALATION_OPTIONS.map((opt) => (
            <CheckboxRow
              key={opt.key}
              label={opt.label}
              checked={state[opt.key]}
              onChange={(checked) => update({ [opt.key]: checked })}
            />
          ))}
        </div>
      </FieldGroup>
    </div>
  )
}
