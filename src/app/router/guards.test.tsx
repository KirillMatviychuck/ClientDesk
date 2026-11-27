import type { Session } from '@supabase/supabase-js'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSession, type SessionState } from '@/entities/session'
import { useIsStartingDemo } from '@/features/start-demo'
import { ROUTES } from '@/shared/routes'

import { GuestRoute, ProtectedRoute } from './guards'

vi.mock('@/entities/session', () => ({ useSession: vi.fn() }))
vi.mock('@/features/start-demo', () => ({ useIsStartingDemo: vi.fn() }))

const signedIn: SessionState = {
  status: 'authenticated',
  session: { user: { id: 'u1' } } as Session,
  user: { id: 'u1' } as Session['user'],
  lastEvent: 'SIGNED_IN',
  isPasswordRecovery: false,
}

function LoginProbe() {
  const state: unknown = useLocation().state
  return <p>login page {JSON.stringify(state ?? null)}</p>
}

function renderAt(pathname: string, state?: unknown, search = '') {
  const router = createMemoryRouter(
    [
      {
        Component: GuestRoute,
        children: [{ path: ROUTES.login, Component: LoginProbe }],
      },
      {
        Component: ProtectedRoute,
        children: [
          { path: ROUTES.dashboard, element: <p>dashboard page</p> },
          { path: ROUTES.clients, element: <p>clients page</p> },
        ],
      },
    ],
    { initialEntries: [{ pathname, search, state }] },
  )
  render(<RouterProvider router={router} />)
}

describe('route guards', () => {
  beforeEach(() => {
    vi.mocked(useIsStartingDemo).mockReturnValue(false)
  })

  it('shows a loader while the session is restored', () => {
    vi.mocked(useSession).mockReturnValue({ status: 'loading' })
    renderAt(ROUTES.clients)
    expect(screen.queryByText('clients page')).not.toBeInTheDocument()
    expect(screen.queryByText(/login page/)).not.toBeInTheDocument()
  })

  it('sends a guest to /login and remembers where they were going', () => {
    vi.mocked(useSession).mockReturnValue({
      status: 'unauthenticated',
      lastEvent: 'INITIAL_SESSION',
    })
    renderAt(ROUTES.clients, undefined, '?q=acme')
    expect(screen.getByText(/login page/)).toHaveTextContent('"pathname":"/clients"')
    expect(screen.getByText(/login page/)).toHaveTextContent('"search":"?q=acme"')
  })

  it('forgets the return target after an explicit sign-out', () => {
    vi.mocked(useSession).mockReturnValue({ status: 'unauthenticated', lastEvent: 'SIGNED_OUT' })
    renderAt(ROUTES.clients)
    expect(screen.getByText('login page null')).toBeInTheDocument()
  })

  it('lets a signed-in user into the app', () => {
    vi.mocked(useSession).mockReturnValue(signedIn)
    renderAt(ROUTES.clients)
    expect(screen.getByText('clients page')).toBeInTheDocument()
  })

  it('sends a signed-in user from /login to the saved target', () => {
    vi.mocked(useSession).mockReturnValue(signedIn)
    renderAt(ROUTES.login, { from: { pathname: ROUTES.clients, search: '', hash: '' } })
    expect(screen.getByText('clients page')).toBeInTheDocument()
  })

  it('holds a demo visitor on /login until the demo data exists', () => {
    vi.mocked(useSession).mockReturnValue(signedIn)
    vi.mocked(useIsStartingDemo).mockReturnValue(true)
    renderAt(ROUTES.login)
    expect(screen.getByText(/login page/)).toBeInTheDocument()
  })
})
