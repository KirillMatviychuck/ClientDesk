import { useSyncExternalStore } from 'react'

// True from the anonymous sign-in until the demo data is seeded. The route
// guard reads it to hold the redirect, so nobody lands on an empty dashboard.
let startingDemo = false
const listeners = new Set<() => void>()

export function setStartingDemo(value: boolean) {
  startingDemo = value
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useIsStartingDemo(): boolean {
  return useSyncExternalStore(subscribe, () => startingDemo)
}
