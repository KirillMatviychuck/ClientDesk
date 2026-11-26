import { LoaderCircleIcon, RotateCcwIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'

import { useResetDemo } from '../model'

export function ResetDemoButton() {
  const [open, setOpen] = useState(false)
  const resetDemo = useResetDemo()

  return (
    <Dialog
      open={open}
      // Keep the dialog open while the reset runs.
      onOpenChange={(next) => !resetDemo.isPending && setOpen(next)}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RotateCcwIcon aria-hidden />
          Reset demo data
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={!resetDemo.isPending}>
        <DialogHeader>
          <DialogTitle>Reset demo data?</DialogTitle>
          <DialogDescription>
            All changes you made in the demo will be lost and the sample data will be restored.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={resetDemo.isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={resetDemo.isPending}
            aria-busy={resetDemo.isPending}
            onClick={() => resetDemo.mutate(undefined, { onSuccess: () => setOpen(false) })}
          >
            {resetDemo.isPending && <LoaderCircleIcon className="animate-spin" aria-hidden />}
            Reset data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
