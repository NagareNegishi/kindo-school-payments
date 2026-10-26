import { act, renderHook, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useLoad } from './useLoad'

test('returns the loaded data', async () => {
  const load = vi.fn().mockResolvedValue(['a'])
  const { result } = renderHook(() => useLoad(load, 'things'))

  await waitFor(() => expect(result.current.data).toEqual(['a']))
  expect(result.current.failed).toBe(false)
})

test('a rejection sets failed and logs; retry loads again', async () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error('down'))
    .mockResolvedValueOnce(['a'])
  const { result } = renderHook(() => useLoad(load, 'things'))

  await waitFor(() => expect(result.current.failed).toBe(true))
  expect(consoleError).toHaveBeenCalledWith(
    'Failed to load things',
    expect.any(Error),
  )

  act(() => result.current.retry())

  await waitFor(() => expect(result.current.data).toEqual(['a']))
  expect(result.current.failed).toBe(false)
  consoleError.mockRestore()
})
