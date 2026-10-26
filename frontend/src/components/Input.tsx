import type { InputHTMLAttributes } from 'react'

/** Border, corners and focus look shared by every text field and the parent dropdown. */
export const fieldStyle =
  'rounded border border-gray-300 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600'

/** Text input with the app's single field style. */
export default function Input({
  className = '',
  ...rest
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${fieldStyle} w-full px-3 py-2 ${className}`.trim()}
      {...rest}
    />
  )
}
