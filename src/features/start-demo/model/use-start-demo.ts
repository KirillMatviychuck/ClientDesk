import { useMutation } from '@tanstack/react-query'

import { seedDemoData, signInAsDemoUser, signOutDemoUser } from '../api'
import { setStartingDemo } from './demo-setup-store'

async function startDemo(): Promise<void> {
  setStartingDemo(true)
  try {
    await signInAsDemoUser()
    try {
      await seedDemoData()
    } catch (error) {
      // Do not leave the visitor in an empty demo: drop the anonymous session.
      await signOutDemoUser().catch(() => undefined)
      throw error
    }
  } finally {
    setStartingDemo(false)
  }
}

/** On success the route guard sends the visitor to the dashboard. */
export function useStartDemo() {
  return useMutation({ mutationFn: startDemo })
}
