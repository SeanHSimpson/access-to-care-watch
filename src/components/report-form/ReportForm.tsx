import { useState } from 'react'
import { ProgressBar } from './ProgressBar'
import { validateStep } from './validation'
import { initialFormState, STEP_TITLES, type ReportFormState } from './types'
import { StepFacility } from './steps/StepFacility'
import { StepPlanBeneficiary } from './steps/StepPlanBeneficiary'
import { StepCareType } from './steps/StepCareType'
import { StepDates } from './steps/StepDates'
import { StepConsequences } from './steps/StepConsequences'
import { StepNarrative } from './steps/StepNarrative'
import { StepDisclosure } from './steps/StepDisclosure'
import { Turnstile } from '../Turnstile'
import { buildSubmitPayload, submitReport } from '../../lib/submitReport'

const LAST_STEP = STEP_TITLES.length - 1
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY

export function ReportForm() {
  const [step, setStep] = useState(0)
  const [state, setState] = useState<ReportFormState>(initialFormState)
  const [errors, setErrors] = useState<string[]>([])
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submittedId, setSubmittedId] = useState<string | null>(null)

  function update(patch: Partial<ReportFormState>) {
    setState((prev) => ({ ...prev, ...patch }))
  }

  function goNext() {
    const stepErrors = validateStep(step, state)
    if (stepErrors.length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors([])
    setStep((s) => Math.min(s + 1, LAST_STEP))
  }

  function goBack() {
    setErrors([])
    setStep((s) => Math.max(s - 1, 0))
  }

  async function handleSubmit() {
    const stepErrors = validateStep(LAST_STEP, state)
    if (stepErrors.length > 0) {
      setErrors(stepErrors)
      return
    }
    if (!turnstileToken) {
      setErrors(['Complete the verification challenge below before submitting.'])
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = buildSubmitPayload(state, turnstileToken)
      const result = await submitReport(payload)
      setSubmittedId(result.id)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong submitting your report.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedId) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-green-300 bg-green-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-green-900">Report submitted</h2>
        <p className="mt-2 text-sm text-green-800">
          Thank you. Your report is queued for moderation and will appear in the aggregate
          statistics once reviewed. Reference:{' '}
          <code className="rounded bg-white/60 px-1 py-0.5 text-xs">{submittedId}</code>
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      <ProgressBar step={step} />

      {errors.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <ul className="list-disc space-y-0.5 pl-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {step === 0 && <StepFacility facilityId={state.facilityId} update={update} />}
        {step === 1 && (
          <StepPlanBeneficiary
            plan={state.plan}
            beneficiaryCategory={state.beneficiaryCategory}
            update={update}
          />
        )}
        {step === 2 && (
          <StepCareType
            careType={state.careType}
            venue={state.venue}
            referralRequired={state.referralRequired}
            update={update}
          />
        )}
        {step === 3 && (
          <StepDates
            careType={state.careType}
            referralRequired={state.referralRequired}
            dateRequested={state.dateRequested}
            referralApprovedDate={state.referralApprovedDate}
            dateFirstOffered={state.dateFirstOffered}
            dateSeen={state.dateSeen}
            stillWaiting={state.stillWaiting}
            update={update}
          />
        )}
        {step === 4 && <StepConsequences state={state} update={update} />}
        {step === 5 && <StepNarrative narrative={state.narrative} update={update} />}
        {step === 6 && (
          <div className="space-y-5">
            <StepDisclosure
              disclosureTier={state.disclosureTier}
              email={state.email}
              displayName={state.displayName}
              okToContactPress={state.okToContactPress}
              okToContactCongress={state.okToContactCongress}
              update={update}
            />
            {TURNSTILE_SITE_KEY ? (
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
              />
            ) : (
              <p className="text-xs text-amber-700">
                VITE_TURNSTILE_SITE_KEY is not set — submission is disabled until it's configured.
              </p>
            )}
            {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0 || submitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-0"
        >
          Back
        </button>
        {step < LAST_STEP ? (
          <button
            type="button"
            onClick={goNext}
            className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !TURNSTILE_SITE_KEY}
            className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-40"
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        )}
      </div>
    </div>
  )
}
