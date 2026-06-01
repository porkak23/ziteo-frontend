import { useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../features/auth/store/authStore'
import { upgradeAnonymousSession, loginBeta } from '../../features/auth/services/authService'

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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        updateTokens(session.access_token, session.refresh_token ?? '')

        // Silent migration fallback if the user already has a session
        const currentUser = useAuthStore.getState().user
        if (currentUser?.phone) {
          upgradeAnonymousSession(currentUser.phone)
        }
        return
      }

      // No Supabase session but we still have a persisted user: re-establish
      // the session silently using the deterministic beta credentials derived
      // from the phone. Only clear the store if that re-login fails.
      const storedUser = useAuthStore.getState().user
      if (storedUser?.phone) {
        try {
          const refreshed = await loginBeta(storedUser.phone)
          useAuthStore.getState().setUser(refreshed)
        } catch {
          clearSession()
        }
      } else {
        clearSession()
      }
    })

    // Keep tokens fresh on every silent token refresh and clear state on sign-out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          updateTokens(session.access_token, session.refresh_token ?? '')
          
          // Silent migration on token refresh
          const currentUser = useAuthStore.getState().user
          if (currentUser?.phone) {
            upgradeAnonymousSession(currentUser.phone)
          }
        } else {
          clearSession()
        }
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

