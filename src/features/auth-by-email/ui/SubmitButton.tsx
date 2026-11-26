import { LoaderCircleIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/shared/ui/button'

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
      {pending && <LoaderCircleIcon className="animate-spin" aria-hidden />}
      {children}
    </Button>
  )
}
