import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

function Broken(): never {
  throw new Error('boom')
}

test('shows a fallback and logs when a child throws', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  render(
    <ErrorBoundary>
      <Broken />
    </ErrorBoundary>,
  )

  expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
  expect(consoleError).toHaveBeenCalledWith(
    'Unexpected error',
    expect.any(Error),
    expect.any(String),
  )
  consoleError.mockRestore()
})

test('renders its children when nothing throws', () => {
  render(
    <ErrorBoundary>
      <p>fine</p>
    </ErrorBoundary>,
  )

  expect(screen.getByText('fine')).toBeInTheDocument()
})
