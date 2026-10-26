import type { Receipt } from '../api/client'
import { formatCost, formatTimestamp } from '../format'

interface Props {
  receipt: Receipt
  onDone: () => void
}

/** Confirmation shown after a successful payment. */
export default function ReceiptView({ receipt, onDone }: Props) {
  const rows: [string, string][] = [
    ['Transaction ID', receipt.legacy_transaction_id ?? '-'],
    ['Amount', formatCost(receipt.amount_cents)],
    ['Date', formatTimestamp(receipt.created_at)],
    ['Child', receipt.student_name],
    ['Trip', receipt.activity_title],
    ['Card', `ending ${receipt.card_last4}`],
  ]
  return (
    <section
      aria-labelledby="receipt-heading"
      className="mb-8 rounded-lg border border-green-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <h2 id="receipt-heading" className="text-lg font-semibold text-green-800">
        Payment received
      </h2>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-sm text-gray-600">{label}</dt>
            <dd className="break-all font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className="mt-4 w-full rounded border border-gray-300 px-4 py-2 sm:w-auto"
        onClick={onDone}
      >
        Done
      </button>
    </section>
  )
}
