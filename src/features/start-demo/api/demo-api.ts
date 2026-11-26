import { supabase } from '@/shared/api'

/** Creates an anonymous user; the sign-up trigger creates its workspace. */
export async function signInAsDemoUser(): Promise<void> {
  const { error } = await supabase.auth.signInAnonymously()
  if (error) throw error
}

/** Fills the new, empty demo workspace. Refused for non-anonymous users. */
export async function seedDemoData(): Promise<void> {
  const { error } = await supabase.rpc('seed_demo_data')
  if (error) throw error
}

export async function signOutDemoUser(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' })
}
