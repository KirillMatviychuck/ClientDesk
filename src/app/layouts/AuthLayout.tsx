import { Outlet } from 'react-router'

import { ThemeSwitcher } from '@/features/switch-theme'

export function AuthLayout() {
  return (
    <div className="relative flex min-h-svh items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeSwitcher />
      </div>
      <main className="w-full max-w-sm">
        <Outlet />
      </main>
    </div>
  )
}
