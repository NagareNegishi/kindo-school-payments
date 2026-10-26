import type { InputHTMLAttributes, ReactNode } from 'react'
import Input from './Input'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string
  label: string
  error?: string | null
  /** Control shown beside the input, such as a submit button. */
  action?: ReactNode
}

/** Label, input and inline error for one form field, with the aria wiring between them. */
export default function Field({ id, label, error, action, ...rest }: Props) {
  return (
    <div>
      <label className="block text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />
        {action}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
