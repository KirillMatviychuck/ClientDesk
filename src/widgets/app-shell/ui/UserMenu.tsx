import { SettingsIcon } from 'lucide-react'
import { Link } from 'react-router'

import {
  getInitials,
  getUserDisplayName,
  useCurrentWorkspace,
  useSession,
} from '@/entities/session'

import { ROUTES } from '@/shared/routes'
import { Button } from '@/shared/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Skeleton } from '@/shared/ui/skeleton'

import { SignOutMenuItem } from './SignOutMenuItem'

function WorkspaceLine({ workspace }: { workspace: ReturnType<typeof useCurrentWorkspace> }) {
  if (workspace.isPending) return <Skeleton className="h-3 w-24" />
  if (!workspace.data) return null
  return <span className="truncate text-xs text-muted-foreground">{workspace.data.name}</span>
}

export function UserMenu() {
  const session = useSession()
  // Fetched with the header, so the menu opens with the workspace name ready.
  const workspace = useCurrentWorkspace()
  if (session.status !== 'authenticated') return null

  const name = getUserDisplayName(session.user)
  const email = session.user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5 sm:pr-2.5" aria-label="Account menu">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
            aria-hidden
          >
            {getInitials(name)}
          </span>
          <span className="hidden max-w-36 truncate text-sm sm:block">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate text-sm font-medium text-foreground">{name}</span>
          {email && email !== name && (
            <span className="truncate text-xs text-muted-foreground">{email}</span>
          )}
          <WorkspaceLine workspace={workspace} />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={ROUTES.settings}>
            <SettingsIcon aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <SignOutMenuItem />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
