import type { WorkspaceRole } from './types'

/**
 * UI hints only; RLS is the real check. They mirror the policies:
 * every member can create and edit, only owner and admin can delete.
 */
export function canEdit(role: WorkspaceRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin' || role === 'member'
}

export function canDelete(role: WorkspaceRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin'
}
