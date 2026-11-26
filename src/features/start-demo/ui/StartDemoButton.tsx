import { LoaderCircleIcon, PlayIcon } from 'lucide-react'

import { Button } from '@/shared/ui/button'
import { FormError } from '@/shared/ui/form-field'

import { getStartDemoErrorMessage } from '../lib'
import { useStartDemo } from '../model'

export function StartDemoButton() {
  const startDemo = useStartDemo()

  return (
    <div className="grid gap-3">
      <FormError>{startDemo.isError && getStartDemoErrorMessage(startDemo.error)}</FormError>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        disabled={startDemo.isPending}
        aria-busy={startDemo.isPending}
        onClick={() => startDemo.mutate()}
      >
        {startDemo.isPending ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden />
        ) : (
          <PlayIcon aria-hidden />
        )}
        {startDemo.isPending ? 'Preparing your demo…' : 'Try the demo'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No sign-up. Sample data, deleted after 7 days.
      </p>
    </div>
  )
}
