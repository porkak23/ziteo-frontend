import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'

export const INVENTARIO_PAGE_SIZE = 15

export interface ProductoInventario {
  id: string
  name: string
  price: number
  unit: string
  stock: number
  image_url: string | null
  active: boolean
}

export function useInventario(offset: number) {
  const user = useAuthStore((s) => s.user)
  const user_id = user?.user_id ?? ''
  const active_role = user?.active_role

  return useQuery<ProductoInventario[]>({
    queryKey: ['inventario', user_id, offset],
    enabled: !!user_id && active_role === 'proveedor',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price_unit, unit_type, stock_quantity, image_url, active')
        .eq('provider_id', user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + INVENTARIO_PAGE_SIZE - 1)
      if (error) throw error
      return (data ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price_unit),
        unit: p.unit_type,
        stock: p.stock_quantity,
        image_url: p.image_url,
        active: p.active,
      })) as ProductoInventario[]
    },
  })
}

export function useToggleProductoActivo() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const user_id = user?.user_id ?? ''

  return useMutation({
    mutationFn: async ({
      product_id,
      active,
    }: {
      product_id: string
      active: boolean
    }) => {
      const { error } = await supabase
        .from('products')
        .update({ active })
        .eq('id', product_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario', user_id] })
    },
  })
}
