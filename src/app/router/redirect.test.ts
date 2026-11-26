import { describe, expect, it } from 'vitest'

import { ROUTES } from '@/shared/routes'

import { getRedirectTarget } from './redirect'

const from = (pathname: string, search = '', hash = '') => ({ from: { pathname, search, hash } })

describe('getRedirectTarget', () => {
  it('returns the original page with its query and hash', () => {
    expect(getRedirectTarget(from('/clients', '?page=2', '#top'))).toBe('/clients?page=2#top')
  })

  it('falls back to the dashboard without state', () => {
    expect(getRedirectTarget(null)).toBe(ROUTES.dashboard)
    expect(getRedirectTarget({ from: 'x' })).toBe(ROUTES.dashboard)
  })

  it('never redirects off-site or back to an auth page', () => {
    expect(getRedirectTarget(from('//evil.example'))).toBe(ROUTES.dashboard)
    expect(getRedirectTarget(from('https://evil.example'))).toBe(ROUTES.dashboard)
    expect(getRedirectTarget(from(ROUTES.login))).toBe(ROUTES.dashboard)
  })
})
