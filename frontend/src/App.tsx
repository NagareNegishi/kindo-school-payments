import { useEffect, useRef, useState } from 'react'
import {
  createPayment,
  createRegistration,
  createStudent,
  getPayment,
  listActivities,
  listParents,
  listRegistrations,
  listStudents,
  type Activity,
  type CardInput,
  type Receipt,
  type Registration,
  type Student,
} from './api/client'
import Alert from './components/Alert'
import Button from './components/Button'
import ChildPicker from './components/ChildPicker'
import LoadError from './components/LoadError'
import ParentSelect from './components/ParentSelect'
import PaymentForm from './components/PaymentForm'
import ReceiptView from './components/ReceiptView'
import RegistrationList from './components/RegistrationList'
import Spinner from './components/Spinner'
import TripList from './components/TripList'
import { useLoad } from './useLoad'
import { useScrollIntoView } from './useScrollIntoView'

interface ParentData {
  parentId: number
  students: Student[]
  registrations: Registration[]
}

export default function App() {
  const { data: trips, failed } = useLoad(listActivities, 'trips')
  const {
    data: parentList,
    failed: parentsFailed,
    retry: retryParents,
  } = useLoad(listParents, 'parents')
  const parents = parentList ?? []
  // The parent whose students or registrations failed to load, if any.
  const [dataFailedFor, setDataFailedFor] = useState<number | null>(null)
  const [dataAttempt, setDataAttempt] = useState(0)
  const [parentId, setParentId] = useState<number | null>(null)
  // Read after an await, where the `parentId` of that render is out of date.
  const parentIdRef = useRef<number | null>(null)
  // Tagged with its parent so a slow response never shows under another parent.
  const [loaded, setLoaded] = useState<ParentData | null>(null)
  const [registeringTripId, setRegisteringTripId] = useState<number | null>(
    null,
  )
  const [payTarget, setPayTarget] = useState<Registration | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [receiptFailed, setReceiptFailed] = useState(false)

  const data = loaded !== null && loaded.parentId === parentId ? loaded : null
  // Bring the payment form, receipt and child picker into view when they open.
  const detailRef = useScrollIntoView(payTarget ?? receipt)
  const pickerRef = useScrollIntoView(registeringTripId, 'nearest')

  useEffect(() => {
    if (parentId === null) return
    let stale = false
    Promise.all([listStudents(parentId), listRegistrations(parentId)])
      .then(([students, registrations]) => {
        if (!stale) setLoaded({ parentId, students, registrations })
      })
      .catch((error: unknown) => {
        console.error('Failed to load parent data', error)
        if (!stale) setDataFailedFor(parentId)
      })
    return () => {
      stale = true
    }
  }, [parentId, dataAttempt])

  function retryParentData() {
    setDataFailedFor(null)
    setDataAttempt((n) => n + 1)
  }

  /** Reloads the parent's registrations into `loaded`, keeping its other fields. */
  async function refreshRegistrations(id: number) {
    const registrations = await listRegistrations(id)
    // Spread the latest state: a child may have been added just before this.
    setLoaded((prev) =>
      prev !== null && prev.parentId === id ? { ...prev, registrations } : prev,
    )
    return registrations
  }

  function chooseParent(id: number | null) {
    setParentId(id)
    parentIdRef.current = id
    setRegisteringTripId(null)
    setPayTarget(null)
    setReceipt(null)
    setReceiptFailed(false)
  }

  /** Opens the payment form, replacing any receipt on screen. */
  function openPayment(registration: Registration | null) {
    setReceipt(null)
    setPayTarget(registration)
  }

  /** Pays the open registration. Rejects on failure so the form can show it. */
  async function pay(card: CardInput) {
    if (payTarget === null || data === null) return
    const paid = await createPayment(payTarget.id, card)
    // The parent was switched while paying; their unpaid list reloads when picked again.
    if (parentIdRef.current !== data.parentId) return
    setReceipt(paid)
    setPayTarget(null)
    // The payment went through; a failed refresh must not read as a payment error.
    try {
      await refreshRegistrations(data.parentId)
    } catch (error) {
      console.error('Failed to refresh registrations', error)
    }
  }

  /** Opens the receipt of a paid registration. */
  async function viewReceipt(registration: Registration) {
    if (registration.payment_id === null) return
    const owner = parentIdRef.current
    setReceiptFailed(false)
    try {
      const found = await getPayment(registration.payment_id)
      // Dropped if the parent was switched while the receipt loaded.
      if (parentIdRef.current !== owner) return
      setPayTarget(null)
      setReceipt(found)
    } catch (error) {
      console.error('Failed to load receipt', error)
      if (parentIdRef.current === owner) setReceiptFailed(true)
    }
  }

  async function addChild(name: string) {
    if (data === null) return
    const student = await createStudent(data.parentId, name)
    setLoaded({ ...data, students: [...data.students, student] })
    return student
  }

  async function registerChild(student: Student, trip: Activity) {
    if (data === null) return
    const created = await createRegistration(student.id, trip.id)
    const registrations = await refreshRegistrations(data.parentId)
    setRegisteringTripId(null)
    openPayment(registrations.find((reg) => reg.id === created.id) ?? null)
  }

  function renderTripExtra(trip: Activity) {
    if (data === null) return null
    if (registeringTripId !== trip.id) {
      return (
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => setRegisteringTripId(trip.id)}
        >
          Register a child
        </Button>
      )
    }
    const registeredIds = new Set(
      data.registrations
        .filter((reg) => reg.activity_id === trip.id)
        .map((reg) => reg.student_id),
    )
    return (
      <div ref={pickerRef}>
        <ChildPicker
          students={data.students}
          registeredIds={registeredIds}
          onSelect={(student) => registerChild(student, trip)}
          onAdd={addChild}
          onCancel={() => setRegisteringTripId(null)}
        />
      </div>
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
        {parentsFailed && (
          <LoadError
            message="Could not load the parents."
            onRetry={retryParents}
          />
        )}
        {dataFailedFor !== null && dataFailedFor === parentId && (
          <LoadError
            message="Could not load this parent's children and trips."
            onRetry={retryParentData}
          />
        )}
        <div ref={detailRef}>
          {payTarget !== null && (
            <PaymentForm
              // Remount per registration so typed card details never carry over.
              key={payTarget.id}
              registration={payTarget}
              onSubmit={pay}
              onCancel={() => setPayTarget(null)}
            />
          )}
          {receipt !== null && (
            <ReceiptView receipt={receipt} onDone={() => setReceipt(null)} />
          )}
        </div>
        {receiptFailed && (
          <Alert className="mb-4">
            Could not load the receipt. Please try again.
          </Alert>
        )}
        {data !== null && (
          <RegistrationList
            registrations={data.registrations}
            onPay={openPayment}
            onViewReceipt={(registration) => void viewReceipt(registration)}
          />
        )}
        <h2 className="mb-4 text-lg font-semibold">Upcoming trips</h2>
        {failed ? (
          <Alert>Could not load trips. Please refresh and try again.</Alert>
        ) : trips === null ? (
          <p className="flex items-center gap-2 text-gray-600">
            <Spinner />
            <span>Loading trips...</span>
          </p>
        ) : (
          <TripList trips={trips} renderExtra={renderTripExtra} />
        )}
      </main>
    </div>
  )
}
