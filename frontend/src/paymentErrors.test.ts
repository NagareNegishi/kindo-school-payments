import { describe, expect, test } from 'vitest'
import { ApiError } from './api/client'
import { describePaymentError, NETWORK_MESSAGE } from './paymentErrors'

const apiError = (status: number, code: string, field: string | null = null) =>
  new ApiError(status, code, `message for ${code}`, field)

describe('describePaymentError', () => {
  test('a non-API error is the retryable connection banner, logged', () => {
    expect(describePaymentError(new TypeError('Failed to fetch'))).toEqual({
      banner: { message: NETWORK_MESSAGE, canRetry: true },
      unexpected: true,
    })
  })

  test('a decline is a retryable banner with the processor message', () => {
    expect(describePaymentError(apiError(402, 'payment_declined'))).toEqual({
      banner: { message: 'message for payment_declined', canRetry: true },
      unexpected: false,
    })
  })

  test.each(['card_number', 'expiry_date', 'cvv'])(
    'a 422 on %s becomes a field error with no banner',
    (field) => {
      expect(describePaymentError(apiError(422, 'invalid', field))).toEqual({
        fieldErrors: { [field]: 'message for invalid' },
        unexpected: false,
      })
    },
  )

  test('a server error is a retryable banner, logged', () => {
    expect(describePaymentError(apiError(500, 'internal_error'))).toEqual({
      banner: { message: 'message for internal_error', canRetry: true },
      unexpected: true,
    })
  })

  test.each([
    [409, 'already_paid'],
    [409, 'payment_in_progress'],
    [404, 'registration_not_found'],
  ])('a %i %s is a banner without retry', (status, code) => {
    expect(describePaymentError(apiError(status, code))).toEqual({
      banner: { message: `message for ${code}`, canRetry: false },
      unexpected: false,
    })
  })

  test('a 422 on a field that is not a card field is a banner without retry', () => {
    expect(
      describePaymentError(apiError(422, 'invalid', 'registration_id')),
    ).toEqual({
      banner: { message: 'message for invalid', canRetry: false },
      unexpected: false,
    })
  })
})
