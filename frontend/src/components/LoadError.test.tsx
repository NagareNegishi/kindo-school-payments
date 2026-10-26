import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import LoadError from './LoadError'

test('shows the message and calls onRetry from the button', async () => {
  const onRetry = vi.fn()
  render(<LoadError message="Could not load parents." onRetry={onRetry} />)

  expect(screen.getByRole('alert')).toHaveTextContent('Could not load parents.')
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

  expect(onRetry).toHaveBeenCalledTimes(1)
})
