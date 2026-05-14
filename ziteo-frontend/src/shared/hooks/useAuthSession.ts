import { useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../features/auth/store/authStore'

/**
 * Restores the Supabase session on mount and keeps the store's tokens
 * in sync whenever Supabase silently refreshes the access token or the
 * user signs out from another tab / device.
 *
 * Call this once at the top of App — it replaces the manual
 * `supabase.auth.setSession()` useEffect that was previously there.
 */
export function useAuthSession() {
  const { clearSession, updateTokens } = useAuthStore()

  useEffect(() => {
    // Restore on mount: if Supabase has a valid (possibly refreshed) session,
    // make sure the store tokens are up-to-date so RLS queries keep working.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        updateTokens(session.access_token, session.refresh_token ?? '')
      } else {
        clearSession()
      }
    })

    // Keep tokens fresh on every silent token refresh and clear state on sign-out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          updateTokens(session.access_token, session.refresh_token ?? '')
        } else {
          clearSession()
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
