import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface AdminUserRow {
  user_id: string
  name: string
  phone: string
  city: string | null
  active_role: string
  created_at: string
}

function escapePostgrestLike(term: string): string {
  return term.replace(/[,%*\\]/g, '\\$&')
}

async function searchUsers(term: string): Promise<AdminUserRow[]> {
  if (!term.trim()) return []
  const safeTerm = escapePostgrestLike(term.trim())
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, name, phone, city, active_role, created_at')
    .or(`name.ilike.%${safeTerm}%,phone.ilike.%${safeTerm}%`)
    .order('created_at', { ascending: false })
    .limit(30)
  if (error) throw error
  return (data ?? []) as AdminUserRow[]
}

// profiles ya es legible por cualquier authenticated (policy profiles_select_all
// USING true) — sin policy nueva, esta búsqueda funciona para cualquier admin
// tan pronto is_admin() sea true. No requiere RPC ni Edge Function.
export function useAdminUsers(term: string) {
  return useQuery<AdminUserRow[], Error>({
    queryKey: ['admin', 'users', term],
    queryFn: () => searchUsers(term),
    staleTime: 30_000,
    enabled: term.trim().length >= 2,
  })
}

// Reset de PIN: requiere aal2 (segundo factor verificado) — la Edge Function
// lo valida server-side vía requireAdmin(req, {mfa:true}); este hook no
// decide nada de permisos, solo invoca y deja que el 403 llegue si falta MFA.
export function useResetUserPin() {
  const queryClient = useQueryClient()
  return useMutation<{ reset: boolean }, Error, { targetUserId: string; newPin: string }>({
    mutationFn: async ({ targetUserId, newPin }) => {
      const { data, error } = await supabase.functions.invoke('admin-user-actions', {
        body: { action: 'reset_pin', target_user_id: targetUserId, new_pin: newPin },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
