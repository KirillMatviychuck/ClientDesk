import {
  isAuthError,
  isAuthRetryableFetchError,
  isAuthWeakPasswordError,
} from '@supabase/supabase-js'

const NETWORK = "Can't reach the server. Check your connection and try again."
const FALLBACK = 'Something went wrong. Please try again.'

const BY_CODE: Record<string, string> = {
  invalid_credentials: 'Invalid email or password',
  email_not_confirmed: 'Confirm your email first. Check your inbox for the link.',
  user_already_exists: 'An account with this email already exists. Log in instead.',
  email_exists: 'An account with this email already exists. Log in instead.',
  email_address_invalid: 'Enter a valid email address',
  weak_password: 'This password is too weak. Choose a longer or less common one.',
  same_password: 'The new password must be different from the current one.',
  over_request_rate_limit: 'Too many attempts. Wait a minute and try again.',
  over_email_send_rate_limit: 'Too many emails sent. Wait a few minutes and try again.',
  signup_disabled: 'Sign-ups are currently closed.',
  anonymous_provider_disabled: 'The demo is unavailable right now. Please try again later.',
  session_not_found: 'Your session has expired. Request a new link or log in again.',
  session_expired: 'Your session has expired. Request a new link or log in again.',
  reauthentication_needed: 'For security, log in again before changing the password.',
}

/** Maps a Supabase auth error to a message that is safe to show the user. */
export function getAuthErrorMessage(error: unknown): string {
  if (isAuthRetryableFetchError(error) || error instanceof TypeError) return NETWORK
  if (isAuthWeakPasswordError(error)) return BY_CODE.weak_password ?? FALLBACK
  if (isAuthError(error)) {
    if (error.code && error.code in BY_CODE) return BY_CODE[error.code] ?? FALLBACK
    if (error.status === 429) return BY_CODE.over_request_rate_limit ?? FALLBACK
  }
  return FALLBACK
}
