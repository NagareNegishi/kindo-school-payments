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

export function listActivities(): Promise<Activity[]> {
  return request<Activity[]>('/activities')
}

export function listParents(): Promise<Parent[]> {
  return request<Parent[]>('/parents')
}
