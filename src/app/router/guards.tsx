import { Navigate, Outlet, useLocation } from 'react-router'

import { useSession } from '@/entities/session'
import { useIsStartingDemo } from '@/features/start-demo'
import { ROUTES } from '@/shared/routes'

import { FullScreenLoader } from './FullScreenLoader'
import { getRedirectTarget, type AuthRedirectState } from './redirect'

/** Lets only signed-in users through; guests go to /login and come back after. */
export function ProtectedRoute() {
  const session = useSession()
  const location = useLocation()

  if (session.status === 'loading') return <FullScreenLoader />

  if (session.status === 'unauthenticated') {
    // After an explicit sign-out, start fresh: the next user may be someone else.
    const state: AuthRedirectState | undefined =
      session.lastEvent === 'SIGNED_OUT'
        ? undefined
        : { from: { pathname: location.pathname, search: location.search, hash: location.hash } }
    return <Navigate to={ROUTES.login} state={state} replace />
  }

  return <Outlet />
}

/** Login/register pages: signed-in users are sent on to the app. */
export function GuestRoute() {
  const session = useSession()
  const isStartingDemo = useIsStartingDemo()
  const location = useLocation()

  if (session.status === 'loading') return <FullScreenLoader />

  // A demo visitor is signed in before the demo data exists: wait for it.
  if (session.status === 'authenticated' && !isStartingDemo) {
    return <Navigate to={getRedirectTarget(location.state)} replace />
  }

  return <Outlet />
}
