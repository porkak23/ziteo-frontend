import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { getProductImageUrl } from '../../tienda/utils/productImages'

export const INVENTARIO_PAGE_SIZE = 15

// Canonical construction-material categories for Bolivian market.
// These map to categories seeded in the DB; the label is what we show in the UI.
export const CATEGORIAS_CONSTRUCCION = [
  'Cemento',
  'Arena y Grava',
  'Fierro y Acero',
  'Madera',
  'Ladrillos',
  'Pintura',
  'Herramientas',
  'Electricidad',
  'Plomería',
  'Otro',
] as const

export type CategoriaConstructora = (typeof CATEGORIAS_CONSTRUCCION)[number]

export interface ProductoInventario {
  id: string
  name: string
  price: number
  unit: string
  stock: number
  image_url: string | null
  active: boolean
  category_name?: string
}

// Validation helpers shared between the form and the hook
export function validateProductoForm(price: string, stock: string, listing_type?: string, rental_daily_rate?: string): string | null {
  const priceNum = parseFloat(price)
  const stockNum = parseInt(stock, 10)

  if (isNaN(priceNum) || priceNum <= 0) {
    return 'El precio debe ser mayor a cero'
  }
  if (isNaN(stockNum) || stockNum < 0) {
    return 'El stock no puede ser negativo'
  }
  if (listing_type === 'rent') {
    const dailyRateNum = parseFloat(rental_daily_rate || '0')
    if (isNaN(dailyRateNum) || dailyRateNum <= 0) {
      return 'La tarifa diaria es obligatoria y debe ser mayor a cero'
    }
  }
  return null
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
        .select('id, name, price_unit, unit_type, stock_quantity, image_url, active, category:categories(name)')
        .eq('provider_id', user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + INVENTARIO_PAGE_SIZE - 1)
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price_unit),
        unit: p.unit_type,
        stock: p.stock_quantity,
        image_url: getProductImageUrl(p.name, p.image_url),
        active: p.active,
        category_name: Array.isArray(p.category) ? p.category[0]?.name : p.category?.name,
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
      // When deactivating, verify there are no pending orders containing this product.
      if (!active) {
        const { data: pendingItems, error: checkError } = await supabase
          .from('order_items')
          .select('order_id, orders!inner(status)')
          .eq('product_id', product_id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .eq('orders.status' as any, 'pending')
          .limit(1)

        if (checkError) throw checkError

        if (pendingItems && pendingItems.length > 0) {
          throw new Error(
            'No se puede desactivar este producto: tiene pedidos pendientes. Espera a que se procesen o cancélalos primero.'
          )
        }
      }

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

// Upload a product image to the 'product-images' storage bucket.
// Returns the public URL (if bucket is public) or the storage path.
export async function uploadProductImage(
  file: File,
  productId: string,
  userId: string
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo debe ser una imagen (JPG, PNG, WEBP, etc.)')
  }
  const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_SIZE) {
    throw new Error('La imagen no debe superar los 5 MB')
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filePath = `${userId}/${productId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: publicUrl } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return publicUrl.publicUrl
}
