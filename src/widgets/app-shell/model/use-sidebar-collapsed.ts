import { useCallback, useState } from 'react'

const STORAGE_KEY = 'clientdesk-sidebar-collapsed'

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    // Storage can be blocked (private mode, site settings): use the default.
    return false
  }
}

/** Desktop sidebar collapsed to icons; remembered per browser. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(readCollapsed)

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // Not critical: the choice just will not survive a reload.
      }
      return next
    })
  }, [])

  return { collapsed, toggle }
}
