import type { ReportFormState } from './types'

export function validateStep(step: number, s: ReportFormState): string[] {
  const errors: string[] = []

  switch (step) {
    case 0:
      if (!s.facilityId) errors.push('Select a facility to continue.')
      break
    case 1:
      if (!s.plan) errors.push('Select a plan.')
      if (!s.beneficiaryCategory) errors.push('Select a beneficiary category.')
      break
    case 2:
      if (!s.careType) errors.push('Select a type of care.')
      if (!s.venue) errors.push('Select where you were trying to be seen.')
      break
    case 3:
      if (!s.dateRequested) errors.push('Enter the date you first requested care.')
      if (s.referralRequired && !s.referralApprovedDate) {
        errors.push('Enter the referral approval date, or uncheck "referral required."')
      }
      if (!s.stillWaiting && !s.dateFirstOffered && !s.dateSeen) {
        errors.push(
          'Enter a date you were offered or seen, or check "I\'m still waiting."',
        )
      }
      break
    case 6:
      if (s.disclosureTier !== 'anonymous' && !s.email.trim()) {
        errors.push('Enter an email address, or choose "fully anonymous."')
      }
      if (s.disclosureTier !== 'anonymous' && s.email.trim() && !/^\S+@\S+\.\S+$/.test(s.email.trim())) {
        errors.push('Enter a valid email address.')
      }
      break
    default:
      break
  }

  return errors
}
