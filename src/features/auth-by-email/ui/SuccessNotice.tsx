import { MailCheckIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function SuccessNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="status" className="flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
      <MailCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}
