import type { ButtonHTMLAttributes } from 'react'
import { focusRing } from '../focusRing'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary'
type Size = 'md' | 'sm'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** `md` is full width on mobile; `sm` is a compact button for use inside banners. */
  size?: Size
  /** Shows a spinner and disables the button, e.g. while a request runs. */
  loading?: boolean
}

// `enabled:` keeps hover and pressed colours off a disabled button, so it reads as inactive.
const base = `inline-flex items-center justify-center gap-2 rounded transition-colors ${focusRing} disabled:cursor-not-allowed disabled:opacity-60`

const variants: Record<Variant, string> = {
  primary:
    'bg-blue-600 font-medium text-white enabled:hover:bg-blue-700 enabled:active:bg-blue-800',
  secondary:
    'border border-gray-300 bg-white font-medium enabled:hover:bg-gray-100 enabled:active:bg-gray-200',
}

const sizes: Record<Size, string> = {
  md: 'w-full px-4 py-2 sm:w-auto',
  sm: 'px-3 py-1',
}

/** Button with hover, pressed, focus, disabled and loading states. Defaults to `type="button"`. */
export default function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`.trim()}
      {...rest}
    >
      {loading && <Spinner />}
      {children}
    </button>
  )
}
