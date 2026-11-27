import { isRouteErrorResponse, Link, useRouteError } from 'react-router'

import { ROUTES } from '@/shared/routes'
import { Button } from '@/shared/ui/button'
import { ErrorState } from '@/shared/ui/error-state'

function getErrorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`
  // A new deploy removed the old lazy chunks: a reload fetches the new ones.
  if (error instanceof TypeError && /dynamically imported module/i.test(error.message)) {
    return 'A new version of the app is available. Reload the page to continue.'
  }
  return 'An unexpected error occurred. Try again, or go back to the dashboard.'
}

function RouteErrorContent() {
  const error = useRouteError()
  if (import.meta.env.DEV) console.error(error)

  return (
    <div className="flex flex-col items-center gap-3">
      <ErrorState
        className="w-full max-w-lg"
        description={getErrorMessage(error)}
        onRetry={() => window.location.reload()}
      />
      <Button asChild variant="link">
        <Link to={ROUTES.dashboard}>Go to dashboard</Link>
      </Button>
    </div>
  )
}

/** Top-level fallback: the whole screen, used when even the layout failed. */
export function RouteError() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <RouteErrorContent />
    </main>
  )
}

/** Fallback for a page inside the app shell; the sidebar keeps working. */
export function PageError() {
  return (
    <div className="py-6">
      <RouteErrorContent />
    </div>
  )
}
