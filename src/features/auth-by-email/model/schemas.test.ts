import { describe, expect, it } from 'vitest'

import { loginSchema, registerSchema, resetPasswordSchema } from './schemas'

function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.error?.issues[0]?.message
}

describe('auth schemas', () => {
  it('trims the email and accepts any non-empty password on login', () => {
    const result = loginSchema.parse({ email: '  dev@clientdesk.test ', password: 'x' })
    expect(result.email).toBe('dev@clientdesk.test')
  })

  it('rejects an invalid email', () => {
    expect(firstError(loginSchema.safeParse({ email: 'nope', password: 'x' }))).toBe(
      'Enter a valid email address',
    )
  })

  it('requires a name and an 8+ character password on sign-up', () => {
    const result = registerSchema.safeParse({ name: ' ', email: 'a@b.co', password: 'short' })
    expect(result.error?.issues.map((issue) => issue.message)).toEqual([
      'Enter your name',
      'Use at least 8 characters',
    ])
  })

  it('requires matching passwords on reset', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'long-enough',
      confirmPassword: 'different!',
    })
    expect(result.error?.issues[0]).toMatchObject({
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    })
  })
})
