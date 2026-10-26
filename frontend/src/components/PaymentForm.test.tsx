import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { Registration } from '../api/client'
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

function setup() {
  const onSubmit = vi.fn()
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

test('cancel calls onCancel', async () => {
  const { onCancel } = setup()

  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  expect(onCancel).toHaveBeenCalled()
})
