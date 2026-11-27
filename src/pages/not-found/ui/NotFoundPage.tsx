import { CompassIcon } from 'lucide-react'
import { Link } from 'react-router'

import { ROUTES } from '@/shared/routes'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'

export function NotFoundPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-3 text-center">
        <p className="text-sm font-medium text-muted-foreground">Error 404</p>
        <EmptyState
          icon={CompassIcon}
          title="Page not found"
          description="The page you are looking for does not exist or was moved."
          action={
            <Button asChild>
              <Link to={ROUTES.root}>Go to dashboard</Link>
            </Button>
          }
        />
      </div>
    </main>
  )
}
