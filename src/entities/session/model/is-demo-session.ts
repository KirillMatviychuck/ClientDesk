import type { SessionState } from './types'

/** Demo sessions are anonymous Supabase users with seeded data. */
export function isDemoSession(state: SessionState): boolean {
  return state.status === 'authenticated' && state.user.is_anonymous === true
}
