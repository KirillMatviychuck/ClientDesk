import { Link } from 'react-router'

import { ROUTES } from '@/shared/routes'
import { Button } from '@/shared/ui/button'

export function NotFoundPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        The page you are looking for does not exist or was moved.
      </p>
      <Button asChild>
        <Link to={ROUTES.root}>Go home</Link>
      </Button>
    </main>
  )
}
