import { useState, type FormEvent } from 'react'
import { ApiError, type Student } from '../api/client'
import { validateChildName } from '../validation'

interface Props {
  students: Student[]
  /** Ids of children already registered for this trip. */
  registeredIds: Set<number>
  onSelect: (student: Student) => Promise<void>
  onAdd: (name: string) => Promise<void>
  onCancel: () => void
}

/** Pick one of the parent's children for a trip, or add a new child. */
export default function ChildPicker({
  students,
  registeredIds,
  onSelect,
  onAdd,
  onCancel,
}: Props) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  async function run(action: () => Promise<void>, field?: 'name') {
    setBanner(null)
    try {
      await action()
    } catch (error) {
      if (error instanceof ApiError) {
        if (field && error.field === field) setNameError(error.message)
        else setBanner(error.message)
      } else {
        console.error('Child picker request failed', error)
        setBanner('Something went wrong. Please try again.')
      }
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const error = validateChildName(name)
    setNameError(error)
    if (error) return
    void run(async () => {
      await onAdd(name.trim())
      setName('')
    }, 'name')
  }

  return (
    <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
      <h4 className="font-medium">Choose a child</h4>
      {banner && (
        <p role="alert" className="text-sm text-red-700">
          {banner}
        </p>
      )}
      {students.length === 0 ? (
        <p className="text-sm text-gray-600">No children added yet.</p>
      ) : (
        <ul className="space-y-2">
          {students.map((student) => {
            const registered = registeredIds.has(student.id)
            return (
              <li key={student.id}>
                <button
                  type="button"
                  disabled={registered}
                  className="flex w-full items-center justify-between rounded border border-gray-300 px-3 py-2 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                  onClick={() => void run(() => onSelect(student))}
                >
                  <span>{student.name}</span>
                  {registered && (
                    <span className="text-sm">Already registered</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <form onSubmit={submit} noValidate className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="child-name">
          Add a child
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="child-name"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={name}
            aria-invalid={nameError !== null}
            aria-describedby={nameError ? 'child-name-error' : undefined}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameError(validateChildName(name))}
          />
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 sm:w-auto"
          >
            Add
          </button>
        </div>
        {nameError && (
          <p id="child-name-error" className="text-sm text-red-700">
            {nameError}
          </p>
        )}
      </form>

      <button
        type="button"
        className="text-sm text-gray-600 underline"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  )
}
