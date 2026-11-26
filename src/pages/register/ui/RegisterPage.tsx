import { Link, useLocation } from 'react-router'

import { RegisterForm } from '@/features/auth-by-email'
import { ROUTES } from '@/shared/routes'

export function RegisterPage() {
  const state: unknown = useLocation().state

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-muted-foreground">Start managing clients, deals and invoices.</p>
      </header>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          to={ROUTES.login}
          state={state}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  )
}
