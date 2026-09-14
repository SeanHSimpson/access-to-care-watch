import { ReportForm } from '../components/report-form/ReportForm'

export function Report() {
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-2xl font-bold text-slate-900">Report your wait time</h1>
        <p className="mt-1 text-sm text-slate-600">
          Takes about 3 minutes. No names, no medical details, no DoD ID — see the warning in the
          narrative step for specifics.
        </p>
      </div>
      <ReportForm />
    </div>
  )
}
