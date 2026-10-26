import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ApiError, type Registration } from '../api/client'
import PaymentForm from './PaymentForm'

const registration: Registration = {
  id: 7,
  student_id: 1,
  activity_id: 1,
  status: 'registered',
  created_at: '2026-01-01T00:00:00Z',
  student: { id: 1, name: 'Mia Smith', school_id: 1, parent_id: 1 },
  activity: {
    id: 1,
    school_id: 1,
    type: 'trip',
    title: 'Zoo trip',
    date: '2099-01-01',
    location: 'Zoo',
    cost_cents: 4550,
    description: null,
  },
}

function setup(onSubmit = vi.fn().mockResolvedValue(undefined)) {
  const onCancel = vi.fn()
  render(
    <PaymentForm
      registration={registration}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />,
  )
  return { onSubmit, onCancel }
}

async function fillValid() {
  await userEvent.type(
    screen.getByLabelText('Card number'),
    '4111 1111 1111 1111',
  )
  await userEvent.type(screen.getByLabelText('Expiry (MM/YY)'), '12/99')
  await userEvent.type(screen.getByLabelText('CVV'), '123')
}

test('shows the amount from the trip and has no amount input', () => {
  setup()

  expect(screen.getByText('$45.50')).toBeInTheDocument()
  expect(screen.queryByLabelText(/amount/i)).not.toBeInTheDocument()
})

test('shows a field error on blur', async () => {
  setup()

  await userEvent.type(screen.getByLabelText('CVV'), '12')
  await userEvent.tab()

  expect(screen.getByText('CVV must be 3 digits.')).toBeInTheDocument()
  expect(screen.getByLabelText('CVV')).toHaveAttribute('aria-invalid', 'true')
})

test('submitting an empty form shows every error and sends nothing', async () => {
  const { onSubmit } = setup()

  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))

  expect(screen.getByText('Card number must be 16 digits.')).toBeInTheDocument()
  expect(screen.getByText('Expiry must be MM/YY.')).toBeInTheDocument()
  expect(screen.getByText('CVV must be 3 digits.')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('an expired card is rejected on submit', async () => {
  const { onSubmit } = setup()
  await fillValid()
  await userEvent.clear(screen.getByLabelText('Expiry (MM/YY)'))
  await userEvent.type(screen.getByLabelText('Expiry (MM/YY)'), '01/20')

  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))

  expect(screen.getByText('Card has expired.')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})

test('valid details are submitted as typed', async () => {
  const { onSubmit } = setup()
  await fillValid()

  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))

  expect(onSubmit).toHaveBeenCalledWith({
    card_number: '4111 1111 1111 1111',
    expiry_date: '12/99',
    cvv: '123',
  })
})

test('submit is disabled with a spinner while the payment runs', async () => {
  let finish: () => void = () => {}
  const { onSubmit } = setup(
    vi.fn().mockReturnValue(new Promise<void>((resolve) => (finish = resolve))),
  )
  await fillValid()

  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))

  const button = screen.getByRole('button', { name: 'Paying...' })
  expect(button).toBeDisabled()
  expect(onSubmit).toHaveBeenCalledTimes(1)

  finish()
  expect(await screen.findByRole('button', { name: /^Pay \$/ })).toBeEnabled()
})

test('a second submit while the payment runs is ignored', async () => {
  let finish: () => void = () => {}
  const { onSubmit } = setup(
    vi.fn().mockReturnValue(new Promise<void>((resolve) => (finish = resolve))),
  )
  await fillValid()
  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))

  fireEvent.submit(
    screen.getByRole('button', { name: 'Paying...' }).closest('form')!,
  )

  expect(onSubmit).toHaveBeenCalledTimes(1)
  finish()
  await screen.findByRole('button', { name: /^Pay \$/ })
})

test('a decline shows the processor message and retry resubmits the same input', async () => {
  const onSubmit = vi
    .fn()
    .mockRejectedValueOnce(
      new ApiError(402, 'payment_declined', 'Card declined.', null),
    )
    .mockResolvedValueOnce(undefined)
  setup(onSubmit)
  await fillValid()

  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Card declined.')

  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))

  expect(onSubmit).toHaveBeenCalledTimes(2)
  expect(onSubmit).toHaveBeenLastCalledWith({
    card_number: '4111 1111 1111 1111',
    expiry_date: '12/99',
    cvv: '123',
  })
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('a network error shows a retry banner, logs it and keeps the input', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  setup(vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  await fillValid()

  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /could not reach the server/i,
  )
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  expect(screen.getByLabelText('Card number')).toHaveValue(
    '4111 1111 1111 1111',
  )
  expect(consoleError).toHaveBeenCalled()
  consoleError.mockRestore()
})

test('a server error shows its message with retry', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  setup(
    vi
      .fn()
      .mockRejectedValue(
        new ApiError(500, 'internal_error', 'Something went wrong.', null),
      ),
  )
  await fillValid()

  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Something went wrong.',
  )
  expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
  consoleError.mockRestore()
})

test('a backend field error is shown on that input, not in a banner', async () => {
  setup(
    vi
      .fn()
      .mockRejectedValue(
        new ApiError(422, 'card_expired', 'Card has expired.', 'expiry_date'),
      ),
  )
  await fillValid()

  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))

  expect(await screen.findByText('Card has expired.')).toBeInTheDocument()
  expect(screen.getByLabelText('Expiry (MM/YY)')).toHaveAttribute(
    'aria-invalid',
    'true',
  )
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('a backend field error clears when that input is edited', async () => {
  setup(
    vi
      .fn()
      .mockRejectedValue(
        new ApiError(422, 'card_expired', 'Card has expired.', 'expiry_date'),
      ),
  )
  await fillValid()
  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))
  await screen.findByText('Card has expired.')

  await userEvent.type(screen.getByLabelText('Expiry (MM/YY)'), '0')

  expect(screen.queryByText('Card has expired.')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Expiry (MM/YY)')).toHaveAttribute(
    'aria-invalid',
    'false',
  )
})

test('a conflict shows its message without a retry button', async () => {
  setup(
    vi
      .fn()
      .mockRejectedValue(
        new ApiError(409, 'already_paid', 'This trip is already paid.', null),
      ),
  )
  await fillValid()

  await userEvent.click(screen.getByRole('button', { name: /^Pay/ }))

  expect(await screen.findByRole('alert')).toHaveTextContent('already paid')
  expect(
    screen.queryByRole('button', { name: 'Retry' }),
  ).not.toBeInTheDocument()
})

test('cancel calls onCancel', async () => {
  const { onCancel } = setup()

  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  expect(onCancel).toHaveBeenCalled()
})
