import { NavLink, Outlet } from 'react-router'

import { useCurrentWorkspace } from '@/entities/session'
import { SignOutButton } from '@/features/sign-out'
import { ThemeSwitcher } from '@/features/switch-theme'
import { cn } from '@/shared/lib/utils'
import { ROUTES } from '@/shared/routes'
import { Skeleton } from '@/shared/ui/skeleton'

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'Dashboard' },
  { to: ROUTES.clients, label: 'Clients' },
  { to: ROUTES.deals, label: 'Deals' },
  { to: ROUTES.tasks, label: 'Tasks' },
  { to: ROUTES.invoices, label: 'Invoices' },
  { to: ROUTES.settings, label: 'Settings' },
] as const

function WorkspaceName() {
  const { data, isPending } = useCurrentWorkspace()
  if (isPending) return <Skeleton className="hidden h-4 w-28 sm:block" />
  if (!data) return null
  return (
    <span className="hidden max-w-40 truncate text-sm text-muted-foreground sm:block">
      {data.name}
    </span>
  )
}

export function AppLayout() {
  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <span className="font-semibold">ClientDesk</span>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                    isActive
                      ? 'bg-accent font-medium text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <WorkspaceName />
          <ThemeSwitcher />
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
