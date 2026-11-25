import type { ReactNode } from 'react'

import { ThemeProvider } from '@/shared/lib/theme'
import { Toaster } from '@/shared/ui/sonner'

import { QueryProvider } from './QueryProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryProvider>
        {children}
        <Toaster richColors closeButton />
      </QueryProvider>
    </ThemeProvider>
  )
}
