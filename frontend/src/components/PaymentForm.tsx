import { useRef, useState, type FormEvent } from 'react'
import { type CardInput, type Registration } from '../api/client'
import { formatCost, formatExpiryInput } from '../format'
import { describePaymentError, type PaymentErrorView } from '../paymentErrors'
import { validateCardNumber, validateCvv, validateExpiry } from '../validation'
import Alert from './Alert'
import Button from './Button'
import Card from './Card'
import Field from './Field'

type Field = keyof CardInput

interface Props {
  registration: Registration
  /** Runs the payment; rejects with an ApiError or a network error when it fails. */
  onSubmit: (card: CardInput) => Promise<void>
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

  const [pending, setPending] = useState(false)
  const submitting = useRef(false)
  const [banner, setBanner] = useState<NonNullable<
    PaymentErrorView['banner']
  > | null>(null)

  /** Puts a backend field error on its input; anything else becomes a banner. */
  function showFailure(error: unknown) {
    const view = describePaymentError(error)
    if (view.unexpected) console.error('Payment failed', error)
    if (view.fieldErrors) {
      setErrors((prev) => ({ ...prev, ...view.fieldErrors }))
    }
    setBanner(view.banner ?? null)
  }

  async function submitValues() {
    // State updates are async, so a ref stops a second submit in the same tick.
    if (submitting.current) return
    const next: Partial<Record<Field, string | null>> = {}
    for (const { name } of fields) next[name] = validators[name](values[name])
    setErrors(next)
    if (Object.values(next).some((error) => error !== null)) return
    setBanner(null)
    submitting.current = true
    setPending(true)
    try {
      await onSubmit(values)
    } catch (error) {
      showFailure(error)
    } finally {
      submitting.current = false
      setPending(false)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void submitValues()
  }

  return (
    <Card as="section" className="mb-8">
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
          <Alert>
            <p>{banner.message}</p>
            {banner.canRetry && (
              <Button
                size="sm"
                className="mt-2"
                disabled={pending}
                onClick={() => void submitValues()}
              >
                Retry
              </Button>
            )}
          </Alert>
        )}
        {fields.map(({ name, label, autoComplete }) => (
          <Field
            key={name}
            id={name}
            label={label}
            error={errors[name]}
            inputMode="numeric"
            autoComplete={autoComplete}
            value={values[name]}
            onChange={(e) => {
              const value =
                name === 'expiry_date'
                  ? formatExpiryInput(e.target.value, values[name])
                  : e.target.value
              setValues({ ...values, [name]: value })
              // A backend error is about the old value; blur checks the new one.
              setErrors({ ...errors, [name]: null })
            }}
            onBlur={() =>
              setErrors({ ...errors, [name]: validators[name](values[name]) })
            }
          />
        ))}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" variant="primary" loading={pending}>
            {pending
              ? 'Paying...'
              : `Pay ${formatCost(registration.activity.cost_cents)}`}
          </Button>
          <Button disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
