interface Props {
  message: string
  onRetry: () => void
}

/** Alert for a failed load, with a button to try the load again. */
export default function LoadError({ message, onRetry }: Props) {
  return (
    <div
      role="alert"
      className="mb-4 flex flex-col gap-2 rounded border border-red-200 bg-red-50 p-3 text-red-800 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{message}</p>
      <button
        type="button"
        className="rounded border border-red-300 px-3 py-1 font-medium"
        onClick={onRetry}
      >
        Try again
      </button>
    </div>
  )
}
