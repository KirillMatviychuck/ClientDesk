import { z } from 'zod'

const email = z
  .string()
  .trim()
  .min(1, 'Enter your email')
  .pipe(z.email('Enter a valid email address'))

/** Supabase hashes with bcrypt, which ignores bytes after 72. */
const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use at most 72 characters')

export const loginSchema = z.object({
  email,
  // No length rule on login: old passwords may predate the current policy.
  password: z.string().min(1, 'Enter your password'),
})

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100, 'Use at most 100 characters'),
  email,
  password: newPassword,
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, 'Repeat the new password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type LoginValues = z.output<typeof loginSchema>
export type RegisterValues = z.output<typeof registerSchema>
export type ForgotPasswordValues = z.output<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.output<typeof resetPasswordSchema>
