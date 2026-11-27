import { AlertTriangleIcon, RotateCwIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'

interface ErrorStateProps {
  title?: ReactNode
  description?: ReactNode
  /** Shows a "Retry" button, e.g. `() => void query.refetch()`. */
  onRetry?: () => void
  /** Disables the button while a retry is running. */
  retrying?: boolean
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this data. Check your connection and try again.',
  onRetry,
  retrying = false,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center',
        className,
      )}
    >
      <AlertTriangleIcon className="size-8 text-destructive" aria-hidden />
      <div className="max-w-sm space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" onClick={onRetry} disabled={retrying}>
          <RotateCwIcon className={cn(retrying && 'animate-spin')} aria-hidden />
          Retry
        </Button>
      )}
    </div>
  )
}
