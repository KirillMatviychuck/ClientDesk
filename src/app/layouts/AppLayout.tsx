import { NavLink, Outlet } from 'react-router'

import { ThemeSwitcher } from '@/features/switch-theme'
import { cn } from '@/shared/lib/utils'
import { ROUTES } from '@/shared/routes'

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: 'Dashboard' },
  { to: ROUTES.clients, label: 'Clients' },
  { to: ROUTES.deals, label: 'Deals' },
  { to: ROUTES.tasks, label: 'Tasks' },
  { to: ROUTES.invoices, label: 'Invoices' },
  { to: ROUTES.settings, label: 'Settings' },
] as const

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
          <ThemeSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
