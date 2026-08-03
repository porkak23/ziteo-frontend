import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface IsAdminResult {
  isAdmin: boolean
  // aal2 = ya verificó un segundo factor (TOTP) en esta sesión. Las escrituras
  // admin (reset de PIN, etc.) exigen aal2 vía is_admin_mfa() en Postgres —
  // este flag es solo para decidir la UI (banner/deshabilitar botones), la
  // validación real ocurre server-side en cada RPC.
  hasMfa: boolean
}

// Server-side guard: nunca confiar solo en active_role del cliente para
// decidir si mostrar el panel admin. is_admin() consulta user_roles en
// vivo (ver 20260719000001_admin_role_foundation.sql).
export function useIsAdmin() {
  return useQuery<IsAdminResult, Error>({
    queryKey: ['admin', 'is-admin'],
    queryFn: async () => {
      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin')
      if (isAdminError) throw isAdminError

      const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalError) throw aalError

      return {
        isAdmin: Boolean(isAdminData),
        hasMfa: aalData?.currentLevel === 'aal2',
      }
    },
    staleTime: 5 * 60 * 1_000,
    retry: false,
  })
}
