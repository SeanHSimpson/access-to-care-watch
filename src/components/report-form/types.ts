import type {
  BeneficiaryCategory,
  CareType,
  CareVenue,
  DisclosureTier,
  PlanType,
} from '../../types/database'

export interface ReportFormState {
  // Step 1: facility
  facilityId: string | null

  // Step 2: plan & beneficiary
  plan: PlanType | null
  beneficiaryCategory: BeneficiaryCategory | null

  // Step 3: care type & venue
  careType: CareType | null
  venue: CareVenue | null
  referralRequired: boolean

  // Step 4: dates
  dateRequested: string
  referralApprovedDate: string
  dateFirstOffered: string
  dateSeen: string
  /**
   * 'waiting': nothing scheduled/offered yet.
   * 'scheduled': an appointment date has been given but hasn't happened yet —
   *   dateFirstOffered may be in the future. If that scheduled date is
   *   already past the standard, the live calculator documents that before
   *   the appointment even happens.
   * 'happened': already offered and/or seen (dateFirstOffered/dateSeen are
   *   both in the past).
   */
  dateStatus: 'waiting' | 'scheduled' | 'happened' | null

  // Step 5: consequences
  toldToUseUrgentCare: boolean
  toldToUseEr: boolean
  soughtCareOffBase: boolean
  paidOutOfPocket: boolean
  appointmentCancelledByMtf: boolean
  pcmUnassigned: boolean
  missedDutyOrWork: boolean
  conditionWorsened: boolean
  contactedPatientAdvocate: boolean
  filedIceComplaint: boolean
  contactedCongress: boolean

  // Step 6: narrative
  narrative: string

  // Step 7: disclosure
  disclosureTier: DisclosureTier
  email: string
  displayName: string
  okToContactPress: boolean
  okToContactCongress: boolean
}

export const initialFormState: ReportFormState = {
  facilityId: null,
  plan: null,
  beneficiaryCategory: null,
  careType: null,
  venue: null,
  referralRequired: false,
  dateRequested: '',
  referralApprovedDate: '',
  dateFirstOffered: '',
  dateSeen: '',
  dateStatus: null,
  toldToUseUrgentCare: false,
  toldToUseEr: false,
  soughtCareOffBase: false,
  paidOutOfPocket: false,
  appointmentCancelledByMtf: false,
  pcmUnassigned: false,
  missedDutyOrWork: false,
  conditionWorsened: false,
  contactedPatientAdvocate: false,
  filedIceComplaint: false,
  contactedCongress: false,
  narrative: '',
  disclosureTier: 'anonymous',
  email: '',
  displayName: '',
  okToContactPress: false,
  okToContactCongress: false,
}

export const STEP_TITLES = [
  'Facility',
  'Plan & who you are',
  'Type of care',
  'Dates',
  'What happened as a result',
  'Your story (optional)',
  'How to identify your report',
] as const

export type StepUpdater = (patch: Partial<ReportFormState>) => void
