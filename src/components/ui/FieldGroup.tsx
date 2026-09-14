import type { ReactNode } from 'react'

/**
 * For a group of related controls (radio cards, a checkbox list) where no
 * single `htmlFor` makes sense. A <fieldset>/<legend> pair gives assistive
 * tech the group's name the same way <label htmlFor> does for one control —
 * see Field.tsx for the single-control case.
 */
export function FieldGroup({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="block text-sm font-medium text-slate-800">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </legend>
      {hint && <p className="mt-0.5 block text-xs text-slate-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
      {error && <p className="mt-1 block text-xs font-medium text-red-600">{error}</p>}
    </fieldset>
  )
}
