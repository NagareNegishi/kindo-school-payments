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
