import type { User } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { getInitials, getUserDisplayName } from './user-display'

function user(fields: Partial<User>): User {
  return { id: 'u1', app_metadata: {}, user_metadata: {}, aud: '', created_at: '', ...fields }
}

describe('getUserDisplayName', () => {
  it('prefers the name given at sign-up', () => {
    expect(
      getUserDisplayName(user({ email: 'ann@example.com', user_metadata: { full_name: ' Ann ' } })),
    ).toBe('Ann')
  })

  it('falls back to the email, then to a demo label', () => {
    expect(getUserDisplayName(user({ email: 'ann@example.com' }))).toBe('ann@example.com')
    expect(getUserDisplayName(user({ is_anonymous: true }))).toBe('Demo user')
  })
})

describe('getInitials', () => {
  it('takes the first letters of up to two words', () => {
    expect(getInitials('Ann Lee Smith')).toBe('AL')
    expect(getInitials('ann@example.com')).toBe('AE')
    expect(getInitials('')).toBe('?')
  })
})
