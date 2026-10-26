import type { Activity } from '../api/client'
import TripCard from './TripCard'

export default function TripList({ trips }: { trips: Activity[] }) {
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
          <TripCard trip={trip} />
        </li>
      ))}
    </ul>
  )
}
