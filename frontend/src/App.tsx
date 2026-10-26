import { useEffect, useState } from 'react'
import { listActivities, type Activity } from './api/client'
import TripList from './components/TripList'

export default function App() {
  const [trips, setTrips] = useState<Activity[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    listActivities()
      .then(setTrips)
      .catch((error: unknown) => {
        console.error('Failed to load trips', error)
        setFailed(true)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <h1 className="text-xl font-semibold">Kindo School Payments</h1>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <h2 className="mb-4 text-lg font-semibold">Upcoming trips</h2>
        {failed ? (
          <p role="alert" className="text-red-700">
            Could not load trips. Please refresh and try again.
          </p>
        ) : trips === null ? (
          <p className="text-gray-600">Loading trips...</p>
        ) : (
          <TripList trips={trips} />
        )}
      </main>
    </div>
  )
}
