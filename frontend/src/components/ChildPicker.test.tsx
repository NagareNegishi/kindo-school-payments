import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { ApiError, type Student } from '../api/client'
import ChildPicker from './ChildPicker'

const mia: Student = { id: 1, name: 'Mia Smith', school_id: 1, parent_id: 1 }
const leo: Student = { id: 2, name: 'Leo Smith', school_id: 1, parent_id: 1 }
const ava: Student = { id: 3, name: 'Ava Smith', school_id: 1, parent_id: 1 }

function setup(overrides: Partial<Parameters<typeof ChildPicker>[0]> = {}) {
  const props = {
    students: [mia, leo],
    registeredIds: new Set<number>(),
    onSelect: vi.fn().mockResolvedValue(undefined),
    onAdd: vi.fn().mockResolvedValue(ava),
    onCancel: vi.fn(),
    ...overrides,
  }
  render(<ChildPicker {...props} />)
  return props
}

test('selecting a child calls onSelect with that child', async () => {
  const { onSelect } = setup()

  await userEvent.click(screen.getByRole('button', { name: 'Mia Smith' }))

  expect(onSelect).toHaveBeenCalledWith(mia)
})

test('a child already registered is marked and not selectable', async () => {
  const { onSelect } = setup({ registeredIds: new Set([1]) })

  const button = screen.getByRole('button', { name: /Mia Smith/ })
  expect(button).toBeDisabled()
  expect(screen.getByText('Already registered')).toBeInTheDocument()
  await userEvent.click(button)
  expect(onSelect).not.toHaveBeenCalled()
  expect(screen.getByRole('button', { name: 'Leo Smith' })).toBeEnabled()
})

test('shows a hint when the parent has no children', () => {
  setup({ students: [] })

  expect(screen.getByText(/no children added yet/i)).toBeInTheDocument()
})

test('an empty name shows an error on blur and on submit, and is not sent', async () => {
  const { onAdd } = setup()
  const input = screen.getByLabelText('Add a child')

  await userEvent.click(input)
  await userEvent.tab()
  expect(screen.getByText(/enter the child's name/i)).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Register' }))
  expect(onAdd).not.toHaveBeenCalled()
})

test('adds a trimmed name, registers the new child and clears the field', async () => {
  const { onAdd, onSelect } = setup()
  const input = screen.getByLabelText('Add a child')

  await userEvent.type(input, '  Ava Smith  ')
  await userEvent.click(screen.getByRole('button', { name: 'Register' }))

  expect(onAdd).toHaveBeenCalledWith('Ava Smith')
  expect(onSelect).toHaveBeenCalledWith(ava)
  expect(input).toHaveValue('')
})

test('a failed registration of a new child shows a banner and keeps them added', async () => {
  const onSelect = vi
    .fn()
    .mockRejectedValue(
      new ApiError(500, 'server_error', 'Could not register.', null),
    )
  const { onAdd } = setup({ onSelect })
  const input = screen.getByLabelText('Add a child')

  await userEvent.type(input, 'Ava Smith')
  await userEvent.click(screen.getByRole('button', { name: 'Register' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not register.',
  )
  expect(onAdd).toHaveBeenCalledTimes(1)
  expect(input).toHaveValue('')
})

test('a backend name error shows under the name field and keeps the input', async () => {
  const onAdd = vi
    .fn()
    .mockRejectedValue(
      new ApiError(
        409,
        'student_exists',
        'You already have a child with this name.',
        'name',
      ),
    )
  setup({ onAdd })
  const input = screen.getByLabelText('Add a child')

  await userEvent.type(input, 'Mia Smith')
  await userEvent.click(screen.getByRole('button', { name: 'Register' }))

  expect(await screen.findByText(/already have a child/i)).toBeInTheDocument()
  expect(input).toHaveValue('Mia Smith')
})

test('a failed registration shows a banner', async () => {
  const onSelect = vi
    .fn()
    .mockRejectedValue(
      new ApiError(
        409,
        'already_registered',
        'Already registered.',
        'student_id',
      ),
    )
  setup({ onSelect })

  await userEvent.click(screen.getByRole('button', { name: 'Mia Smith' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Already registered.',
  )
})

test('an unexpected error is logged and shows a generic banner', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  setup({ onSelect: vi.fn().mockRejectedValue(new Error('down')) })

  await userEvent.click(screen.getByRole('button', { name: 'Mia Smith' }))

  expect(await screen.findByRole('alert')).toHaveTextContent(
    /something went wrong/i,
  )
  expect(consoleError).toHaveBeenCalled()
  consoleError.mockRestore()
})

test('Cancel calls onCancel', async () => {
  const { onCancel } = setup()

  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

  expect(onCancel).toHaveBeenCalled()
})
