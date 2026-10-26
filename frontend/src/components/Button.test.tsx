import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import Button from './Button'

test('calls onClick and defaults to type button', async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Done</Button>)

  const button = screen.getByRole('button', { name: 'Done' })
  expect(button).toHaveAttribute('type', 'button')
  await userEvent.click(button)

  expect(onClick).toHaveBeenCalledTimes(1)
})

test('a disabled button ignores clicks', async () => {
  const onClick = vi.fn()
  render(
    <Button disabled onClick={onClick}>
      Pay
    </Button>,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Pay' }))

  expect(onClick).not.toHaveBeenCalled()
})

test('a loading button is disabled, marked busy and ignores clicks', async () => {
  const onClick = vi.fn()
  render(
    <Button loading onClick={onClick}>
      Paying...
    </Button>,
  )

  const button = screen.getByRole('button', { name: 'Paying...' })
  expect(button).toBeDisabled()
  expect(button).toHaveAttribute('aria-busy', 'true')
  await userEvent.click(button)

  expect(onClick).not.toHaveBeenCalled()
})

test('passes type submit through', () => {
  render(<Button type="submit">Register</Button>)

  expect(screen.getByRole('button', { name: 'Register' })).toHaveAttribute(
    'type',
    'submit',
  )
})
