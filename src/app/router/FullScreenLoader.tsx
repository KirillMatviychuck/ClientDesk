import { LoaderCircleIcon } from 'lucide-react'

/** Shown while Supabase restores the session, so no guarded page flashes. */
export function FullScreenLoader() {
  return (
    <div
      className="flex min-h-svh items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <LoaderCircleIcon className="size-8 animate-spin text-muted-foreground" aria-hidden />
    </div>
  )
}
