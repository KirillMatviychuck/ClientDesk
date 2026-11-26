import { parseEnv } from './parse-env'

const parsed = parseEnv(import.meta.env)

export const env = {
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  supabaseUrl: parsed.VITE_SUPABASE_URL,
  supabasePublishableKey: parsed.VITE_SUPABASE_PUBLISHABLE_KEY,
} as const
