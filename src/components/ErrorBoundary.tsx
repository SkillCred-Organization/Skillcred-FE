import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

type State = { failed: boolean }

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Screen crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-page px-4 text-center"
      >
        <h1 className="text-xl font-semibold text-ink">Something went wrong</h1>
        <p className="max-w-sm text-sm text-ink-muted">
          The page hit an unexpected problem. Reloading usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-10 rounded-full bg-brand px-5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Reload the page
        </button>
      </div>
    )
  }
}