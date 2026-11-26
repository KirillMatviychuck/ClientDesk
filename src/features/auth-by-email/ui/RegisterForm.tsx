import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { FormError, FormField } from '@/shared/ui/form-field'

import { getAuthErrorMessage } from '../lib'
import { registerSchema, useSignUp, type RegisterValues } from '../model'
import { SubmitButton } from './SubmitButton'
import { SuccessNotice } from './SuccessNotice'

/**
 * Without email confirmation Supabase signs the user in at once and the route
 * guard redirects. With it, there is no session yet, so we ask to check email.
 */
export function RegisterForm() {
  const signUp = useSignUp()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  if (signUp.data?.needsEmailConfirmation) {
    return (
      <SuccessNotice title="Check your email">
        We sent a confirmation link to {getValues('email')}. Open it to activate your account.
      </SuccessNotice>
    )
  }

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => void handleSubmit((values) => signUp.mutate(values))(event)}
    >
      <FormError>{signUp.isError && getAuthErrorMessage(signUp.error)}</FormError>
      <FormField
        id="register-name"
        label="Name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <FormField
        id="register-email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <FormField
        id="register-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />
      <SubmitButton pending={signUp.isPending}>Create account</SubmitButton>
    </form>
  )
}
