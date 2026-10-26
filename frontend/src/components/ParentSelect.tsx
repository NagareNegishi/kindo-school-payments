import type { Parent } from '../api/client'
import { fieldStyle } from './Input'

interface Props {
  parents: Parent[]
  selectedId: number | null
  onChange: (id: number | null) => void
}

/** Header dropdown for choosing which seeded demo parent is acting. */
export default function ParentSelect({ parents, selectedId, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-gray-600">Parent</span>
      <select
        className={`${fieldStyle} bg-white px-2 py-1`}
        value={selectedId ?? ''}
        onChange={(e) =>
          onChange(e.target.value === '' ? null : Number(e.target.value))
        }
      >
        <option value="">Select a parent</option>
        {parents.map((parent) => (
          <option key={parent.id} value={parent.id}>
            {parent.name}
          </option>
        ))}
      </select>
    </label>
  )
}
