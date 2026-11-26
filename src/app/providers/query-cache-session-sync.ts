import type { QueryClient } from '@tanstack/react-query'

import { onSessionEvent } from '@/entities/session'

/**
 * Clears the query cache whenever the signed-in user goes away or changes:
 * sign-out in another tab, an expired refresh token, or a different user
 * signing in. The sign-out button also clears it, for the common case.
 */
export function syncQueryCacheWithSession(queryClient: QueryClient): () => void {
  let currentUserId: string | null = null

  return onSessionEvent((event, state) => {
    const nextUserId = state.status === 'authenticated' ? state.user.id : null
    const userChanged = currentUserId !== null && nextUserId !== currentUserId

    if (event === 'SIGNED_OUT' || userChanged) queryClient.clear()
    currentUserId = nextUserId
  })
}
