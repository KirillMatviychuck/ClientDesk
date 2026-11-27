import type { Session } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { isDemoSession } from './is-demo-session'
import type { SessionState } from './types'

function signedIn(isAnonymous: boolean): SessionState {
  const session = { user: { id: 'u1', is_anonymous: isAnonymous } } as Session
  return {
    status: 'authenticated',
    session,
    user: session.user,
    lastEvent: 'SIGNED_IN',
    isPasswordRecovery: false,
  }
}

describe('isDemoSession', () => {
  it('is true only for anonymous users', () => {
    expect(isDemoSession(signedIn(true))).toBe(true)
    expect(isDemoSession(signedIn(false))).toBe(false)
    expect(isDemoSession({ status: 'loading' })).toBe(false)
    expect(isDemoSession({ status: 'unauthenticated', lastEvent: 'SIGNED_OUT' })).toBe(false)
  })
})
