import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'

import { subscribeToAuthChanges } from '../api'
import type { SessionState } from './types'

type EventListener = (event: AuthChangeEvent, state: SessionState) => void

let state: SessionState = { status: 'loading' }
const storeListeners = new Set<() => void>()
const eventListeners = new Set<EventListener>()
let unsubscribeAuth: (() => void) | null = null

function toState(event: AuthChangeEvent, session: Session | null): SessionState {
  return session
    ? { status: 'authenticated', session, user: session.user, lastEvent: event }
    : { status: 'unauthenticated', lastEvent: event }
}

function handleAuthChange(event: AuthChangeEvent, session: Session | null) {
  state = toState(event, session)
  storeListeners.forEach((listener) => listener())
  eventListeners.forEach((listener) => listener(event, state))
}

/** One Supabase subscription for the whole app, started on first use. */
function ensureAuthSubscription() {
  unsubscribeAuth ??= subscribeToAuthChanges(handleAuthChange)
}

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
