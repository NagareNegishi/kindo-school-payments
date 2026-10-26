import type { Registration } from '../api/client'
import { formatCost, formatDate } from '../format'
import Button from './Button'

interface Props {
  registrations: Registration[]
  onPay: (registration: Registration) => void
  onViewReceipt: (registration: Registration) => void
}

/** All of the parent's registrations, past trips included: Pay while unpaid, receipt once paid. */
export default function RegistrationList({
  registrations,
  onPay,
  onViewReceipt,
}: Props) {
  if (registrations.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">Your registrations</h2>
      <ul className="space-y-3">
        {registrations.map((reg) => {
          const paid = reg.status === 'paid'
          return (
            <li
              key={reg.id}
              className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
                paid
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div>
                <p className="font-semibold">
                  {reg.activity.title}{' '}
                  <span
                    className={`ml-1 rounded px-2 py-0.5 text-xs font-medium ${
                      paid
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {paid ? 'Paid' : 'Awaiting payment'}
                  </span>
                </p>
                <p className="text-sm text-gray-700">
                  {reg.student.name} - {formatDate(reg.activity.date)} -{' '}
                  {formatCost(reg.activity.cost_cents)}
                </p>
              </div>
              {paid ? (
                <Button onClick={() => onViewReceipt(reg)}>View receipt</Button>
              ) : (
                <Button variant="primary" onClick={() => onPay(reg)}>
                  Pay
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
