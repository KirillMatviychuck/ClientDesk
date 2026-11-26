import { useQuery } from '@tanstack/react-query'

import { fetchCurrentWorkspace, sessionKeys } from '../api'
import { useSession } from './session-store'

/** The signed-in user's workspace and role. Disabled while signed out. */
export function useCurrentWorkspace() {
  const session = useSession()
  const userId = session.status === 'authenticated' ? session.user.id : null

  return useQuery({
    queryKey: sessionKeys.workspace(userId ?? ''),
    queryFn: () => fetchCurrentWorkspace(userId ?? ''),
    enabled: userId !== null,
    staleTime: 5 * 60_000,
  })
}
