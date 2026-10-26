import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { Registration } from '../api/client'
import RegistrationList from './RegistrationList'

function registration(id: number, status: string, title: string): Registration {
  return {
    id,
    student_id: 10 + id,
    activity_id: 20 + id,
    status,
    created_at: '2026-10-01T00:00:00Z',
    payment_id: status === 'paid' ? 100 + id : null,
    student: { id: 10 + id, name: `Child ${id}`, school_id: 1, parent_id: 1 },
    activity: {
      id: 20 + id,
      school_id: 1,
      type: 'trip',
      title,
      date: '2026-09-01',
      location: null,
      cost_cents: 4550,
      description: null,
    },
  }
}

function setup(registrations: Registration[]) {
  const onPay = vi.fn()
  const onViewReceipt = vi.fn()
  render(
    <RegistrationList
      registrations={registrations}
      onPay={onPay}
      onViewReceipt={onViewReceipt}
    />,
  )
  return { onPay, onViewReceipt }
}

test('lists paid and unpaid registrations, each with its status', () => {
  setup([
    registration(1, 'registered', 'Zoo trip'),
    registration(2, 'paid', 'Museum trip'),
  ])

  expect(screen.getByText('Zoo trip')).toBeInTheDocument()
  expect(screen.getByText('Museum trip')).toBeInTheDocument()
  expect(screen.getByText('Awaiting payment')).toBeInTheDocument()
  expect(screen.getByText('Paid')).toBeInTheDocument()
  expect(screen.getByText(/Child 1/)).toBeInTheDocument()
})

test('renders nothing without registrations', () => {
  const { container } = render(
    <RegistrationList
      registrations={[]}
      onPay={vi.fn()}
      onViewReceipt={vi.fn()}
    />,
  )

  expect(container).toBeEmptyDOMElement()
})

test('an unpaid registration has Pay and no receipt button', async () => {
  const reg = registration(1, 'registered', 'Zoo trip')
  const { onPay } = setup([reg])

  await userEvent.click(screen.getByRole('button', { name: 'Pay' }))

  expect(onPay).toHaveBeenCalledWith(reg)
  expect(
    screen.queryByRole('button', { name: 'View receipt' }),
  ).not.toBeInTheDocument()
})

test('a paid registration has View receipt and no Pay button', async () => {
  const reg = registration(2, 'paid', 'Museum trip')
  const { onViewReceipt } = setup([reg])

  await userEvent.click(screen.getByRole('button', { name: 'View receipt' }))

  expect(onViewReceipt).toHaveBeenCalledWith(reg)
  expect(screen.queryByRole('button', { name: 'Pay' })).not.toBeInTheDocument()
})
