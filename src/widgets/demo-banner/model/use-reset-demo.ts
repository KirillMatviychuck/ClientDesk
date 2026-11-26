import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { resetDemoData } from '../api'

export function useResetDemo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resetDemoData,
    // The reset replaces every table in the workspace (and its name), so
    // every cached query is stale. Refetch them all.
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      toast.success('Demo data has been reset')
    },
    onError: () => toast.error("Couldn't reset the demo data. Please try again."),
  })
}
