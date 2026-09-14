import { STEP_TITLES } from './types'

export function ProgressBar({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>
          Step {step + 1} of {STEP_TITLES.length}
        </span>
        <span>{STEP_TITLES[step]}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
