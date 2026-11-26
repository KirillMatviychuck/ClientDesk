import { FlaskConicalIcon } from 'lucide-react'

import { isDemoSession, useSession } from '@/entities/session'
import { ResetDemoButton } from './ResetDemoButton'

/** Shown only in demo (anonymous) sessions. */
export function DemoBanner() {
  const session = useSession()
  if (!isDemoSession(session)) return null

  return (
    <div role="region" aria-label="Demo mode" className="border-b bg-muted/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 text-sm">
        <FlaskConicalIcon className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="flex-1">
          <span className="font-medium">You're in demo mode.</span>{' '}
          <span className="text-muted-foreground">
            Sample data, visible only to you. Deleted after 7 days.
          </span>
        </p>
        <ResetDemoButton />
      </div>
    </div>
  )
}
