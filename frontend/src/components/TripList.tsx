import type { ReactNode } from 'react'
import type { Activity } from '../api/client'
import TripCard from './TripCard'

interface Props {
  trips: Activity[]
  /** Extra content shown inside each trip's card. */
  renderExtra?: (trip: Activity) => ReactNode
}

export default function TripList({ trips, renderExtra }: Props) {
  if (trips.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-600">
        No upcoming trips right now.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {trips.map((trip) => (
        <li key={trip.id}>
          <TripCard trip={trip}>{renderExtra?.(trip)}</TripCard>
        </li>
      ))}
    </ul>
  )
}
