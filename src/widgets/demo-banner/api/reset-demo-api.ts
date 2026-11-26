import { supabase } from '@/shared/api'

/** Wipes the demo workspace and seeds it again. Refused outside demo mode. */
export async function resetDemoData(): Promise<void> {
  const { error } = await supabase.rpc('reset_demo_data')
  if (error) throw error
}
