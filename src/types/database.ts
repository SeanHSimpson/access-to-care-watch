// Mirrors supabase/schema.sql. Keep in sync by hand — this project has no
// generated-types pipeline yet. If you add an enum value or column in the
// schema, update it here too.

export type CareType =
  | 'urgent'
  | 'routine_primary'
  | 'specialty'
  | 'preventive'
  | 'behavioral_health'

export type PlanType =
  | 'prime'
  | 'prime_remote'
  | 'prime_overseas'
  | 'select'
  | 'tricare_for_life'
  | 'other'
  | 'unsure'

export type BeneficiaryCategory =
  | 'active_duty'
  | 'guard_reserve'
  | 'active_duty_family'
  | 'retiree'
  | 'retiree_family'
  | 'survivor'
  | 'other'

export type CareVenue = 'mtf' | 'network' | 'unsure'

export type DisclosureTier = 'anonymous' | 'verified_private' | 'public'

export type ReportStatus = 'pending' | 'published' | 'rejected' | 'withdrawn'

/** app.access_standards, readable by anon. */
export interface AccessStandard {
  id: number
  care_type: CareType
  max_days: number
  citation: string
  effective_from: string
  effective_to: string | null
}

/** app_public.facilities_list, readable by anon. */
export interface Facility {
  id: string
  name: string
  installation: string
  branch: string
  state: string | null
  tricare_region: string | null
}

/**
 * Shape of a new row inserted into app.reports by the public form.
 * Generated columns (clock_start, days_to_offer, days_to_seen) and
 * moderation/publication fields are omitted — the database computes or
 * gatekeeps those.
 */
export interface NewReport {
  facility_id: string
  plan: PlanType
  beneficiary_category: BeneficiaryCategory
  care_type: CareType
  venue: CareVenue
  referral_required: boolean
  date_requested: string
  referral_approved_date: string | null
  date_first_offered: string | null
  date_seen: string | null
  still_waiting: boolean
  told_to_use_urgent_care: boolean
  told_to_use_er: boolean
  sought_care_off_base: boolean
  paid_out_of_pocket: boolean
  appointment_cancelled_by_mtf: boolean
  pcm_unassigned: boolean
  missed_duty_or_work: boolean
  condition_worsened: boolean
  contacted_patient_advocate: boolean
  filed_ice_complaint: boolean
  contacted_congress: boolean
  narrative: string | null
  disclosure_tier: DisclosureTier
}

/** Shape of a new row inserted into app.report_contacts, if the tier needs one. */
export interface NewReportContact {
  report_id: string
  email: string
  display_name: string | null
  ok_to_contact_press: boolean
  ok_to_contact_congress: boolean
}

/** app.facility_requests insert, for facilities not yet in the controlled list. */
export interface NewFacilityRequest {
  raw_name: string
  raw_installation: string | null
}

/** app_public.reports_scored */
export interface ReportScored {
  id: string
  facility_name: string
  installation: string
  branch: string
  state: string | null
  tricare_region: string | null
  care_type: CareType
  venue: CareVenue
  plan: PlanType
  beneficiary_category: BeneficiaryCategory
  standard_days: number
  standard_citation: string
  days_waited: number
  days_over_standard: number
  still_waiting: boolean
  told_to_use_er: boolean
  told_to_use_urgent_care: boolean
  sought_care_off_base: boolean
  paid_out_of_pocket: boolean
  condition_worsened: boolean
  contacted_patient_advocate: boolean
  disclosure_tier: DisclosureTier
  display_name: string | null
  narrative: string | null
  submitted_month: string
}

/** app_public.facility_stats */
export interface FacilityStats {
  facility_name: string
  installation: string
  branch: string
  state: string | null
  tricare_region: string | null
  care_type: CareType
  report_count: number
  avg_days_waited: number
  median_days_waited: number
  worst_days_waited: number
  over_standard_count: number
  pct_over_standard: number
  verified_count: number
  still_waiting_count: number
}

/** app_public.summary_by_tier */
export interface SummaryByTier {
  disclosure_tier: DisclosureTier
  care_type: CareType
  report_count: number
  avg_days_waited: number
  pct_over_standard: number
}
