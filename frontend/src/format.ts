/** Display formatting for money and dates. */

const nzd = new Intl.NumberFormat('en-NZ', {
  style: 'currency',
  currency: 'NZD',
})

const longDate = new Intl.DateTimeFormat('en-NZ', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const shortDate = new Intl.DateTimeFormat('en-NZ', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Formats an ISO timestamp as a date in the viewer's timezone. */
export function formatTimestamp(timestamp: string): string {
  return shortDate.format(new Date(timestamp))
}

export function formatCost(cents: number): string {
  return nzd.format(cents / 100)
}

/**
 * Formats expiry input as the user types: keeps digits only (max 4) and adds the
 * `/` after the month. The `/` is not re-added while deleting, so backspace works.
 */
export function formatExpiryInput(value: string, previous: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  const deleting = value.length < previous.length
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  if (digits.length === 2 && !deleting) return `${digits}/`
  return digits
}

/** Formats a `YYYY-MM-DD` date. Parsed as a local date so the day never shifts by timezone. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return longDate.format(new Date(year, month - 1, day))
}
