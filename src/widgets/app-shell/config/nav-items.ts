import {
  FileTextIcon,
  HandshakeIcon,
  LayoutDashboardIcon,
  ListTodoIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'

import { ROUTES } from '@/shared/routes'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboardIcon },
  { to: ROUTES.clients, label: 'Clients', icon: UsersIcon },
  { to: ROUTES.deals, label: 'Deals', icon: HandshakeIcon },
  { to: ROUTES.tasks, label: 'Tasks', icon: ListTodoIcon },
  { to: ROUTES.invoices, label: 'Invoices', icon: FileTextIcon },
  { to: ROUTES.settings, label: 'Settings', icon: SettingsIcon },
]
