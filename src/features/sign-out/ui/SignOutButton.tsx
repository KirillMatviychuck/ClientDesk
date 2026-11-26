import { LoaderCircleIcon, LogOutIcon } from 'lucide-react'

import { Button } from '@/shared/ui/button'

import { useSignOut } from '../model'

export function SignOutButton() {
  const signOut = useSignOut()

  return (
    <Button variant="ghost" size="sm" disabled={signOut.isPending} onClick={() => signOut.mutate()}>
      {signOut.isPending ? (
        <LoaderCircleIcon className="animate-spin" aria-hidden />
      ) : (
        <LogOutIcon aria-hidden />
      )}
      Log out
    </Button>
  )
}
