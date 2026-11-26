import { zodResolver } from '@hookform/resolvers/zod'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { FormError, FormField } from '@/shared/ui/form-field'

import { getAuthErrorMessage } from '@/entities/session'
import { loginSchema, useSignIn, type LoginValues } from '../model'
import { SubmitButton } from './SubmitButton'

interface LoginFormProps {
  /** Shown next to the password label, e.g. a link to password reset. */
  passwordAction?: ReactNode
}

/** On success the session changes and the route guard redirects. */
export function LoginForm({ passwordAction }: LoginFormProps) {
  const signIn = useSignIn()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={(event) => void handleSubmit((values) => signIn.mutate(values))(event)}
    >
      <FormError>{signIn.isError && getAuthErrorMessage(signIn.error)}</FormError>
      <FormField
        id="login-email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <FormField
        id="login-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        labelAction={passwordAction}
        error={errors.password?.message}
        {...register('password')}
      />
      <SubmitButton pending={signIn.isPending}>Log in</SubmitButton>
    </form>
  )
}
