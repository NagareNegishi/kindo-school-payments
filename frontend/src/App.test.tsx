import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import * as client from './api/client'

beforeEach(() => {
  vi.spyOn(client, 'listParents').mockResolvedValue([])
})

afterEach(() => {
  vi.restoreAllMocks()
})

const trip: client.Activity = {
  id: 1,
  school_id: 1,
  type: 'trip',
  title: 'Zoo trip',
  date: '2026-11-05',
  location: 'Auckland Zoo',
  cost_cents: 4550,
  description: 'A day with the animals.',
}

test('renders the app heading', async () => {
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  render(<App />)
  expect(
    screen.getByRole('heading', { name: /kindo school payments/i }),
  ).toBeInTheDocument()
  await screen.findByText(/no upcoming trips/i)
})

test('lists upcoming trips with title, date, location, cost and description', async () => {
  vi.spyOn(client, 'listActivities').mockResolvedValue([trip])
  render(<App />)

  expect(await screen.findByText('Zoo trip')).toBeInTheDocument()
  expect(screen.getByText(/5 November 2026/)).toBeInTheDocument()
  expect(screen.getByText('Auckland Zoo')).toBeInTheDocument()
  expect(screen.getByText('$45.50')).toBeInTheDocument()
  expect(screen.getByText('A day with the animals.')).toBeInTheDocument()
})

test('shows an empty state when there are no trips', async () => {
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  render(<App />)
  expect(await screen.findByText(/no upcoming trips/i)).toBeInTheDocument()
})

test('the header dropdown lists the parents from the API', async () => {
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  render(<App />)

  expect(
    await screen.findByRole('option', { name: 'Aroha Smith' }),
  ).toBeInTheDocument()
})

test('choosing a parent shows their unpaid registrations', async () => {
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  const listRegistrations = vi
    .spyOn(client, 'listRegistrations')
    .mockResolvedValue([
      {
        id: 7,
        student_id: 3,
        activity_id: 1,
        status: 'registered',
        created_at: '2026-10-01T00:00:00Z',
        payment_id: null,
        student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
        activity: trip,
      },
    ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  expect(screen.queryByText('Awaiting payment')).not.toBeInTheDocument()

  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')

  expect(await screen.findByText('Awaiting payment')).toBeInTheDocument()
  expect(screen.getByText(/Mia Smith/)).toBeInTheDocument()
  expect(listRegistrations).toHaveBeenCalledWith(1)
})

test('View receipt on a paid registration opens its receipt', async () => {
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  vi.spyOn(client, 'listRegistrations').mockResolvedValue([
    {
      id: 7,
      student_id: 3,
      activity_id: 1,
      status: 'paid',
      created_at: '2026-10-01T00:00:00Z',
      payment_id: 5,
      student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
      activity: trip,
    },
  ])
  const getPayment = vi.spyOn(client, 'getPayment').mockResolvedValue({
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
  })
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  await userEvent.click(
    await screen.findByRole('button', { name: 'View receipt' }),
  )

  expect(await screen.findByText('TXN-123')).toBeInTheDocument()
  expect(getPayment).toHaveBeenCalledWith(5)
})

test('a receipt that fails to load shows an error', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  vi.spyOn(client, 'listRegistrations').mockResolvedValue([
    {
      id: 7,
      student_id: 3,
      activity_id: 1,
      status: 'paid',
      created_at: '2026-10-01T00:00:00Z',
      payment_id: 5,
      student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
      activity: trip,
    },
  ])
  vi.spyOn(client, 'getPayment').mockRejectedValue(new Error('offline'))
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  await userEvent.click(
    await screen.findByRole('button', { name: 'View receipt' }),
  )

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not load the receipt',
  )
})

test('registering a child for a trip calls the API and closes the picker', async () => {
  const mia = { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 }
  vi.spyOn(client, 'listActivities').mockResolvedValue([trip])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([mia])
  const listRegistrations = vi
    .spyOn(client, 'listRegistrations')
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      {
        id: 7,
        student_id: 3,
        activity_id: 1,
        status: 'registered',
        created_at: '2026-10-01T00:00:00Z',
        payment_id: null,
        student: mia,
        activity: trip,
      },
    ])
  const createRegistration = vi
    .spyOn(client, 'createRegistration')
    .mockResolvedValue({
      id: 7,
      student_id: 3,
      activity_id: 1,
      status: 'registered',
      created_at: '2026-10-01T00:00:00Z',
    })
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  expect(
    screen.queryByRole('button', { name: 'Register a child' }),
  ).not.toBeInTheDocument()

  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  await userEvent.click(
    await screen.findByRole('button', { name: 'Register a child' }),
  )
  await userEvent.click(screen.getByRole('button', { name: 'Mia Smith' }))

  expect(createRegistration).toHaveBeenCalledWith(3, 1)
  expect(await screen.findByText('Awaiting payment')).toBeInTheDocument()
  expect(screen.queryByText('Select a child')).not.toBeInTheDocument()
  expect(listRegistrations).toHaveBeenCalledTimes(2)
  expect(screen.getByLabelText('Card number')).toBeInTheDocument()
})

test('the Pay button opens the payment form and Cancel closes it', async () => {
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  vi.spyOn(client, 'listRegistrations').mockResolvedValue([
    {
      id: 7,
      student_id: 3,
      activity_id: 1,
      status: 'registered',
      created_at: '2026-10-01T00:00:00Z',
      payment_id: null,
      student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
      activity: trip,
    },
  ])
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument()

  await userEvent.click(await screen.findByRole('button', { name: 'Pay' }))
  expect(screen.getByLabelText('Card number')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument()
})

test('paying shows the receipt and drops the registration from the unpaid list', async () => {
  const registration: client.Registration = {
    id: 7,
    student_id: 3,
    activity_id: 1,
    status: 'registered',
    created_at: '2026-10-01T00:00:00Z',
    payment_id: null,
    student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
    activity: trip,
  }
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  vi.spyOn(client, 'listRegistrations')
    .mockResolvedValueOnce([registration])
    .mockResolvedValueOnce([])
  const createPayment = vi.spyOn(client, 'createPayment').mockResolvedValue({
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
  })
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  await userEvent.click(await screen.findByRole('button', { name: 'Pay' }))
  await userEvent.type(
    screen.getByLabelText('Card number'),
    '4111 1111 1111 1111',
  )
  await userEvent.type(screen.getByLabelText('Expiry (MM/YY)'), '12/99')
  await userEvent.type(screen.getByLabelText('CVV'), '123')
  await userEvent.click(screen.getByRole('button', { name: /^Pay \$/ }))

  expect(await screen.findByText('TXN-123')).toBeInTheDocument()
  expect(createPayment).toHaveBeenCalledWith(7, {
    card_number: '4111 1111 1111 1111',
    expiry_date: '12/99',
    cvv: '123',
  })
  expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument()
  expect(screen.queryByText('Awaiting payment')).not.toBeInTheDocument()
})

test('switching parent closes an open payment form', async () => {
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
    { id: 2, name: 'Tom Wilson', email: 'tom@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  vi.spyOn(client, 'listRegistrations').mockImplementation(async (id) =>
    id === 1
      ? [
          {
            id: 7,
            student_id: 3,
            activity_id: 1,
            status: 'registered',
            created_at: '2026-10-01T00:00:00Z',
            payment_id: null,
            student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
            activity: trip,
          },
        ]
      : [],
  )
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  await userEvent.click(await screen.findByRole('button', { name: 'Pay' }))
  expect(screen.getByLabelText('Card number')).toBeInTheDocument()

  await userEvent.selectOptions(screen.getByRole('combobox'), 'Tom Wilson')

  expect(screen.queryByLabelText('Card number')).not.toBeInTheDocument()
})

test('a declined payment keeps the form open with the processor message', async () => {
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  vi.spyOn(client, 'listRegistrations').mockResolvedValue([
    {
      id: 7,
      student_id: 3,
      activity_id: 1,
      status: 'registered',
      created_at: '2026-10-01T00:00:00Z',
      payment_id: null,
      student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
      activity: trip,
    },
  ])
  vi.spyOn(client, 'createPayment').mockRejectedValue(
    new client.ApiError(402, 'payment_declined', 'Card declined.', null),
  )
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  await userEvent.click(await screen.findByRole('button', { name: 'Pay' }))
  await userEvent.type(
    screen.getByLabelText('Card number'),
    '4111 1111 1111 1111',
  )
  await userEvent.type(screen.getByLabelText('Expiry (MM/YY)'), '12/99')
  await userEvent.type(screen.getByLabelText('CVV'), '123')
  await userEvent.click(screen.getByRole('button', { name: /^Pay \$/ }))

  expect(await screen.findByRole('alert')).toHaveTextContent('Card declined.')
  expect(screen.getByLabelText('Card number')).toHaveValue(
    '4111 1111 1111 1111',
  )
})

test('a child registered for one trip can still be picked for another', async () => {
  const mia = { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 }
  const otherTrip = { ...trip, id: 2, title: 'Museum visit' }
  vi.spyOn(client, 'listActivities').mockResolvedValue([trip, otherTrip])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([mia])
  vi.spyOn(client, 'listRegistrations').mockResolvedValue([
    {
      id: 7,
      student_id: 3,
      activity_id: 1,
      status: 'registered',
      created_at: '2026-10-01T00:00:00Z',
      payment_id: null,
      student: mia,
      activity: trip,
    },
  ])
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  const [forZoo, forMuseum] = await screen.findAllByRole('button', {
    name: 'Register a child',
  })

  await userEvent.click(forMuseum)
  expect(screen.getByRole('button', { name: 'Mia Smith' })).toBeEnabled()
  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  await userEvent.click(forZoo)
  expect(screen.getByRole('button', { name: /Mia Smith/ })).toBeDisabled()
})

test('opening a payment form closes the receipt on screen', async () => {
  const registration = (id: number): client.Registration => ({
    id,
    student_id: 3,
    activity_id: 1,
    status: 'registered',
    created_at: '2026-10-01T00:00:00Z',
    payment_id: null,
    student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
    activity: trip,
  })
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  vi.spyOn(client, 'listRegistrations')
    .mockResolvedValueOnce([registration(7), registration(8)])
    .mockResolvedValueOnce([registration(8)])
  vi.spyOn(client, 'createPayment').mockResolvedValue({
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
  })
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  await userEvent.click(
    (await screen.findAllByRole('button', { name: 'Pay' }))[0],
  )
  await userEvent.type(
    screen.getByLabelText('Card number'),
    '4111 1111 1111 1111',
  )
  await userEvent.type(screen.getByLabelText('Expiry (MM/YY)'), '12/99')
  await userEvent.type(screen.getByLabelText('CVV'), '123')
  await userEvent.click(screen.getByRole('button', { name: /^Pay \$/ }))
  await screen.findByText('TXN-123')

  await userEvent.click(screen.getByRole('button', { name: 'Pay' }))

  expect(screen.getByLabelText('Card number')).toBeInTheDocument()
  expect(screen.queryByText('TXN-123')).not.toBeInTheDocument()
})

test('a receipt is not shown under another parent after a switch mid-payment', async () => {
  const registration: client.Registration = {
    id: 7,
    student_id: 3,
    activity_id: 1,
    status: 'registered',
    created_at: '2026-10-01T00:00:00Z',
    payment_id: null,
    student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
    activity: trip,
  }
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
    { id: 2, name: 'Tom Wilson', email: 'tom@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  vi.spyOn(client, 'listRegistrations').mockImplementation(async (id) =>
    id === 1 ? [registration] : [],
  )
  let finishPayment: (receipt: client.Receipt) => void = () => {}
  vi.spyOn(client, 'createPayment').mockReturnValue(
    new Promise((resolve) => {
      finishPayment = resolve
    }),
  )
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  await userEvent.click(await screen.findByRole('button', { name: 'Pay' }))
  await userEvent.type(
    screen.getByLabelText('Card number'),
    '4111 1111 1111 1111',
  )
  await userEvent.type(screen.getByLabelText('Expiry (MM/YY)'), '12/99')
  await userEvent.type(screen.getByLabelText('CVV'), '123')
  await userEvent.click(screen.getByRole('button', { name: /^Pay \$/ }))
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Tom Wilson')

  await act(async () => {
    finishPayment({
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
    })
  })

  expect(screen.queryByText('TXN-123')).not.toBeInTheDocument()
})

test('a failed parents load shows an alert and Try again reloads them', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents')
    .mockRejectedValueOnce(new Error('down'))
    .mockResolvedValueOnce([
      { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
    ])
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /could not load the parents/i,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

  expect(
    await screen.findByRole('option', { name: 'Aroha Smith' }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test("a failed load of a parent's data shows an alert and Try again reloads it", async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(client, 'listActivities').mockResolvedValue([])
  vi.spyOn(client, 'listParents').mockResolvedValue([
    { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  ])
  vi.spyOn(client, 'listStudents').mockResolvedValue([])
  vi.spyOn(client, 'listRegistrations')
    .mockRejectedValueOnce(new Error('down'))
    .mockResolvedValueOnce([
      {
        id: 7,
        student_id: 3,
        activity_id: 1,
        status: 'registered',
        created_at: '2026-10-01T00:00:00Z',
        payment_id: null,
        student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
        activity: trip,
      },
    ])
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /could not load this parent/i,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

  expect(await screen.findByText('Awaiting payment')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('shows an error and logs it when loading fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(client, 'listActivities').mockRejectedValue(new Error('down'))
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i)
  expect(consoleError).toHaveBeenCalled()
})
