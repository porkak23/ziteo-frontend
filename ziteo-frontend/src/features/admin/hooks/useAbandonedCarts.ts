import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface AbandonedCartItem {
  user_id: string
  product_id: string
  quantity: number
  added_at: string
  updated_at: string
  product_name: string
  provider_id: string
  price_unit: number
}

async function fetchAbandonedCarts(): Promise<AbandonedCartItem[]> {
  const { data, error } = await supabase
    .from('admin_abandoned_carts')
    .select('*')
    .order('updated_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as AbandonedCartItem[]
}

// Ver admin_abandoned_carts en 20260719000003_admin_history_and_alerts.sql.
export function useAbandonedCarts() {
  return useQuery<AbandonedCartItem[], Error>({
    queryKey: ['admin', 'abandoned-carts'],
    queryFn: fetchAbandonedCarts,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })
}

// Push de recuperación de carrito — un solo envío por click, sin cron ni
// automatización server-side (decisión manual del dueño, no spam automático).
export function useSendCartRecoveryPush() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (item: AbandonedCartItem) => {
      const { error } = await supabase.functions.invoke('notifications/send-push', {
        body: {
          user_id: item.user_id,
          title: 'Tienes productos esperando',
          body: `${item.product_name} sigue en tu carrito. ¿Completamos el pedido?`,
          url: '/',
        },
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'abandoned-carts'] })
    },
  })
}
