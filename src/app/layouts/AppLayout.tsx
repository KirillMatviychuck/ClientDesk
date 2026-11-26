import { NavLink, Outlet } from 'react-router'

import { useCurrentWorkspace } from '@/entities/session'
import { SignOutButton } from '@/features/sign-out'
import { ThemeSwitcher } from '@/features/switch-theme'
import { cn } from '@/shared/lib/utils'
import { ROUTES } from '@/shared/routes'
import { Skeleton } from '@/shared/ui/skeleton'
import { DemoBanner } from '@/widgets/demo-banner'

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
        {/* Below md the nav gets its own scrollable row under the brand and actions. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 md:h-14 md:flex-nowrap md:py-0">
          <span className="mr-auto font-semibold md:mr-0">ClientDesk</span>
          <nav className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 md:order-none md:mx-0 md:w-auto md:flex-1 md:px-0">
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
      <DemoBanner />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
