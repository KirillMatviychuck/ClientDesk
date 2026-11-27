import { supabase } from '@/shared/api'

/** Ends the session in this browser; other devices stay signed in. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' })
  if (error) throw error
}
