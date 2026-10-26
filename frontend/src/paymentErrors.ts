// Maps an error thrown while paying to what the payment form shows.

import { ApiError, type CardInput } from './api/client'

type Field = keyof CardInput

export interface PaymentErrorView {
  /** A message above the form; `canRetry` adds a retry button. */
  banner?: { message: string; canRetry: boolean }
  /** Backend messages to show on the matching inputs. */
  fieldErrors?: Partial<Record<Field, string>>
  /** True when the error is unexpected and should go to `console.error`. */
  unexpected: boolean
}

export const NETWORK_MESSAGE =
  'Could not reach the server. Check your connection and try again.'

const cardFields: readonly string[] = ['card_number', 'expiry_date', 'cvv']

function isField(name: string | null): name is Field {
  return name !== null && cardFields.includes(name)
}

/** Turns a failed payment request into a banner and/or per-field messages. */
export function describePaymentError(error: unknown): PaymentErrorView {
  if (!(error instanceof ApiError)) {
    return {
      banner: { message: NETWORK_MESSAGE, canRetry: true },
      unexpected: true,
    }
  }
  if (isField(error.field)) {
    return { fieldErrors: { [error.field]: error.message }, unexpected: false }
  }
  if (error.status >= 500) {
    return {
      banner: { message: error.message, canRetry: true },
      unexpected: true,
    }
  }
  // A decline (402) can be retried; other client errors will not change on retry.
  return {
    banner: { message: error.message, canRetry: error.status === 402 },
    unexpected: false,
  }
}
