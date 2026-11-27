import { AuthError } from '@supabase/supabase-js'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { signInWithEmail, signUpWithEmail, updatePassword } from '../api'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ResetPasswordForm } from './ResetPasswordForm'

vi.mock('../api', () => ({
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  requestPasswordReset: vi.fn(),
  updatePassword: vi.fn(),
}))

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.mocked(signInWithEmail).mockReset().mockResolvedValue(undefined)
  })

  it('shows validation errors and does not call the API', async () => {
    renderWithQuery(<LoginForm />)
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(signInWithEmail).not.toHaveBeenCalled()
  })

  it('submits trimmed credentials', async () => {
    renderWithQuery(<LoginForm />)
    await userEvent.type(screen.getByLabelText('Email'), '  ann@example.com ')
    await userEvent.type(screen.getByLabelText('Password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(signInWithEmail).toHaveBeenCalledWith(
      { email: 'ann@example.com', password: 'secret' },
      expect.anything(),
    )
  })

  it('shows a readable message when sign-in fails', async () => {
    vi.mocked(signInWithEmail).mockRejectedValue(
      new AuthError('Invalid login credentials', 400, 'invalid_credentials'),
    )
    renderWithQuery(<LoginForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'ann@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/.+/)
  })
})

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.mocked(signUpWithEmail).mockReset()
  })

  async function fillAndSubmit() {
    await userEvent.type(screen.getByLabelText('Name'), 'Ann')
    await userEvent.type(screen.getByLabelText('Email'), 'ann@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'long-enough')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
  }

  it('rejects a short password', async () => {
    renderWithQuery(<RegisterForm />)
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument()
    expect(signUpWithEmail).not.toHaveBeenCalled()
  })

  it('asks to check email when confirmation is required', async () => {
    vi.mocked(signUpWithEmail).mockResolvedValue({ needsEmailConfirmation: true })
    renderWithQuery(<RegisterForm />)
    await fillAndSubmit()

    expect(await screen.findByText('Check your email')).toBeInTheDocument()
    expect(screen.getByText(/ann@example\.com/)).toBeInTheDocument()
  })

  it('keeps the form when the user is signed in at once', async () => {
    vi.mocked(signUpWithEmail).mockResolvedValue({ needsEmailConfirmation: false })
    renderWithQuery(<RegisterForm />)
    await fillAndSubmit()

    expect(signUpWithEmail).toHaveBeenCalledOnce()
    expect(screen.queryByText('Check your email')).not.toBeInTheDocument()
  })
})

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.mocked(updatePassword).mockReset().mockResolvedValue(undefined)
  })

  it('requires matching passwords', async () => {
    const onSuccess = vi.fn()
    renderWithQuery(<ResetPasswordForm onSuccess={onSuccess} />)
    await userEvent.type(screen.getByLabelText('New password'), 'long-enough')
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'different')
    await userEvent.click(screen.getByRole('button', { name: 'Set new password' }))

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(updatePassword).not.toHaveBeenCalled()
  })

  it('updates the password and reports success', async () => {
    const onSuccess = vi.fn()
    renderWithQuery(<ResetPasswordForm onSuccess={onSuccess} />)
    await userEvent.type(screen.getByLabelText('New password'), 'long-enough')
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'long-enough')
    await userEvent.click(screen.getByRole('button', { name: 'Set new password' }))

    await vi.waitFor(() => expect(onSuccess).toHaveBeenCalledOnce())
    expect(updatePassword).toHaveBeenCalledWith('long-enough', expect.anything())
  })
})
