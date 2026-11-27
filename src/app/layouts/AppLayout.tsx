import { Outlet } from 'react-router'

import { AppShell } from '@/widgets/app-shell'
import { DemoBanner } from '@/widgets/demo-banner'

export function AppLayout() {
  return (
    <AppShell banner={<DemoBanner />}>
      <Outlet />
    </AppShell>
  )
}
