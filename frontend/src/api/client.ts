/** The one module that talks to the backend. VITE_API_URL is read at build time. */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export interface Activity {
  id: number
  school_id: number
  type: string
  title: string
  date: string
  location: string | null
  cost_cents: number
  description: string | null
}

export interface Parent {
  id: number
  name: string
  email: string
}

export interface Student {
  id: number
  name: string
  school_id: number
  parent_id: number
}

export interface RegistrationBasic {
  id: number
  student_id: number
  activity_id: number
  status: string
  created_at: string
}

/** A registration with its child and trip; `status` is `registered` until paid. */
export interface Registration extends RegistrationBasic {
  student: Student
  activity: Activity
}

/** A finished payment: the data the receipt shows. */
export interface Receipt {
  id: number
  registration_id: number
  status: string
  amount_cents: number
  legacy_transaction_id: string | null
  card_last4: string
  created_at: string
  student_name: string
  activity_title: string
  activity_date: string
}

/** Card details as typed; the amount is never sent, the server takes it from the trip. */
export interface CardInput {
  card_number: string
  expiry_date: string
  cvv: string
}

/** The backend's shared error shape: `{ code, message, field }`. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly field: string | null

  constructor(
    status: number,
    code: string,
    message: string,
    field: string | null,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.field = field
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, init)
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      body?.code ?? 'unknown_error',
      body?.message ?? 'Something went wrong.',
      body?.field ?? null,
    )
  }
  return response.json() as Promise<T>
}

function jsonPost(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

export function listActivities(): Promise<Activity[]> {
  return request<Activity[]>('/activities')
}

export function listParents(): Promise<Parent[]> {
  return request<Parent[]>('/parents')
}

export function listStudents(parentId: number): Promise<Student[]> {
  return request<Student[]>(`/parents/${parentId}/students`)
}

export function createStudent(
  parentId: number,
  name: string,
): Promise<Student> {
  return request<Student>(`/parents/${parentId}/students`, jsonPost({ name }))
}

export function createRegistration(
  studentId: number,
  activityId: number,
): Promise<RegistrationBasic> {
  return request<RegistrationBasic>(
    '/registrations',
    jsonPost({ student_id: studentId, activity_id: activityId }),
  )
}

/** Pays for a registration. A decline rejects with an ApiError of status 402. */
export function createPayment(
  registrationId: number,
  card: CardInput,
): Promise<Receipt> {
  return request<Receipt>(
    `/registrations/${registrationId}/payments`,
    jsonPost(card),
  )
}

export function listRegistrations(parentId: number): Promise<Registration[]> {
  return request<Registration[]>(`/parents/${parentId}/registrations`)
}
