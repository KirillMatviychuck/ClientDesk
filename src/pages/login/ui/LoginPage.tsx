import { Link, useLocation } from 'react-router'

import { LoginForm } from '@/features/auth-by-email'
import { StartDemoButton } from '@/features/start-demo'
import { ROUTES } from '@/shared/routes'

export function LoginPage() {
  // Carries the "return to" target from the route guard over to sign-up.
  const state: unknown = useLocation().state

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="text-muted-foreground">Sign in to your ClientDesk workspace.</p>
      </header>
      <LoginForm
        passwordAction={
          <Link
            to={ROUTES.forgotPassword}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Forgot password?
          </Link>
        }
      />
      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <StartDemoButton />
      <p className="text-center text-sm text-muted-foreground">
        No account yet?{' '}
        <Link
          to={ROUTES.register}
          state={state}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
