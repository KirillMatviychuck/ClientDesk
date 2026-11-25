import { createBrowserRouter, Navigate } from 'react-router'

import { AppLayout, AuthLayout } from '@/app/layouts'
import { ROUTES } from '@/shared/routes'
import { PageFallback } from './PageFallback'
import { RouteError } from './RouteError'

export const router = createBrowserRouter([
  {
    ErrorBoundary: RouteError,
    HydrateFallback: PageFallback,
    children: [
      {
        Component: AuthLayout,
        children: [
          {
            path: ROUTES.login,
            lazy: { Component: async () => (await import('@/pages/login')).LoginPage },
          },
          {
            path: ROUTES.register,
            lazy: { Component: async () => (await import('@/pages/register')).RegisterPage },
          },
        ],
      },
      {
        Component: AppLayout,
        children: [
          { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
          {
            path: ROUTES.dashboard,
            lazy: { Component: async () => (await import('@/pages/dashboard')).DashboardPage },
          },
          {
            path: ROUTES.clients,
            lazy: { Component: async () => (await import('@/pages/clients')).ClientsPage },
          },
          {
            path: ROUTES.clientDetails,
            lazy: {
              Component: async () => (await import('@/pages/client-details')).ClientDetailsPage,
            },
          },
          {
            path: ROUTES.deals,
            lazy: { Component: async () => (await import('@/pages/deals')).DealsPage },
          },
          {
            path: ROUTES.tasks,
            lazy: { Component: async () => (await import('@/pages/tasks')).TasksPage },
          },
          {
            path: ROUTES.invoices,
            lazy: { Component: async () => (await import('@/pages/invoices')).InvoicesPage },
          },
          {
            path: ROUTES.settings,
            lazy: { Component: async () => (await import('@/pages/settings')).SettingsPage },
          },
        ],
      },
      {
        path: '*',
        lazy: { Component: async () => (await import('@/pages/not-found')).NotFoundPage },
      },
    ],
  },
])
