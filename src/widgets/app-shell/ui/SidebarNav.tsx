import { NavLink } from 'react-router'

import { cn } from '@/shared/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

import { NAV_ITEMS } from '../config'

interface SidebarNavProps {
  /** Icons only, with the label in a tooltip. */
  collapsed?: boolean
  /** Called after a link is chosen, e.g. to close the mobile menu. */
  onNavigate?: () => void
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Main" className="grid gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const link = (
          <NavLink
            to={to}
            onClick={onNavigate}
            aria-label={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        )

        if (!collapsed) return <div key={to}>{link}</div>
        return (
          <Tooltip key={to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        )
      })}
    </nav>
  )
}
