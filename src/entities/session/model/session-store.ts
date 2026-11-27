import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'

import { isRecoveryLinkInUrl, subscribeToAuthChanges } from '../api'
import type { SessionState } from './types'

type EventListener = (event: AuthChangeEvent, state: SessionState) => void

let state: SessionState = { status: 'loading' }
const storeListeners = new Set<() => void>()
const eventListeners = new Set<EventListener>()
let unsubscribeAuth: (() => void) | null = null

/**
 * Password recovery. Supabase reports a reset link with PASSWORD_RECOVERY, a
 * moment after INITIAL_SESSION; until then the state stays `loading` so the
 * reset page does not flash "not allowed".
 */
let recoveryLinkPending = isRecoveryLinkInUrl()
let recoveryUserId: string | null = null
let lastSession: Session | null = null

function toState(event: AuthChangeEvent, session: Session | null): SessionState {
  if (recoveryLinkPending) return { status: 'loading' }
  return session
    ? {
        status: 'authenticated',
        session,
        user: session.user,
        lastEvent: event,
        isPasswordRecovery: recoveryUserId === session.user.id,
      }
    : { status: 'unauthenticated', lastEvent: event }
}

function publish(event: AuthChangeEvent, session: Session | null) {
  state = toState(event, session)
  storeListeners.forEach((listener) => listener())
}

function handleAuthChange(event: AuthChangeEvent, session: Session | null) {
  lastSession = session
  if (event === 'PASSWORD_RECOVERY' && session) {
    recoveryUserId = session.user.id
    recoveryLinkPending = false
  } else if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
    // A new password ends the recovery: it is not a standing permission.
    recoveryUserId = null
  }

  if (event === 'INITIAL_SESSION' && recoveryLinkPending) {
    // PASSWORD_RECOVERY is queued with setTimeout(0) before INITIAL_SESSION, so
    // this timer runs after it. If it never came, the link was invalid.
    setTimeout(() => {
      if (!recoveryLinkPending) return
      recoveryLinkPending = false
      publish(event, lastSession)
    }, 0)
  }

  publish(event, session)
  eventListeners.forEach((listener) => listener(event, state))
}

/** One Supabase subscription for the whole app, started on first use. */
function ensureAuthSubscription() {
  unsubscribeAuth ??= subscribeToAuthChanges(handleAuthChange)
}

// Subscribe at import time so the PASSWORD_RECOVERY event is not missed.
ensureAuthSubscription()

function subscribe(listener: () => void) {
  ensureAuthSubscription()
  storeListeners.add(listener)
  return () => {
    storeListeners.delete(listener)
  }
}

function getSnapshot() {
  return state
}

/**
 * Current auth state. Supabase owns the tokens (storage and refresh); this
 * only mirrors what onAuthStateChange reports.
 */
export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSnapshot)
}

/** Runs `listener` on every auth event (sign-in, sign-out, token refresh, ...). */
export function onSessionEvent(listener: EventListener): () => void {
  ensureAuthSubscription()
  eventListeners.add(listener)
  return () => {
    eventListeners.delete(listener)
  }
}
