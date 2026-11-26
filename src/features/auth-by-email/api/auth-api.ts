import { AuthError } from '@supabase/supabase-js'

import { supabase } from '@/shared/api'
import { ROUTES } from '@/shared/routes'

import type { LoginValues, RegisterValues } from '../model'

/** Absolute URL of an app route, used as the target of links in auth emails. */
function appUrl(path: string): string {
  return new URL(path, window.location.origin).href
}

export async function signInWithEmail({ email, password }: LoginValues): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export interface SignUpResult {
  /** True when the project requires email confirmation: no session yet. */
  needsEmailConfirmation: boolean
}

export async function signUpWithEmail({
  name,
  email,
  password,
}: RegisterValues): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the handle_new_user trigger to name the profile and workspace.
      data: { full_name: name },
      emailRedirectTo: appUrl(ROUTES.dashboard),
    },
  })
  if (error) throw error

  // With email confirmation on, Supabase does not return an error for an
  // existing email; it returns a placeholder user without identities.
  if (data.user?.identities?.length === 0) {
    throw new AuthError('User already registered', 422, 'user_already_exists')
  }

  return { needsEmailConfirmation: data.session === null }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: appUrl(ROUTES.resetPassword),
  })
  if (error) throw error
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
