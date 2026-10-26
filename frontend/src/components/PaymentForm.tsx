import { useState, type FormEvent } from 'react'
import { ApiError, type CardInput, type Registration } from '../api/client'
import { formatCost } from '../format'
import { validateCardNumber, validateCvv, validateExpiry } from '../validation'

type Field = keyof CardInput

interface Props {
  registration: Registration
  /** Runs the payment; rejects with an ApiError or a network error when it fails. */
  onSubmit: (card: CardInput) => Promise<void>
  onCancel: () => void
}

interface Banner {
  message: string
  canRetry: boolean
}

const NETWORK_MESSAGE =
  'Could not reach the server. Check your connection and try again.'

function isField(name: string | null): name is Field {
  return name === 'card_number' || name === 'expiry_date' || name === 'cvv'
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

  const [pending, setPending] = useState(false)
  const [banner, setBanner] = useState<Banner | null>(null)

  /** Puts a backend field error on its input; anything else becomes a banner. */
  function showFailure(error: unknown) {
    if (error instanceof ApiError) {
      if (isField(error.field)) {
        setErrors((prev) => ({
          ...prev,
          [error.field as Field]: error.message,
        }))
        return
      }
      if (error.status < 500) {
        // A decline (402) can be retried; other client errors will not change on retry.
        setBanner({ message: error.message, canRetry: error.status === 402 })
        return
      }
      console.error('Payment failed', error)
      setBanner({ message: error.message, canRetry: true })
      return
    }
    console.error('Payment failed', error)
    setBanner({ message: NETWORK_MESSAGE, canRetry: true })
  }

  async function submitValues() {
    const next: Partial<Record<Field, string | null>> = {}
    for (const { name } of fields) next[name] = validators[name](values[name])
    setErrors(next)
    if (Object.values(next).some((error) => error !== null)) return
    setBanner(null)
    setPending(true)
    try {
      await onSubmit(values)
    } catch (error) {
      showFailure(error)
    } finally {
      setPending(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void submitValues()
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
        {banner !== null && (
          <div
            role="alert"
            className="rounded border border-red-200 bg-red-50 p-3 text-red-800"
          >
            <p>{banner.message}</p>
            {banner.canRetry && (
              <button
                type="button"
                className="mt-2 rounded border border-red-300 px-3 py-1 font-medium disabled:opacity-50"
                disabled={pending}
                onClick={() => void submitValues()}
              >
                Retry
              </button>
            )}
          </div>
        )}
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
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
          >
            {pending && (
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"
              />
            )}
            {pending
              ? 'Paying...'
              : `Pay ${formatCost(registration.activity.cost_cents)}`}
          </button>
          <button
            type="button"
            disabled={pending}
            className="w-full rounded border border-gray-300 px-4 py-2 disabled:opacity-60 sm:w-auto"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  )
}
