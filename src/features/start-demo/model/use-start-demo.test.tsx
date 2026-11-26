import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { seedDemoData, signInAsDemoUser, signOutDemoUser } from '../api'
import { useIsStartingDemo } from './demo-setup-store'
import { useStartDemo } from './use-start-demo'

vi.mock('../api', () => ({
  signInAsDemoUser: vi.fn(),
  seedDemoData: vi.fn(),
  signOutDemoUser: vi.fn(),
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function renderStartDemo() {
  return renderHook(() => ({ mutation: useStartDemo(), starting: useIsStartingDemo() }), {
    wrapper,
  })
}

describe('useStartDemo', () => {
  beforeEach(() => {
    vi.mocked(signInAsDemoUser).mockReset().mockResolvedValue(undefined)
    vi.mocked(seedDemoData).mockReset().mockResolvedValue(undefined)
    vi.mocked(signOutDemoUser).mockReset().mockResolvedValue(undefined)
  })

  it('signs in, seeds and releases the redirect hold', async () => {
    const { result } = renderStartDemo()
    act(() => result.current.mutation.mutate())

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    expect(seedDemoData).toHaveBeenCalledOnce()
    expect(signOutDemoUser).not.toHaveBeenCalled()
    expect(result.current.starting).toBe(false)
  })

  it('signs the anonymous user out when seeding fails', async () => {
    vi.mocked(seedDemoData).mockRejectedValue(new Error('seed failed'))
    const { result } = renderStartDemo()
    act(() => result.current.mutation.mutate())

    await waitFor(() => expect(result.current.mutation.isError).toBe(true))
    expect(signOutDemoUser).toHaveBeenCalledOnce()
    expect(result.current.starting).toBe(false)
  })

  it('does not seed when the sign-in fails', async () => {
    vi.mocked(signInAsDemoUser).mockRejectedValue(new Error('rate limited'))
    const { result } = renderStartDemo()
    act(() => result.current.mutation.mutate())

    await waitFor(() => expect(result.current.mutation.isError).toBe(true))
    expect(seedDemoData).not.toHaveBeenCalled()
    expect(result.current.starting).toBe(false)
  })
})
