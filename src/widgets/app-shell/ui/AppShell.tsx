import type { ReactNode } from 'react'

import { ThemeToggle } from '@/features/theme-toggle'
import { TooltipProvider } from '@/shared/ui/tooltip'

import { useSidebarCollapsed } from '../model'
import { Brand } from './Brand'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'
import { UserMenu } from './UserMenu'

interface AppShellProps {
  /** Full-width strip under the header, e.g. the demo banner. */
  banner?: ReactNode
  children: ReactNode
}

/** Layout of the signed-in app: sidebar (or slide-out menu), header, content. */
export function AppShell({ banner, children }: AppShellProps) {
  const sidebar = useSidebarCollapsed()

  return (
    <TooltipProvider>
      <div className="flex min-h-svh">
        <Sidebar collapsed={sidebar.collapsed} onToggle={sidebar.toggle} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
            <MobileNav />
            <div className="md:hidden">
              <Brand />
            </div>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <UserMenu />
            </div>
          </header>
          {banner}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
