import { useMutation } from '@tanstack/react-query'

import { requestPasswordReset, signInWithEmail, signUpWithEmail, updatePassword } from '../api'

// Session state is not cached in TanStack Query: Supabase notifies the
// session entity through onAuthStateChange, so these need no invalidation.

export function useSignIn() {
  return useMutation({ mutationFn: signInWithEmail })
}

export function useSignUp() {
  return useMutation({ mutationFn: signUpWithEmail })
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset })
}

export function useUpdatePassword() {
  return useMutation({ mutationFn: updatePassword })
}
