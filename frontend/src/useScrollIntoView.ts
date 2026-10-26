import { useEffect, useRef } from 'react'

/**
 * Returns a ref to put on an element. The element scrolls into view each time
 * `target` changes to a value other than null or undefined.
 */
export function useScrollIntoView(
  target: unknown,
  block: ScrollLogicalPosition = 'start',
) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (target !== null && target !== undefined) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block })
    }
  }, [target, block])

  return ref
}
