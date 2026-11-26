import { ROUTES } from '@/shared/routes'

/** Router location state set by ProtectedRoute when it sends a guest to /login. */
export interface AuthRedirectState {
  from: { pathname: string; search: string; hash: string }
}

const AUTH_PATHS: ReadonlySet<string> = new Set([
  ROUTES.login,
  ROUTES.register,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
])

function isRedirectState(state: unknown): state is AuthRedirectState {
  if (typeof state !== 'object' || state === null || !('from' in state)) return false
  const { from } = state
  return (
    typeof from === 'object' &&
    from !== null &&
    'pathname' in from &&
    typeof from.pathname === 'string' &&
    'search' in from &&
    typeof from.search === 'string' &&
    'hash' in from &&
    typeof from.hash === 'string'
  )
}

/**
 * Where to send a user who has just signed in. Only same-origin app paths are
 * accepted, so the value cannot redirect to another site.
 */
export function getRedirectTarget(state: unknown): string {
  if (!isRedirectState(state)) return ROUTES.dashboard

  const { pathname, search, hash } = state.from
  const isAppPath = pathname.startsWith('/') && !pathname.startsWith('//')
  if (!isAppPath || AUTH_PATHS.has(pathname)) return ROUTES.dashboard

  return `${pathname}${search}${hash}`
}
