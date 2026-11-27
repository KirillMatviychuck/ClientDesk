import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'

import { env } from '@/shared/config'

import { queryClient } from './query-client'
import { syncQueryCacheWithSession } from './query-cache-session-sync'

// Loaded only in development so Devtools never ship in the production bundle.
const ReactQueryDevtools = env.isDev
  ? lazy(async () => {
      const { ReactQueryDevtools } = await import('@tanstack/react-query-devtools')
      return { default: ReactQueryDevtools }
    })
  : null

export function QueryProvider({ children }: { children: ReactNode }) {
  useEffect(() => syncQueryCacheWithSession(queryClient), [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {ReactQueryDevtools && (
        <Suspense fallback={null}>
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}
