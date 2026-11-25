import { Skeleton } from '@/shared/ui/skeleton'

export function PageFallback() {
  return (
    <div
      className="mx-auto max-w-6xl space-y-3 px-4 py-6"
      aria-busy="true"
      aria-label="Loading page"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}
