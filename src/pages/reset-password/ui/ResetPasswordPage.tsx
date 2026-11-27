import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useSession } from '@/entities/session'
import { ResetPasswordForm } from '@/features/auth-by-email'
import { ROUTES } from '@/shared/routes'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Target of the reset link in the email. Supabase reads the token from the URL
 * and opens a recovery session; without one the link is invalid or expired.
 * A regular session is not enough: changing the password needs the link.
 */
export function ResetPasswordPage() {
  const session = useSession()
  const navigate = useNavigate()

  if (session.status === 'loading') {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (session.status === 'unauthenticated') {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Link expired</h1>
          <p className="text-muted-foreground">
            This reset link is invalid or has already been used. Request a new one.
          </p>
        </header>
        <Button asChild size="lg" className="w-full">
          <Link to={ROUTES.forgotPassword}>Request a new link</Link>
        </Button>
      </div>
    )
  }

  if (!session.isPasswordRecovery) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Use the reset link</h1>
          <p className="text-muted-foreground">
            To set a new password, open the link from the password reset email.
          </p>
        </header>
        <Button asChild size="lg" className="w-full">
          <Link to={ROUTES.dashboard}>Back to dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground">For {session.user.email}</p>
      </header>
      <ResetPasswordForm
        onSuccess={() => {
          toast.success('Password updated')
          void navigate(ROUTES.dashboard, { replace: true })
        }}
      />
    </div>
  )
}
