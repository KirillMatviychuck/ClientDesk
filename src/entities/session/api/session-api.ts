import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

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

/** The user's workspace with their role. Each user has one personal workspace. */
export async function fetchCurrentWorkspace(userId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select('role, workspace:workspaces!inner(id, name, currency)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error) throw error
  return { ...data.workspace, role: data.role }
}
