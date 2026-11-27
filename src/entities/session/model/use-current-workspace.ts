import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchCurrentWorkspace, SessionEndedError, sessionKeys } from '../api'
import { useSession } from './session-store'

/** The signed-in user's workspace and role. Disabled while signed out. */
export function useCurrentWorkspace() {
  const session = useSession()
  const userId = session.status === 'authenticated' ? session.user.id : null

  return useQuery({
    queryKey: sessionKeys.workspace(userId ?? ''),
    queryFn: async () => {
      try {
        return await fetchCurrentWorkspace(userId ?? '')
      } catch (error) {
        if (error instanceof SessionEndedError) {
          toast.info('Your account no longer exists. Sign in or start a new demo.')
        }
        throw error
      }
    },
    enabled: userId !== null,
    retry: (failureCount, error) => !(error instanceof SessionEndedError) && failureCount < 3,
    staleTime: 5 * 60_000,
  })
}
