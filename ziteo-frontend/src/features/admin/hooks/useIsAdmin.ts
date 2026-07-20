import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// Server-side guard: nunca confiar solo en active_role del cliente para
// decidir si mostrar el panel admin. is_admin() consulta user_roles en
// vivo (ver 20260719000001_admin_role_foundation.sql).
export function useIsAdmin() {
  return useQuery<boolean, Error>({
    queryKey: ['admin', 'is-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_admin')
      if (error) throw error
      return Boolean(data)
    },
    staleTime: 5 * 60 * 1_000,
    retry: false,
  })
}
