export interface RadioOption<T extends string> {
  value: T
  label: string
  description?: string
}

export function RadioCards<T extends string>({
  name,
  options,
  value,
  onChange,
}: {
  name: string
  options: RadioOption<T>[]
  value: T | null
  onChange: (value: T) => void
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const checked = value === opt.value
        return (
          <label
            key={opt.value}
            className={`flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 text-sm transition ${
              checked
                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={checked}
                onChange={() => onChange(opt.value)}
                className="h-4 w-4 accent-blue-600"
              />
              <span className="font-medium text-slate-800">{opt.label}</span>
            </span>
            {opt.description && (
              <span className="pl-6 text-xs text-slate-500">{opt.description}</span>
            )}
          </label>
        )
      })}
    </div>
  )
}
