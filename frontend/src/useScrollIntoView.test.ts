import { renderHook } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { useScrollIntoView } from './useScrollIntoView'

function setup(initial: unknown) {
  const element = document.createElement('div')
  const scroll = vi.spyOn(element, 'scrollIntoView')
  const hook = renderHook(
    ({ target }) => {
      const ref = useScrollIntoView(target, 'nearest')
      ref.current = element
      return ref
    },
    { initialProps: { target: initial } },
  )
  return { scroll, ...hook }
}

test('does not scroll while the target is null', () => {
  const { scroll } = setup(null)
  expect(scroll).not.toHaveBeenCalled()
})

test('scrolls when the target becomes set and when it changes', () => {
  const { scroll, rerender } = setup(null)

  rerender({ target: 1 })
  expect(scroll).toHaveBeenCalledTimes(1)
  expect(scroll).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' })

  rerender({ target: 2 })
  expect(scroll).toHaveBeenCalledTimes(2)
})

test('does not scroll when the target is cleared', () => {
  const { scroll, rerender } = setup(1)
  scroll.mockClear()

  rerender({ target: null })
  expect(scroll).not.toHaveBeenCalled()
})
