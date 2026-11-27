import { cn } from '@/shared/lib/utils'
import { Skeleton } from '@/shared/ui/skeleton'

/** Wrapper that announces loading to assistive tech. */
function Loading({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  )
}

export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <Loading label="Loading" className={cn('space-y-2', className)}>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </Loading>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Loading label="Loading table" className="overflow-hidden rounded-xl border">
      <div className="flex gap-4 border-b bg-muted/40 px-4 py-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-4 border-b px-4 py-3 last:border-b-0">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className={cn('h-4 flex-1', column === 0 && 'max-w-48')} />
          ))}
        </div>
      ))}
    </Loading>
  )
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Loading label="Loading cards" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border p-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </Loading>
  )
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Loading label="Loading form" className="grid max-w-xl gap-4">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      ))}
      <Skeleton className="h-8 w-28" />
    </Loading>
  )
}

/** Header plus a table: the default fallback for a list page. */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </div>
  )
}
