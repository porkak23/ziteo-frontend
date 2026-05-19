import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Dispute {
  id: string
  order_id: string
  created_by: string
  reason: string
  details: string
  status: 'open' | 'resolved'
  created_at: string
  resolved_at: string | null
}

export interface CreateDisputeParams {
  orderId: string
  reason: string
  details: string
}

// ─── useCreateDispute ────────────────────────────────────────────────────────
// Llama a la RPC create_dispute para abrir una disputa en una orden.
// La RPC valida que el caller sea el constructor o proveedor de esa orden.

export function useCreateDispute() {
  const queryClient = useQueryClient()

  return useMutation<{ dispute_id: string; order_id: string }, Error, CreateDisputeParams>({
    mutationFn: async ({ orderId, reason, details }) => {
      const { data, error } = await supabase.rpc('create_dispute', {
        p_order_id: orderId,
        p_reason:   reason,
        p_details:  details,
      })

      if (error) throw new Error(error.message)

      const result = data as { success: boolean; dispute_id: string; order_id: string }
      if (!result?.success) {
        throw new Error('No se pudo crear la disputa. Intenta nuevamente.')
      }

      return { dispute_id: result.dispute_id, order_id: result.order_id }
    },
    onSuccess: () => {
      // Invalidar disputes y notificaciones para que se actualicen
      queryClient.invalidateQueries({ queryKey: ['disputes'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// ─── useMyDisputes ────────────────────────────────────────────────────────────
// Devuelve todas las disputas en las que el usuario actual es parte involucrada
// (ya sea como constructor o proveedor de la orden relacionada).
// La RLS en la tabla disputes ya filtra correctamente.

export function useMyDisputes() {
  const currentUser = useAuthStore((s) => s.user)
  const uid = currentUser?.user_id ?? null

  return useQuery<Dispute[]>({
    queryKey: ['disputes', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disputes')
        .select('id, order_id, created_by, reason, details, status, created_at, resolved_at')
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)

      return (data ?? []) as Dispute[]
    },
  })
}
