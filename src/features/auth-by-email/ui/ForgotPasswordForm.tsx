import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormError, FormField } from '@/shared/ui/form-field'

import { getAuthErrorMessage } from '@/entities/session'
import { forgotPasswordSchema, useRequestPasswordReset, type ForgotPasswordValues } from '../model'
import { SubmitButton } from './SubmitButton'
import { SuccessNotice } from './SuccessNotice'

/** The reply is the same whether or not the email has an account. */
export function ForgotPasswordForm() {
  const resetRequest = useRequestPasswordReset()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  if (resetRequest.isSuccess) {
    return (
      <SuccessNotice title="Check your email">
        If an account exists for {getValues('email')}, we sent a link to reset the password.
      </SuccessNotice>
    )
  }

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => void handleSubmit(({ email }) => resetRequest.mutate(email))(event)}
    >
      <FormError>{resetRequest.isError && getAuthErrorMessage(resetRequest.error)}</FormError>
      <FormField
        id="forgot-email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <SubmitButton pending={resetRequest.isPending}>Send reset link</SubmitButton>
    </form>
  )
}
