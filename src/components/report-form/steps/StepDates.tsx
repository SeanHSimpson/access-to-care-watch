import { Field } from '../../ui/Field'
import { TextInput } from '../../ui/TextInput'
import { CheckboxRow } from '../../ui/CheckboxRow'
import { DaysOverStandard } from '../DaysOverStandard'
import { todayIso } from '../../../lib/standards'
import type { CareType } from '../../../types/database'
import type { StepUpdater } from '../types'

export function StepDates({
  careType,
  referralRequired,
  dateRequested,
  referralApprovedDate,
  dateFirstOffered,
  dateSeen,
  stillWaiting,
  update,
}: {
  careType: CareType | null
  referralRequired: boolean
  dateRequested: string
  referralApprovedDate: string
  dateFirstOffered: string
  dateSeen: string
  stillWaiting: boolean
  update: StepUpdater
}) {
  const max = todayIso()

  return (
    <div className="space-y-5">
      <Field
        label="Date you first requested/asked for this appointment"
        required
      >
        <TextInput
          type="date"
          max={max}
          value={dateRequested}
          onChange={(e) => update({ dateRequested: e.target.value })}
        />
      </Field>

      {referralRequired && (
        <Field
          label="Date the referral was approved"
          hint="Not the date you asked for the referral — the date it was approved. This is when the legal clock starts."
          required
        >
          <TextInput
            type="date"
            min={dateRequested || undefined}
            max={max}
            value={referralApprovedDate}
            onChange={(e) => update({ referralApprovedDate: e.target.value })}
          />
        </Field>
      )}

      <CheckboxRow
        label="I'm still waiting — no appointment has happened yet"
        checked={stillWaiting}
        onChange={(checked) =>
          update({
            stillWaiting: checked,
            ...(checked ? { dateFirstOffered: '', dateSeen: '' } : {}),
          })
        }
      />

      {!stillWaiting && (
        <>
          <Field
            label="Date you were first offered an appointment"
            hint="Leave blank if you were never offered one before being seen."
          >
            <TextInput
              type="date"
              min={dateRequested || undefined}
              max={max}
              value={dateFirstOffered}
              onChange={(e) => update({ dateFirstOffered: e.target.value })}
            />
          </Field>
          <Field label="Date you were actually seen" hint="Leave blank if you weren't seen yet.">
            <TextInput
              type="date"
              min={dateRequested || undefined}
              max={max}
              value={dateSeen}
              onChange={(e) => update({ dateSeen: e.target.value })}
            />
          </Field>
        </>
      )}

      <DaysOverStandard
        careType={careType}
        dateRequested={dateRequested}
        referralApprovedDate={referralApprovedDate}
        dateFirstOffered={dateFirstOffered}
        dateSeen={dateSeen}
        stillWaiting={stillWaiting}
      />
    </div>
  )
}
