import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

import type { Enums } from '@/shared/api'

export type WorkspaceRole = Enums<'workspace_role'>

export type SessionState =
  /** Supabase is still restoring the session from storage or the URL. */
  | { status: 'loading' }
  | { status: 'authenticated'; session: Session; user: User; lastEvent: AuthChangeEvent }
  | { status: 'unauthenticated'; lastEvent: AuthChangeEvent }

export type SessionStatus = SessionState['status']
