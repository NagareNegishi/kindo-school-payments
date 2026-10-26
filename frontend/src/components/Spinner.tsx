/** Small spinning ring in the surrounding text colour. */
export default function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}
