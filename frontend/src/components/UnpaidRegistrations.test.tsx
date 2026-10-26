import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import type { Registration } from '../api/client'
import UnpaidRegistrations from './UnpaidRegistrations'

function registration(id: number, status: string, title: string): Registration {
  return {
    id,
    student_id: 10 + id,
    activity_id: 20 + id,
    status,
    created_at: '2026-10-01T00:00:00Z',
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

test('lists only unpaid registrations, past trips included', () => {
  render(
    <UnpaidRegistrations
      registrations={[
        registration(1, 'registered', 'Zoo trip'),
        registration(2, 'paid', 'Museum trip'),
      ]}
      onPay={vi.fn()}
    />,
  )

  expect(screen.getByText('Zoo trip')).toBeInTheDocument()
  expect(screen.queryByText('Museum trip')).not.toBeInTheDocument()
  expect(screen.getByText(/Child 1/)).toBeInTheDocument()
  expect(screen.getByText(/\$45\.50/)).toBeInTheDocument()
})

test('renders nothing when every registration is paid', () => {
  const { container } = render(
    <UnpaidRegistrations
      registrations={[registration(1, 'paid', 'Zoo trip')]}
      onPay={vi.fn()}
    />,
  )

  expect(container).toBeEmptyDOMElement()
})

test('Pay passes the registration to onPay', async () => {
  const onPay = vi.fn()
  const reg = registration(1, 'registered', 'Zoo trip')
  render(<UnpaidRegistrations registrations={[reg]} onPay={onPay} />)

  await userEvent.click(screen.getByRole('button', { name: 'Pay' }))

  expect(onPay).toHaveBeenCalledWith(reg)
})
