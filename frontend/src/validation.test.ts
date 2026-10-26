import { expect, test } from 'vitest'
import {
  validateCardNumber,
  validateChildName,
  validateCvv,
  validateExpiry,
} from './validation'

test('accepts a normal name', () => {
  expect(validateChildName('Mia Smith')).toBeNull()
})

test('rejects an empty or whitespace-only name', () => {
  expect(validateChildName('')).not.toBeNull()
  expect(validateChildName('   ')).not.toBeNull()
})

test('trims before checking length', () => {
  expect(validateChildName(`  ${'a'.repeat(100)}  `)).toBeNull()
})

test('rejects a name over 100 characters', () => {
  expect(validateChildName('a'.repeat(101))).not.toBeNull()
})

test('accepts 16 digits with or without spaces', () => {
  expect(validateCardNumber('4111111111111111')).toBeNull()
  expect(validateCardNumber('4111 1111 1111 1111')).toBeNull()
})

test('rejects a card number that is short, long or not digits', () => {
  expect(validateCardNumber('')).not.toBeNull()
  expect(validateCardNumber('411111111111111')).not.toBeNull()
  expect(validateCardNumber('41111111111111111')).not.toBeNull()
  expect(validateCardNumber('4111-1111-1111-1111')).not.toBeNull()
  expect(validateCardNumber('411111111111111a')).not.toBeNull()
})

// Month index 5 is June.
const today = new Date(2026, 5, 15)

test('accepts the current month and later', () => {
  expect(validateExpiry('06/26', today)).toBeNull()
  expect(validateExpiry('01/27', today)).toBeNull()
})

test('rejects an expiry before the current month', () => {
  expect(validateExpiry('05/26', today)).toBe('Card has expired.')
  expect(validateExpiry('12/25', today)).toBe('Card has expired.')
})

test('rejects an expiry that is not MM/YY with a real month', () => {
  for (const value of [
    '',
    '6/26',
    '13/26',
    '00/26',
    '0626',
    '06/2026',
    '06-26',
  ]) {
    expect(validateExpiry(value, today)).toBe('Expiry must be MM/YY.')
  }
})

test('accepts exactly 3 digits for the CVV', () => {
  expect(validateCvv('123')).toBeNull()
})

test('rejects a CVV that is short, long or not digits', () => {
  for (const value of ['', '12', '1234', '12a', ' 123']) {
    expect(validateCvv(value)).not.toBeNull()
  }
})
