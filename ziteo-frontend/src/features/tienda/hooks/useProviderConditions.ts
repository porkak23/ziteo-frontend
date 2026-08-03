import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export interface ProviderConditions {
  min_order_amount: number | null
  free_shipping_threshold: number | null
  delivery_time_hours: number | null
  store_name: string | null
}

export function useProviderConditions(sellerId: string) {
  return useQuery<ProviderConditions | null>({
    queryKey: ['provider-conditions', sellerId],
    queryFn: async () => {
      if (!sellerId) return null
      // Lee de la vista pública (siempre fila ajena en este flujo — el
      // comprador consultando condiciones de un vendedor), ver
      // 20260802000003_public_role_profiles_view.sql.
      const { data, error } = await supabase
        .from('public_role_profiles')
        .select('min_order_amount, free_shipping_threshold, delivery_time_hours, store_name')
        .eq('user_id', sellerId)
        .eq('role', 'proveedor')
        .single()
      if (error) {
        // No row found is acceptable — provider may not have set conditions
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data as unknown as ProviderConditions
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!sellerId,
  })
}
