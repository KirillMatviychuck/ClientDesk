import { describe, expect, it } from 'vitest'

import { canDelete, canEdit } from './permissions'

describe('session permissions', () => {
  it.each([
    ['owner', true, true],
    ['admin', true, true],
    ['member', true, false],
  ] as const)('%s: canEdit=%s, canDelete=%s', (role, edit, remove) => {
    expect(canEdit(role)).toBe(edit)
    expect(canDelete(role)).toBe(remove)
  })

  it('denies everything without a role', () => {
    expect(canEdit(null)).toBe(false)
    expect(canDelete(undefined)).toBe(false)
  })
})
