import { useState, type FormEvent } from 'react'
import { ApiError, type Student } from '../api/client'
import { focusRing } from '../focusRing'
import { validateChildName } from '../validation'
import Alert from './Alert'
import Button from './Button'
import Field from './Field'

interface Props {
  students: Student[]
  /** Ids of children already registered for this trip. */
  registeredIds: Set<number>
  onSelect: (student: Student) => Promise<void>
  onAdd: (name: string) => Promise<Student | undefined>
  onCancel: () => void
}

/** Pick one of the parent's children for a trip, or add a new child and register them. */
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
      const student = await onAdd(name.trim())
      if (!student) return
      // The child now exists; if registering fails they can be picked from the list.
      setName('')
      await onSelect(student)
    }, 'name')
  }

  return (
    <div className="mt-4 space-y-4 border-t border-gray-200 pt-4">
      <h4 className="font-medium">Select a child</h4>
      {banner && <Alert>{banner}</Alert>}
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
                  className={`flex w-full items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-left transition-colors enabled:hover:bg-gray-100 enabled:active:bg-gray-200 ${focusRing} disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500`}
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
        <Field
          id="child-name"
          label="Add a new child"
          error={nameError}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setNameError(validateChildName(name))}
          action={
            <Button type="submit" variant="primary">
              Register
            </Button>
          }
        />
      </form>

      <Button onClick={onCancel}>Cancel</Button>
    </div>
  )
}
