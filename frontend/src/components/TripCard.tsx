import type { ReactNode } from 'react'
import type { Activity } from '../api/client'
import { formatCost, formatDate } from '../format'
import Card from './Card'

interface Props {
  trip: Activity
  /** Optional area under the details, such as the register button or child picker. */
  children?: ReactNode
}

export default function TripCard({ trip, children }: Props) {
  return (
    <Card as="article">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h3 className="text-lg font-semibold">{trip.title}</h3>
        <p className="text-lg font-semibold sm:shrink-0">
          {formatCost(trip.cost_cents)}
        </p>
      </div>
      <dl className="mt-2 space-y-1 text-sm text-gray-600">
        <div className="flex gap-2">
          <dt className="font-medium">Date</dt>
          <dd>{formatDate(trip.date)}</dd>
        </div>
        {trip.location && (
          <div className="flex gap-2">
            <dt className="font-medium">Location</dt>
            <dd>{trip.location}</dd>
          </div>
        )}
      </dl>
      {trip.description && (
        <p className="mt-3 text-sm text-gray-800">{trip.description}</p>
      )}
      {children}
    </Card>
  )
}
