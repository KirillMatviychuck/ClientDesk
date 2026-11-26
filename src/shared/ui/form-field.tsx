import type * as React from 'react'

import { cn } from '@/shared/lib/utils'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'

type FormFieldProps = React.ComponentProps<typeof Input> & {
  id: string
  label: string
  error?: string
  /** Rendered next to the label, e.g. a "Forgot password?" link. */
  labelAction?: React.ReactNode
}

/** Label + input + validation message, wired for screen readers. */
function FormField({ id, label, error, labelAction, className, ...props }: FormFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className={cn('grid gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/** Form-level error, e.g. a failed request. Announced by screen readers. */
function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {children}
    </p>
  )
}

export { FormError, FormField }
