import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SessionState } from '@/entities/session'

import { syncQueryCacheWithSession } from './query-cache-session-sync'

type Listener = (event: AuthChangeEvent, state: SessionState) => void
let emit: Listener = () => undefined

vi.mock('@/entities/session', () => ({
  onSessionEvent: (listener: Listener) => {
    emit = listener
    return () => undefined
  },
}))

function signedIn(userId: string, event: AuthChangeEvent): SessionState {
  const session = { user: { id: userId } } as Session
  return { status: 'authenticated', session, user: session.user, lastEvent: event }
}

describe('syncQueryCacheWithSession', () => {
  let queryClient: QueryClient
  let clear: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    queryClient = new QueryClient()
    clear = vi.spyOn(queryClient, 'clear')
    syncQueryCacheWithSession(queryClient)
  })

  it('keeps the cache across restore and token refresh', () => {
    emit('INITIAL_SESSION', signedIn('u1', 'INITIAL_SESSION'))
    emit('TOKEN_REFRESHED', signedIn('u1', 'TOKEN_REFRESHED'))
    expect(clear).not.toHaveBeenCalled()
  })

  it('clears on sign-out', () => {
    emit('INITIAL_SESSION', signedIn('u1', 'INITIAL_SESSION'))
    emit('SIGNED_OUT', { status: 'unauthenticated', lastEvent: 'SIGNED_OUT' })
    expect(clear).toHaveBeenCalledOnce()
  })

  it('clears when another user signs in', () => {
    emit('INITIAL_SESSION', signedIn('u1', 'INITIAL_SESSION'))
    emit('SIGNED_IN', signedIn('u2', 'SIGNED_IN'))
    expect(clear).toHaveBeenCalledOnce()
  })
})
