import { z } from 'zod'

/**
 * Returns true if the key must never reach the browser:
 * a new-style secret key (`sb_secret_…`) or a legacy JWT with `role: service_role`.
 */
function isPrivilegedKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true

  const payload = key.split('.')[1]
  if (!payload) return false
  try {
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const parsed: unknown = JSON.parse(json)
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'role' in parsed &&
      parsed.role === 'service_role'
    )
  } catch {
    return false
  }
}

const envSchema = z.object({
  VITE_SUPABASE_URL: z.url({ protocol: /^https?$/ }),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .min(1)
    .refine((key) => !isPrivilegedKey(key), {
      message: 'Secret / service_role keys must never be used in the frontend',
    }),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(
    `Invalid environment variables:\n${details}\nCopy .env.example to .env.local and fill it in.`,
  )
}

export const env = {
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabasePublishableKey: parsed.data.VITE_SUPABASE_PUBLISHABLE_KEY,
} as const
