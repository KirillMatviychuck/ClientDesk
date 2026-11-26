import { AuthApiError, AuthError, AuthRetryableFetchError } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

import { getAuthErrorMessage } from './get-auth-error-message'

describe('getAuthErrorMessage', () => {
  it('shows one generic message for wrong email or password', () => {
    const error = new AuthApiError('Invalid login credentials', 400, 'invalid_credentials')
    expect(getAuthErrorMessage(error)).toBe('Invalid email or password')
  })

  it('explains a duplicate email', () => {
    const error = new AuthError('User already registered', 422, 'user_already_exists')
    expect(getAuthErrorMessage(error)).toMatch(/already exists/)
  })

  it('treats rate limits without a known code as rate limits', () => {
    expect(getAuthErrorMessage(new AuthApiError('slow down', 429, undefined))).toMatch(
      /Too many attempts/,
    )
  })

  it('reports network failures', () => {
    expect(getAuthErrorMessage(new AuthRetryableFetchError('fetch failed', 0))).toMatch(
      /connection/,
    )
    expect(getAuthErrorMessage(new TypeError('Failed to fetch'))).toMatch(/connection/)
  })

  it('never leaks raw server messages', () => {
    expect(getAuthErrorMessage(new AuthApiError('db exploded at row 5', 500, 'x'))).toBe(
      'Something went wrong. Please try again.',
    )
    expect(getAuthErrorMessage('???')).toBe('Something went wrong. Please try again.')
  })
})
