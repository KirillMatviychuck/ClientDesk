import { BriefcaseBusinessIcon } from 'lucide-react'
import { Link } from 'react-router'

import { cn } from '@/shared/lib/utils'
import { ROUTES } from '@/shared/routes'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to={ROUTES.dashboard}
      aria-label="ClientDesk home"
      className={cn(
        'flex items-center gap-2 rounded-md font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        compact && 'justify-center',
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BriefcaseBusinessIcon className="size-4" aria-hidden />
      </span>
      {!compact && <span className="truncate">ClientDesk</span>}
    </Link>
  )
}
