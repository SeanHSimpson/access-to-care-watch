import { supabase } from './supabase'
import type { NewReport, NewReportContact } from '../types/database'
import type { ReportFormState } from '../components/report-form/types'

export interface SubmitReportPayload {
  report: NewReport
  contact: Omit<NewReportContact, 'report_id'> | null
  turnstileToken: string
}

export function buildSubmitPayload(state: ReportFormState, turnstileToken: string): SubmitReportPayload {
  const report: NewReport = {
    facility_id: state.facilityId!,
    plan: state.plan!,
    beneficiary_category: state.beneficiaryCategory!,
    care_type: state.careType!,
    venue: state.venue!,
    referral_required: state.referralRequired,
    date_requested: state.dateRequested,
    referral_approved_date: state.referralRequired ? state.referralApprovedDate || null : null,
    date_first_offered: state.dateStatus === 'waiting' ? null : state.dateFirstOffered || null,
    date_seen: state.dateStatus === 'happened' ? state.dateSeen || null : null,
    still_waiting: state.dateStatus === 'waiting',
    told_to_use_urgent_care: state.toldToUseUrgentCare,
    told_to_use_er: state.toldToUseEr,
    sought_care_off_base: state.soughtCareOffBase,
    paid_out_of_pocket: state.paidOutOfPocket,
    appointment_cancelled_by_mtf: state.appointmentCancelledByMtf,
    pcm_unassigned: state.pcmUnassigned,
    missed_duty_or_work: state.missedDutyOrWork,
    condition_worsened: state.conditionWorsened,
    contacted_patient_advocate: state.contactedPatientAdvocate,
    filed_ice_complaint: state.filedIceComplaint,
    contacted_congress: state.contactedCongress,
    narrative: state.narrative.trim() || null,
    disclosure_tier: state.disclosureTier,
  }

  const contact: Omit<NewReportContact, 'report_id'> | null =
    state.disclosureTier === 'anonymous'
      ? null
      : {
          email: state.email.trim(),
          display_name: state.disclosureTier === 'public' ? state.displayName.trim() || null : null,
          ok_to_contact_press: state.okToContactPress,
          ok_to_contact_congress: state.okToContactCongress,
        }

  return { report, contact, turnstileToken }
}

/**
 * Submission never inserts into app.reports directly from the client, even
 * though anon has an insert grant for it. It goes through this edge
 * function so the Turnstile token is verified server-side and the
 * rate-limiting fingerprint is hashed from the request IP without that IP
 * ever reaching Postgres. See supabase/functions/submit-report.
 */
export async function submitReport(payload: SubmitReportPayload) {
  const { data, error } = await supabase.functions.invoke('submit-report', {
    body: payload,
  })
  if (error) throw error
  return data as { id: string }
}
