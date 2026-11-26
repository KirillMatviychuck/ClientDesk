import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { signOut } from '../api'

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: signOut,
    // Drop every cached query so the next user never sees this user's data.
    // The route guard redirects to /login when Supabase reports SIGNED_OUT.
    onSuccess: () => queryClient.clear(),
    onError: () => toast.error("Couldn't log out. Check your connection and try again."),
  })
}
