import { RouterProvider } from 'react-router'

import { AppErrorBoundary, AppProviders } from '@/app/providers'

import { router } from './router'

export function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </AppErrorBoundary>
  )
}
