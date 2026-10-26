import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import App from './App'
import * as client from './api/client'

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

test('shows an error and logs it when loading fails', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(client, 'listActivities').mockRejectedValue(new Error('down'))
  render(<App />)

  expect(await screen.findByRole('alert')).toHaveTextContent(/could not load/i)
  expect(consoleError).toHaveBeenCalled()
})
