import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip'

import { Brand } from './Brand'
import { SidebarNav } from './SidebarNav'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

/** Desktop sidebar (md and up). Below md the same nav lives in MobileNav. */
export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar'
  const ToggleIcon = collapsed ? PanelLeftOpenIcon : PanelLeftCloseIcon

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-svh shrink-0 flex-col overflow-x-hidden border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div className={cn('flex h-14 items-center border-b', collapsed ? 'justify-center' : 'px-4')}>
        <Brand compact={collapsed} />
      </div>
      <div className={'flex-1 overflow-y-auto px-3 py-4'}>
        <SidebarNav collapsed={collapsed} />
      </div>
      <div className={cn('border-t p-3', collapsed && 'flex justify-center')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'sm'}
              className={cn(!collapsed && 'w-full justify-start text-muted-foreground')}
              aria-label={label}
              onClick={onToggle}
            >
              <ToggleIcon aria-hidden />
              {!collapsed && 'Collapse'}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  )
}
