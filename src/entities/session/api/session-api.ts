import {
  isAuthSessionMissingError,
  type AuthChangeEvent,
  type Session,
} from '@supabase/supabase-js'

import { supabase } from '@/shared/api'

export type AuthChangeListener = (event: AuthChangeEvent, session: Session | null) => void

/**
 * Subscribes to Supabase auth changes. Supabase fires INITIAL_SESSION first,
 * after it has restored the persisted session (or parsed one from the URL).
 * The callback must stay synchronous: calling Supabase inside it can deadlock.
 */
export function subscribeToAuthChanges(listener: AuthChangeListener): () => void {
  const { data } = supabase.auth.onAuthStateChange(listener)
  return () => data.subscription.unsubscribe()
}

/**
 * True when the page was opened from a password reset email link. Read before
 * Supabase consumes the URL. Only a hint for showing a loader: the reset form
 * is unlocked by the PASSWORD_RECOVERY event, not by the URL.
 */
export function isRecoveryLinkInUrl(): boolean {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.hash.slice(1))
  return params.get('type') === 'recovery'
}

/** Thrown after the local session was ended because the user no longer exists. */
export class SessionEndedError extends Error {
  constructor() {
    super('The account no longer exists')
    this.name = 'SessionEndedError'
  }
}

/** The user's workspace with their role. Each user has one personal workspace. */
export async function fetchCurrentWorkspace(userId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role, workspace:workspaces!inner(id, name, currency)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error) {
    // No membership row: the user may have been deleted (e.g. an expired demo
    // account removed by cron) while their JWT is still valid.
    if (error.code === NO_ROWS && (await signOutIfUserIsGone())) throw new SessionEndedError()
    throw error
  }
  return { ...data.workspace, role: data.role }
}

/** PostgREST: `.single()` matched no rows. */
const NO_ROWS = 'PGRST116'
const GONE_USER_CODES = new Set(['user_not_found', 'session_not_found'])

/**
 * Asks the auth server whether the user still exists and ends the local
 * session if not. Fires SIGNED_OUT, so the route guard sends them to /login.
 * Returns true when it signed the user out.
 */
async function signOutIfUserIsGone(): Promise<boolean> {
  const { error } = await supabase.auth.getUser()
  if (!error) return false
  if (isAuthSessionMissingError(error) || (error.code && GONE_USER_CODES.has(error.code))) {
    await supabase.auth.signOut({ scope: 'local' })
    return true
  }
  return false
}
