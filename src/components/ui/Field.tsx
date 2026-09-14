import { cloneElement, useId, type ReactElement } from 'react'

/**
 * For a single form control (text/date/email input, textarea). Renders a
 * real <label htmlFor> so the label is programmatically associated with
 * the control, not just visually next to it — required for screen readers.
 * `children` must be a single element that accepts an `id` prop; Field
 * injects one (or uses `id` if you pass one explicitly).
 */
export function Field({
  label,
  hint,
  error,
  children,
  required,
  id,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactElement<{ id?: string }>
  required?: boolean
  id?: string
}) {
  const generatedId = useId()
  const controlId = id ?? generatedId

  return (
    <div className="block">
      <label htmlFor={controlId} className="block text-sm font-medium text-slate-800">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {hint && <p className="mt-0.5 block text-xs text-slate-500">{hint}</p>}
      <div className="mt-1.5">{cloneElement(children, { id: children.props.id ?? controlId })}</div>
      {error && <p className="mt-1 block text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}
