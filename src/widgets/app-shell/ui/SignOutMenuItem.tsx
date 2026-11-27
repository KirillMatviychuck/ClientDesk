import { LoaderCircleIcon, LogOutIcon } from 'lucide-react'

import { DropdownMenuItem } from '@/shared/ui/dropdown-menu'

import { useSignOut } from '../model'

/** "Log out" entry for a dropdown menu (e.g. the user menu). */
export function SignOutMenuItem() {
  const signOut = useSignOut()

  return (
    <DropdownMenuItem
      disabled={signOut.isPending}
      onSelect={(event) => {
        // Keep the menu open so the spinner is visible until the session ends.
        event.preventDefault()
        signOut.mutate()
      }}
    >
      {signOut.isPending ? (
        <LoaderCircleIcon className="animate-spin" aria-hidden />
      ) : (
        <LogOutIcon aria-hidden />
      )}
      Log out
    </DropdownMenuItem>
  )
}
