import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import ParentSelect from './ParentSelect'

const parents = [
  { id: 1, name: 'Aroha Smith', email: 'aroha@example.com' },
  { id: 2, name: 'Ben Jones', email: 'ben@example.com' },
]

test('lists every parent plus a placeholder', () => {
  render(
    <ParentSelect parents={parents} selectedId={null} onChange={vi.fn()} />,
  )

  expect(
    screen.getByRole('option', { name: 'Select a parent' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('option', { name: 'Aroha Smith' }),
  ).toBeInTheDocument()
  expect(screen.getByRole('option', { name: 'Ben Jones' })).toBeInTheDocument()
})

test('reports the chosen parent id', async () => {
  const onChange = vi.fn()
  render(
    <ParentSelect parents={parents} selectedId={null} onChange={onChange} />,
  )

  await userEvent.selectOptions(screen.getByRole('combobox'), 'Ben Jones')

  expect(onChange).toHaveBeenCalledWith(2)
})

test('reports null when the placeholder is chosen', async () => {
  const onChange = vi.fn()
  render(<ParentSelect parents={parents} selectedId={1} onChange={onChange} />)

  await userEvent.selectOptions(screen.getByRole('combobox'), 'Select a parent')

  expect(onChange).toHaveBeenCalledWith(null)
})
