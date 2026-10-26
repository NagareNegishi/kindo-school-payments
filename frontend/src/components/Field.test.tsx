import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Field from './Field'

test('links the label and shows no error by default', () => {
  render(<Field id="name" label="Child name" />)

  const input = screen.getByLabelText('Child name')
  expect(input).toHaveAttribute('aria-invalid', 'false')
  expect(input).not.toHaveAttribute('aria-describedby')
})

test('an error marks the input invalid and is described by the message', () => {
  render(<Field id="name" label="Child name" error="Name is required." />)

  const input = screen.getByLabelText('Child name')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveAccessibleDescription('Name is required.')
})

test('renders the action beside the input', () => {
  render(<Field id="name" label="Child name" action={<button>Go</button>} />)

  expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
})
