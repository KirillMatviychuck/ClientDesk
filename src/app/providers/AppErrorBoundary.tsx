import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorState } from '@/shared/ui/error-state'

interface State {
  hasError: boolean
}

/**
 * Last line of defence for errors outside the router (providers, router
 * setup). Route errors are handled by the router's ErrorBoundary.
 */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  override render() {
    if (!this.state.hasError) return this.props.children
    return (
      <main className="flex min-h-svh items-center justify-center p-6">
        <ErrorState
          className="w-full max-w-lg"
          description="The app failed to start. Reload the page to try again."
          onRetry={() => window.location.reload()}
        />
      </main>
    )
  }
}
