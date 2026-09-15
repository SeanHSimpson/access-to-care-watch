import { Field } from '../../ui/Field'
import { FieldGroup } from '../../ui/FieldGroup'
import { RadioCards, type RadioOption } from '../../ui/RadioCards'
import { TextInput } from '../../ui/TextInput'
import { DaysOverStandard } from '../DaysOverStandard'
import { todayIso } from '../../../lib/standards'
import type { CareType } from '../../../types/database'
import type { ReportFormState, StepUpdater } from '../types'

// Schedules more than ~400 days out aren't realistic wait-time reports and
// match the trigger's own future-date guard in supabase/schema.sql.
const MAX_SCHEDULED_DAYS_OUT = 400

type DateStatus = NonNullable<ReportFormState['dateStatus']>

const STATUS_OPTIONS: RadioOption<DateStatus>[] = [
  { value: 'waiting', label: "Still waiting", description: 'Nothing scheduled or offered yet.' },
  {
    value: 'scheduled',
    label: 'Scheduled, not yet happened',
    description: "You have a date, even if it's in the future.",
  },
  { value: 'happened', label: 'Already happened', description: 'You were offered and/or seen.' },
]

export function StepDates({
  careType,
  referralRequired,
  dateRequested,
  referralApprovedDate,
  dateFirstOffered,
  dateSeen,
  dateStatus,
  update,
}: {
  careType: CareType | null
  referralRequired: boolean
  dateRequested: string
  referralApprovedDate: string
  dateFirstOffered: string
  dateSeen: string
  dateStatus: ReportFormState['dateStatus']
  update: StepUpdater
}) {
  const today = todayIso()
  const scheduleMax = new Date(`${today}T00:00:00Z`)
  scheduleMax.setUTCDate(scheduleMax.getUTCDate() + MAX_SCHEDULED_DAYS_OUT)
  const scheduleMaxIso = scheduleMax.toISOString().slice(0, 10)

  function setStatus(status: DateStatus) {
    if (status === 'waiting') {
      update({ dateStatus: status, dateFirstOffered: '', dateSeen: '' })
    } else if (status === 'scheduled') {
      update({ dateStatus: status, dateSeen: '' })
    } else {
      // A future date left over from 'scheduled' doesn't belong in a field
      // capped at today — drop it rather than leave a stale/invalid value.
      update({
        dateStatus: status,
        dateFirstOffered: dateFirstOffered && dateFirstOffered > today ? '' : dateFirstOffered,
      })
    }
  }

  return (
    <div className="space-y-5">
      <Field label="Date you first requested/asked for this appointment" required>
        <TextInput
          type="date"
          max={today}
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
            max={today}
            value={referralApprovedDate}
            onChange={(e) => update({ referralApprovedDate: e.target.value })}
          />
        </Field>
      )}

      <FieldGroup label="Where does this stand?" required>
        <RadioCards name="dateStatus" options={STATUS_OPTIONS} value={dateStatus} onChange={setStatus} />
      </FieldGroup>

      {dateStatus === 'scheduled' && (
        <Field
          label="Date of your scheduled appointment"
          hint="This can be a future date — if it's already past the standard, that's exactly what this site is for."
          required
        >
          <TextInput
            type="date"
            min={dateRequested || undefined}
            max={scheduleMaxIso}
            value={dateFirstOffered}
            onChange={(e) => update({ dateFirstOffered: e.target.value })}
          />
        </Field>
      )}

      {dateStatus === 'happened' && (
        <>
          <Field
            label="Date you were first offered an appointment"
            hint="Leave blank if you were never offered one before being seen."
          >
            <TextInput
              type="date"
              min={dateRequested || undefined}
              max={today}
              value={dateFirstOffered}
              onChange={(e) => update({ dateFirstOffered: e.target.value })}
            />
          </Field>
          <Field label="Date you were actually seen" hint="Leave blank if you weren't seen yet.">
            <TextInput
              type="date"
              min={dateRequested || undefined}
              max={today}
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
        stillWaiting={dateStatus === 'waiting'}
      />
    </div>
  )
}
