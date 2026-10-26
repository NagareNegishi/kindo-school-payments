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

export function formatCost(cents: number): string {
  return nzd.format(cents / 100)
}

/** Formats a `YYYY-MM-DD` date. Parsed as a local date so the day never shifts by timezone. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return longDate.format(new Date(year, month - 1, day))
}
