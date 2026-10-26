import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import ReceiptView from './ReceiptView'

test('shows transaction ID, amount, child, trip and card last 4', () => {
  render(
    <ReceiptView
      onDone={() => {}}
      receipt={{
        id: 5,
        registration_id: 7,
        status: 'success',
        amount_cents: 4550,
        legacy_transaction_id: 'TXN-123',
        card_last4: '1111',
        created_at: '2026-10-26T01:00:00Z',
        student_name: 'Mia Smith',
        activity_title: 'Zoo trip',
        activity_date: '2026-11-05',
      }}
    />,
  )

  expect(screen.getByText('TXN-123')).toBeInTheDocument()
  expect(screen.getByText('$45.50')).toBeInTheDocument()
  expect(screen.getByText('Mia Smith')).toBeInTheDocument()
  expect(screen.getByText('Zoo trip')).toBeInTheDocument()
  expect(screen.getByText('ending 1111')).toBeInTheDocument()
  expect(screen.getByText(/October 2026/)).toBeInTheDocument()
})
