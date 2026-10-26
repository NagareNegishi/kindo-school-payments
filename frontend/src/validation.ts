/** Field validation matching the backend rules. The backend stays the authority. */

const MAX_NAME_LENGTH = 100

/** Returns an error message, or null when the child name is valid. */
export function validateChildName(value: string): string | null {
  const name = value.trim()
  if (name.length === 0) return "Enter the child's name."
  if (name.length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
  }
  return null
}

const CARD_RE = /^[0-9]{16}$/
const EXPIRY_RE = /^(0[1-9]|1[0-2])\/([0-9]{2})$/
const CVV_RE = /^[0-9]{3}$/

/** Returns an error message, or null when the card number is 16 digits once spaces are removed. */
export function validateCardNumber(value: string): string | null {
  if (!CARD_RE.test(value.replace(/ /g, ''))) {
    return 'Card number must be 16 digits.'
  }
  return null
}

/** Returns an error message, or null when the expiry is `MM/YY` and not before the current month. */
export function validateExpiry(
  value: string,
  today: Date = new Date(),
): string | null {
  const match = EXPIRY_RE.exec(value)
  if (match === null) return 'Expiry must be MM/YY.'
  const year = 2000 + Number(match[2])
  const month = Number(match[1])
  if (year * 12 + month < today.getFullYear() * 12 + today.getMonth() + 1) {
    return 'Card has expired.'
  }
  return null
}

/** Returns an error message, or null when the CVV is exactly 3 digits. */
export function validateCvv(value: string): string | null {
  if (!CVV_RE.test(value)) return 'CVV must be 3 digits.'
  return null
}
