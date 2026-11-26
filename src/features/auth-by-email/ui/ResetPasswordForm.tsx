import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormError, FormField } from '@/shared/ui/form-field'

import { getAuthErrorMessage } from '../lib'
import { resetPasswordSchema, useUpdatePassword, type ResetPasswordValues } from '../model'
import { SubmitButton } from './SubmitButton'

/** Needs the recovery session that Supabase creates from the email link. */
export function ResetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const updatePassword = useUpdatePassword()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) =>
        void handleSubmit(({ password }) => updatePassword.mutate(password, { onSuccess }))(event)
      }
    >
      <FormError>{updatePassword.isError && getAuthErrorMessage(updatePassword.error)}</FormError>
      <FormField
        id="reset-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />
      <FormField
        id="reset-confirm-password"
        label="Repeat new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <SubmitButton pending={updatePassword.isPending}>Set new password</SubmitButton>
    </form>
  )
}
