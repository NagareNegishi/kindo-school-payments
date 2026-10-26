import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

/** Red error box announced to screen readers. */
export default function Alert({ children, className = '' }: Props) {
  return (
    <div
      role="alert"
      className={`rounded border border-red-200 bg-red-50 p-3 text-red-800 ${className}`.trim()}
    >
      {children}
    </div>
  )
}
