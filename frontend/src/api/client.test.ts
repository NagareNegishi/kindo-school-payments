import { afterEach, expect, test, vi } from 'vitest'
import { ApiError, createPayment, listActivities } from './client'

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

test('createPayment posts only the card details to the registration', async () => {
  const fetchMock = stubFetch(201, { id: 5 })
  const card = {
    card_number: '4111 1111 1111 1111',
    expiry_date: '12/99',
    cvv: '123',
  }

  await createPayment(7, card)

  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toMatch(/\/registrations\/7\/payments$/)
  expect(init.method).toBe('POST')
  expect(JSON.parse(init.body)).toEqual(card)
})

test('a declined payment rejects with status 402 and the processor message', async () => {
  stubFetch(402, {
    code: 'payment_declined',
    message: 'Card declined.',
    field: null,
  })

  await expect(
    createPayment(7, { card_number: '', expiry_date: '', cvv: '' }),
  ).rejects.toMatchObject({ status: 402, message: 'Card declined.' })
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
