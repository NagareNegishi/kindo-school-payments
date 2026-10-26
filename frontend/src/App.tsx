import { useEffect, useState } from 'react'
import {
  createRegistration,
  createStudent,
  listActivities,
  listParents,
  listRegistrations,
  listStudents,
  type Activity,
  type Parent,
  type Registration,
  type Student,
} from './api/client'
import ChildPicker from './components/ChildPicker'
import ParentSelect from './components/ParentSelect'
import TripList from './components/TripList'
import UnpaidRegistrations from './components/UnpaidRegistrations'

interface ParentData {
  parentId: number
  students: Student[]
  registrations: Registration[]
}

export default function App() {
  const [trips, setTrips] = useState<Activity[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [parents, setParents] = useState<Parent[]>([])
  const [parentId, setParentId] = useState<number | null>(null)
  // Tagged with its parent so a slow response never shows under another parent.
  const [loaded, setLoaded] = useState<ParentData | null>(null)
  const [registeringTripId, setRegisteringTripId] = useState<number | null>(
    null,
  )
  // Read by the payment form in the next step.
  const [, setPayTarget] = useState<Registration | null>(null)

  const data = loaded !== null && loaded.parentId === parentId ? loaded : null

  useEffect(() => {
    if (parentId === null) return
    let stale = false
    Promise.all([listStudents(parentId), listRegistrations(parentId)])
      .then(([students, registrations]) => {
        if (!stale) setLoaded({ parentId, students, registrations })
      })
      .catch((error: unknown) => {
        console.error('Failed to load parent data', error)
      })
    return () => {
      stale = true
    }
  }, [parentId])

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

  function chooseParent(id: number | null) {
    setParentId(id)
    setRegisteringTripId(null)
  }

  async function addChild(name: string) {
    if (data === null) return
    const student = await createStudent(data.parentId, name)
    setLoaded({ ...data, students: [...data.students, student] })
  }

  async function registerChild(student: Student, trip: Activity) {
    if (data === null) return
    const created = await createRegistration(student.id, trip.id)
    const registrations = await listRegistrations(data.parentId)
    setLoaded({ ...data, registrations })
    setRegisteringTripId(null)
    setPayTarget(registrations.find((reg) => reg.id === created.id) ?? null)
  }

  function renderTripExtra(trip: Activity) {
    if (data === null) return null
    if (registeringTripId !== trip.id) {
      return (
        <button
          type="button"
          className="mt-4 w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 sm:w-auto"
          onClick={() => setRegisteringTripId(trip.id)}
        >
          Register a child
        </button>
      )
    }
    const registeredIds = new Set(
      data.registrations
        .filter((reg) => reg.activity_id === trip.id)
        .map((reg) => reg.student_id),
    )
    return (
      <ChildPicker
        students={data.students}
        registeredIds={registeredIds}
        onSelect={(student) => registerChild(student, trip)}
        onAdd={addChild}
        onCancel={() => setRegisteringTripId(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="flex flex-col gap-2 border-b border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h1 className="text-xl font-semibold">Kindo School Payments</h1>
        <ParentSelect
          parents={parents}
          selectedId={parentId}
          onChange={chooseParent}
        />
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        {data !== null && (
          <UnpaidRegistrations
            registrations={data.registrations}
            onPay={setPayTarget}
          />
        )}
        <h2 className="mb-4 text-lg font-semibold">Upcoming trips</h2>
        {failed ? (
          <p role="alert" className="text-red-700">
            Could not load trips. Please refresh and try again.
          </p>
        ) : trips === null ? (
          <p className="text-gray-600">Loading trips...</p>
        ) : (
          <TripList trips={trips} renderExtra={renderTripExtra} />
        )}
      </main>
    </div>
  )
}
