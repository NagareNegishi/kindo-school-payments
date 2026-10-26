import { useState, type FormEvent } from 'react'
import type { Registration } from '../api/client'
import { formatCost } from '../format'
import { validateCardNumber, validateCvv, validateExpiry } from '../validation'

export interface CardInput {
  card_number: string
  expiry_date: string
  cvv: string
}

type Field = keyof CardInput

interface Props {
  registration: Registration
  onSubmit: (card: CardInput) => void
  onCancel: () => void
}

const validators: Record<Field, (value: string) => string | null> = {
  card_number: validateCardNumber,
  expiry_date: (value) => validateExpiry(value),
  cvv: validateCvv,
}

const fields: { name: Field; label: string; autoComplete: string }[] = [
  { name: 'card_number', label: 'Card number', autoComplete: 'cc-number' },
  { name: 'expiry_date', label: 'Expiry (MM/YY)', autoComplete: 'cc-exp' },
  { name: 'cvv', label: 'CVV', autoComplete: 'cc-csc' },
]

/** Card details form for one registration. The amount is shown, never editable. */
export default function PaymentForm({
  registration,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<CardInput>({
    card_number: '',
    expiry_date: '',
    cvv: '',
  })
  const [errors, setErrors] = useState<Partial<Record<Field, string | null>>>(
    {},
  )

  function submit(event: FormEvent) {
    event.preventDefault()
    const next: Partial<Record<Field, string | null>> = {}
    for (const { name } of fields) next[name] = validators[name](values[name])
    setErrors(next)
    if (Object.values(next).some((error) => error !== null)) return
    onSubmit(values)
  }

  return (
    <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold">
        Pay for {registration.activity.title}
      </h2>
      <p className="mt-1 text-sm text-gray-700">{registration.student.name}</p>
      <p className="mt-3">
        Amount to pay:{' '}
        <strong>{formatCost(registration.activity.cost_cents)}</strong>
      </p>

      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        {fields.map(({ name, label, autoComplete }) => (
          <div key={name}>
            <label className="block text-sm font-medium" htmlFor={name}>
              {label}
            </label>
            <input
              id={name}
              inputMode="numeric"
              autoComplete={autoComplete}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              value={values[name]}
              aria-invalid={Boolean(errors[name])}
              aria-describedby={errors[name] ? `${name}-error` : undefined}
              onChange={(e) => setValues({ ...values, [name]: e.target.value })}
              onBlur={() =>
                setErrors({ ...errors, [name]: validators[name](values[name]) })
              }
            />
            {errors[name] && (
              <p id={`${name}-error`} className="mt-1 text-sm text-red-700">
                {errors[name]}
              </p>
            )}
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            Pay {formatCost(registration.activity.cost_cents)}
          </button>
          <button
            type="button"
            className="w-full rounded border border-gray-300 px-4 py-2 sm:w-auto"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
