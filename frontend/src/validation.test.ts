import { expect, test } from 'vitest'
import { validateChildName } from './validation'

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
