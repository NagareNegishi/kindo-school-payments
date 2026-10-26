import { expect, test } from 'vitest'
import { formatCost, formatDate, formatExpiryInput } from './format'

test('formatExpiryInput adds the slash after the month and caps at 4 digits', () => {
  expect(formatExpiryInput('1', '')).toBe('1')
  expect(formatExpiryInput('12', '1')).toBe('12/')
  expect(formatExpiryInput('12/3', '12/')).toBe('12/3')
  expect(formatExpiryInput('1230', '123')).toBe('12/30')
  expect(formatExpiryInput('12/305', '12/30')).toBe('12/30')
  expect(formatExpiryInput('ab1/2x', '')).toBe('12/')
})

test('formatExpiryInput zero-pads a single-digit month', () => {
  expect(formatExpiryInput('1/', '1')).toBe('01/')
  expect(formatExpiryInput('01/1', '01/')).toBe('01/1')
  expect(formatExpiryInput('3', '')).toBe('03/')
  expect(formatExpiryInput('0', '')).toBe('0')
})

test('formatExpiryInput lets backspace remove the slash', () => {
  expect(formatExpiryInput('12', '12/')).toBe('12')
  expect(formatExpiryInput('12/', '12/3')).toBe('12')
})

test('formatCost turns integer cents into NZD', () => {
  expect(formatCost(4550)).toBe('$45.50')
  expect(formatCost(0)).toBe('$0.00')
})

test('formatDate keeps the calendar day of an ISO date', () => {
  expect(formatDate('2026-11-05')).toContain('5 November 2026')
  expect(formatDate('2026-01-01')).toContain('1 January 2026')
})
