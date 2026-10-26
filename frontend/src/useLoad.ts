import { useEffect, useState } from 'react'

/**
 * Loads data once on mount. `failed` is set when the request rejects; `retry`
 * clears it and loads again. Pass a stable `load` function.
 */
export function useLoad<T>(load: () => Promise<T>, what: string) {
  const [data, setData] = useState<T | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let stale = false
    load()
      .then((result) => {
        if (!stale) setData(result)
      })
      .catch((error: unknown) => {
        console.error(`Failed to load ${what}`, error)
        if (!stale) setFailed(true)
      })
    return () => {
      stale = true
    }
  }, [load, what, attempt])

  function retry() {
    setFailed(false)
    setAttempt((n) => n + 1)
  }

  return { data, failed, retry }
}
