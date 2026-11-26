import { isAuthError } from '@supabase/supabase-js'

import { getAuthErrorMessage } from '@/entities/session'

/** Sign-in failures use the auth messages; anything else is a seeding failure. */
export function getStartDemoErrorMessage(error: unknown): string {
  if (isAuthError(error) || error instanceof TypeError) return getAuthErrorMessage(error)
  return "Couldn't prepare the demo. Please try again."
}
