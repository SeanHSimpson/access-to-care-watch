import { CARE_TYPE_LABELS, daysBetween, todayIso, useAccessStandards } from '../../lib/standards'
import type { CareType } from '../../types/database'

/**
 * Live "you are N days over/under the standard" readout, computed the same
 * way app_public.reports_scored computes it server-side (see
 * METHODOLOGY.md sections 2-4): clock starts at referral approval if a
 * referral was required, and days waited prefers date_seen, then
 * date_first_offered, then "still waiting as of today."
 */
export function DaysOverStandard({
  careType,
  dateRequested,
  referralApprovedDate,
  dateFirstOffered,
  dateSeen,
  stillWaiting,
}: {
  careType: CareType | null
  dateRequested: string
  referralApprovedDate: string
  dateFirstOffered: string
  dateSeen: string
  stillWaiting: boolean
}) {
  const { standards } = useAccessStandards()

  if (!careType || !dateRequested) return null

  const clockStart = referralApprovedDate || dateRequested
  const resolutionDate = dateSeen || dateFirstOffered || (stillWaiting ? todayIso() : '')
  if (!resolutionDate) return null

  const daysWaited = daysBetween(clockStart, resolutionDate)
  if (daysWaited < 0) return null

  const standard = standards[careType]
  const daysOver = daysWaited - standard.maxDays
  const overStandard = daysOver > 0
  const stillOpen = stillWaiting && !dateSeen && !dateFirstOffered
  // dateSeen is always <= today (the date input enforces that); only a
  // scheduled-but-not-yet-happened dateFirstOffered can land in the future.
  const isFutureAppointment = !stillOpen && resolutionDate > todayIso()

  return (
    <div
      className={`rounded-lg border p-3 text-sm ${
        overStandard ? 'border-red-300 bg-red-50 text-red-900' : 'border-green-300 bg-green-50 text-green-900'
      }`}
    >
      <p className="font-semibold">
        {isFutureAppointment
          ? `Your appointment is scheduled ${daysWaited} day${daysWaited === 1 ? '' : 's'} after this clock starts`
          : `${daysWaited} day${daysWaited === 1 ? '' : 's'} waited${stillOpen ? ' (and counting)' : ''}`}
      </p>
      <p>
        The standard for {CARE_TYPE_LABELS[careType]} is {standard.maxDays} day
        {standard.maxDays === 1 ? '' : 's'} ({standard.citation}).
      </p>
      <p className="font-semibold">
        {overStandard
          ? isFutureAppointment
            ? `Already ${daysOver} day${daysOver === 1 ? '' : 's'} over the standard — before you're even seen.`
            : `${daysOver} day${daysOver === 1 ? '' : 's'} over the standard.`
          : 'Within the standard.'}
      </p>
    </div>
  )
}
