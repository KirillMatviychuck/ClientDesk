import type { User } from '@supabase/supabase-js'

/**
 * Name to show for the signed-in user: the name given at sign-up, else the
 * email. Demo users are anonymous and have neither.
 */
export function getUserDisplayName(user: User): string {
  const metadata: Record<string, unknown> = user.user_metadata
  const fullName = metadata.full_name
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim()
  if (user.email) return user.email
  return user.is_anonymous ? 'Demo user' : 'User'
}

/** Up to two initials for an avatar, e.g. "Ann Lee" → "AL". */
export function getInitials(name: string): string {
  const words = name.split(/[\s@._-]+/).filter(Boolean)
  const initials = words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
  return initials || '?'
}
