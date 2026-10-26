import { expect, test } from 'vitest'
import { formatCost, formatDate } from './format'

test('formatCost turns integer cents into NZD', () => {
  expect(formatCost(4550)).toBe('$45.50')
  expect(formatCost(0)).toBe('$0.00')
})

test('formatDate keeps the calendar day of an ISO date', () => {
  expect(formatDate('2026-11-05')).toContain('5 November 2026')
  expect(formatDate('2026-01-01')).toContain('1 January 2026')
})
