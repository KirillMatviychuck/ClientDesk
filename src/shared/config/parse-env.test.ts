import { describe, expect, it } from 'vitest'

import { isPrivilegedKey, parseEnv } from './parse-env'

/** Builds an unsigned JWT-shaped string with the given payload (base64url). */
function fakeJwt(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`
}

const validEnv = {
  VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
}

describe('isPrivilegedKey', () => {
  it('flags new-style secret keys', () => {
    expect(isPrivilegedKey('sb_secret_abc')).toBe(true)
  })

  it('flags legacy service_role JWTs', () => {
    expect(isPrivilegedKey(fakeJwt({ role: 'service_role' }))).toBe(true)
  })

  it('accepts publishable keys and legacy anon JWTs', () => {
    expect(isPrivilegedKey('sb_publishable_abc')).toBe(false)
    expect(isPrivilegedKey(fakeJwt({ role: 'anon' }))).toBe(false)
  })

  it('does not throw on malformed JWT payloads', () => {
    expect(isPrivilegedKey('a.%%%not-base64.c')).toBe(false)
  })
})

describe('parseEnv', () => {
  it('returns the parsed values for a valid env', () => {
    expect(parseEnv(validEnv)).toEqual(validEnv)
  })

  it('rejects a secret key', () => {
    expect(() => parseEnv({ ...validEnv, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_x' })).toThrow(
      /must never be used in the frontend/,
    )
  })

  it('rejects a service_role JWT', () => {
    const key = fakeJwt({ role: 'service_role' })
    expect(() => parseEnv({ ...validEnv, VITE_SUPABASE_PUBLISHABLE_KEY: key })).toThrow(
      /VITE_SUPABASE_PUBLISHABLE_KEY/,
    )
  })

  it('lists every missing variable', () => {
    expect(() => parseEnv({})).toThrow(/VITE_SUPABASE_URL[\s\S]*VITE_SUPABASE_PUBLISHABLE_KEY/)
  })

  it('rejects a non-http URL', () => {
    expect(() => parseEnv({ ...validEnv, VITE_SUPABASE_URL: 'ftp://example.com' })).toThrow(
      /VITE_SUPABASE_URL/,
    )
  })
})
