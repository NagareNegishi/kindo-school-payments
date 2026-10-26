import { render, screen } from '@testing-library/react'
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
        student: { id: 3, name: 'Mia Smith', school_id: 1, parent_id: 1 },
        activity: trip,
      },
    ])
  render(<App />)

  await screen.findByRole('option', { name: 'Aroha Smith' })
  expect(screen.queryByText('Awaiting payment')).not.toBeInTheDocument()

  await userEvent.selectOptions(screen.getByRole('combobox'), 'Aroha Smith')

  expect(await screen.findByText('Awaiting payment')).toBeInTheDocument()
  expect(screen.getByText(/Mia Smith/)).toBeInTheDocument()
  expect(listRegistrations).toHaveBeenCalledWith(1)
})

test('shows an error and logs it when loading fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(client, 'listActivities').mockRejectedValue(new Error('down'))
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i)
  expect(consoleError).toHaveBeenCalled()
})
