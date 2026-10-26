import Alert from './Alert'
import Button from './Button'

interface Props {
  message: string
  onRetry: () => void
}

/** Alert for a failed load, with a button to try the load again. */
export default function LoadError({ message, onRetry }: Props) {
  return (
    <Alert className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p>{message}</p>
      <Button size="sm" onClick={onRetry}>
        Try again
      </Button>
    </Alert>
  )
}
