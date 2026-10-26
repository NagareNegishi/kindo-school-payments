import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
}

/** Catches render errors below it and shows a fallback instead of a blank page. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unexpected error', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return (
        <p role="alert" className="p-6 text-red-700">
          Something went wrong. Please refresh the page and try again.
        </p>
      )
    }
    return this.props.children
  }
}
