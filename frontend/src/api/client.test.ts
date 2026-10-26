import { afterEach, expect, test, vi } from 'vitest'
import { ApiError, listActivities } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

test('listActivities returns the parsed list from /activities', async () => {
  const activities = [{ id: 1, title: 'Zoo trip' }]
  const fetchMock = stubFetch(200, activities)

  await expect(listActivities()).resolves.toEqual(activities)
  expect(fetchMock.mock.calls[0][0]).toMatch(/\/activities$/)
})

test('a non-2xx response throws an ApiError with the shared error shape', async () => {
  stubFetch(404, {
    code: 'activity_not_found',
    message: 'Not here.',
    field: 'activity_id',
  })

  await expect(listActivities()).rejects.toMatchObject({
    name: 'ApiError',
    status: 404,
    code: 'activity_not_found',
    message: 'Not here.',
    field: 'activity_id',
  })
})

test('a non-JSON error body still throws an ApiError', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('boom', { status: 500 })),
  )

  const error = await listActivities().catch((e: unknown) => e)
  expect(error).toBeInstanceOf(ApiError)
  expect(error).toMatchObject({
    status: 500,
    code: 'unknown_error',
    field: null,
  })
})
