import { useEffect, useState } from 'react'
import {
  listActivities,
  listParents,
  type Activity,
  type Parent,
} from './api/client'
import ParentSelect from './components/ParentSelect'
import TripList from './components/TripList'

export default function App() {
  const [trips, setTrips] = useState<Activity[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [parents, setParents] = useState<Parent[]>([])
  const [parentId, setParentId] = useState<number | null>(null)

  useEffect(() => {
    listParents()
      .then(setParents)
      .catch((error: unknown) => {
        console.error('Failed to load parents', error)
      })
  }, [])

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
      <header className="flex flex-col gap-2 border-b border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-xl font-semibold">Kindo School Payments</h1>
        <ParentSelect
          parents={parents}
          selectedId={parentId}
          onChange={setParentId}
        />
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
