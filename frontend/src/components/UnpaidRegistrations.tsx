import type { Registration } from '../api/client'
import { formatCost, formatDate } from '../format'

interface Props {
  registrations: Registration[]
  onPay: (registration: Registration) => void
}

/** The parent's registrations still waiting for payment, past trips included. */
export default function UnpaidRegistrations({ registrations, onPay }: Props) {
  const unpaid = registrations.filter((reg) => reg.status !== 'paid')
  if (unpaid.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">Awaiting payment</h2>
      <ul className="space-y-3">
        {unpaid.map((reg) => (
          <li
            key={reg.id}
            className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-semibold">{reg.activity.title}</p>
              <p className="text-sm text-gray-700">
                {reg.student.name} - {formatDate(reg.activity.date)} -{' '}
                {formatCost(reg.activity.cost_cents)}
              </p>
            </div>
            <button
              type="button"
              className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 sm:w-auto"
              onClick={() => onPay(reg)}
            >
              Pay
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
