import { Link } from 'react-router'

import { ForgotPasswordForm } from '@/features/auth-by-email'
import { ROUTES } from '@/shared/routes'

export function ForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-muted-foreground">
          Enter your account email and we'll send you a reset link.
        </p>
      </header>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link
          to={ROUTES.login}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Back to log in
        </Link>
      </p>
    </div>
  )
}
