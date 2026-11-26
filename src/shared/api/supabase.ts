import { createClient } from '@supabase/supabase-js'

import { env } from '@/shared/config'

import type { Database } from './database.types'

/** The only Supabase client in the app. Import it only from `api/` segments. */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
