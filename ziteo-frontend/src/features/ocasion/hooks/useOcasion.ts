import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { getProductImageUrl } from '../../tienda/utils/productImages'
import { validateProductoForm, uploadProductImage } from '../../proveedor/hooks/useInventario'

export interface ProductoOcasion {
  id: string
  name: string
  description: string | null
  price: number
  unit: string
  stock: number
  image_url: string | null
  active: boolean
  listing_type: 'sell' | 'rent' | null
  item_condition: 'nuevo' | 'usado' | null
  weight_kg: number | null
  rental_daily_rate: number | null
  rental_weekly_rate: number | null
  rental_deposit: number | null
  rental_min_days: number | null
  category_name?: string
}

export interface CrearPublicacionInput {
  name: string
  description?: string
  price: string
  unit: string
  stock: string
  category_id: string
  listing_type?: 'sell' | 'rent'
  item_condition?: 'nuevo' | 'usado'
  weight_kg?: string
  rental_daily_rate?: string
  rental_weekly_rate?: string
  rental_deposit?: string
  rental_min_days?: string
  imageFile?: File | null
}

export function useMisPublicaciones() {
  const user = useAuthStore((s) => s.user)
  const user_id = user?.user_id ?? ''

  return useQuery<ProductoOcasion[]>({
    queryKey: ['inventario-ocasion', user_id],
    enabled: !!user_id,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('products') as any)
        .select(
          'id, name, description, price_unit, unit_type, stock_quantity, image_url, active, listing_type, item_condition, weight_kg, rental_daily_rate, rental_weekly_rate, rental_deposit, rental_min_days, category:categories(name)'
        )
        .eq('provider_id', user_id)
        .eq('seller_type', 'occasional')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        price: Number(p.price_unit),
        unit: p.unit_type,
        stock: p.stock_quantity,
        image_url: getProductImageUrl(p.name, p.image_url),
        active: p.active,
        listing_type: p.listing_type ?? null,
        item_condition: p.item_condition ?? null,
        weight_kg: p.weight_kg != null ? Number(p.weight_kg) : null,
        rental_daily_rate: p.rental_daily_rate != null ? Number(p.rental_daily_rate) : null,
        rental_weekly_rate: p.rental_weekly_rate != null ? Number(p.rental_weekly_rate) : null,
        rental_deposit: p.rental_deposit != null ? Number(p.rental_deposit) : null,
        rental_min_days: p.rental_min_days != null ? Number(p.rental_min_days) : null,
        category_name: Array.isArray(p.category) ? p.category[0]?.name : p.category?.name,
      })) as ProductoOcasion[]
    },
  })
}

export function useCrearPublicacion() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const user_id = user?.user_id ?? ''

  return useMutation({
    mutationFn: async (form: CrearPublicacionInput) => {
      if (!user) throw new Error('Usuario no autenticado')

      // Client-side validation
      const validationError = validateProductoForm(
        form.price,
        form.stock,
        form.listing_type,
        form.rental_daily_rate
      )
      if (validationError) {
        throw new Error(validationError)
      }
      if (!form.name.trim()) {
        throw new Error('El nombre del producto es obligatorio')
      }
      if (form.listing_type === 'rent') {
        if (!form.rental_daily_rate || parseFloat(form.rental_daily_rate) <= 0) {
          throw new Error('La tarifa diaria es obligatoria y debe ser mayor a 0 para alquiler')
        }
      }
      if (!form.category_id) {
        throw new Error('Selecciona una categoría')
      }

      // Insert product
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedRows, error } = await (supabase as any).from('products').insert({
        name: form.name.trim(),
        description: form.description?.trim() || null,
        price_unit: parseFloat(form.price),
        unit_type: form.unit,
        stock_quantity: parseInt(form.stock, 10),
        category_id: form.category_id,
        provider_id: user.user_id,
        seller_type: 'occasional',
        image_url: null, // filled below if an image was selected
        listing_type: form.listing_type ?? 'sell',
        item_condition: form.item_condition ?? null,
        active: true,
        is_deleted: false,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        rental_daily_rate: form.listing_type === 'rent' && form.rental_daily_rate ? parseFloat(form.rental_daily_rate) : null,
        rental_weekly_rate: form.listing_type === 'rent' && form.rental_weekly_rate ? parseFloat(form.rental_weekly_rate) : null,
        rental_deposit: form.listing_type === 'rent' && form.rental_deposit ? parseFloat(form.rental_deposit) : null,
        rental_min_days: form.listing_type === 'rent' && form.rental_min_days ? parseInt(form.rental_min_days, 10) : 1,
      }).select('id')

      if (error) throw error

      const newProductId = insertedRows?.[0]?.id ?? ''

      // Upload image if provided — non-fatal: product was saved, image upload failed
      if (form.imageFile && newProductId) {
        try {
          const imageUrl = await uploadProductImage(form.imageFile, newProductId, user.user_id)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('products') as any).update({ image_url: imageUrl }).eq('id', newProductId)
        } catch {
          // Product saved; image upload failed — acceptable
        }
      }

      return newProductId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-ocasion', user_id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useTogglePublicacion() {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: pendingItems, error: checkError } = await (supabase.from('order_items') as any)
          .select('order_id, orders!inner(status)')
          .eq('product_id', product_id)
          .eq('orders.status', 'pending')
          .limit(1)

        if (checkError) throw checkError

        if (pendingItems && pendingItems.length > 0) {
          throw new Error(
            'No se puede desactivar esta publicación: tiene pedidos pendientes. Espera a que se procesen o cancélalos primero.'
          )
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('products') as any)
        .update({ active })
        .eq('id', product_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-ocasion', user_id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useEliminarPublicacion() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const user_id = user?.user_id ?? ''

  return useMutation({
    mutationFn: async (product_id: string) => {
      // Check pending orders when deleting a product to prevent issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pendingItems, error: checkError } = await (supabase.from('order_items') as any)
        .select('order_id, orders!inner(status)')
        .eq('product_id', product_id)
        .eq('orders.status', 'pending')
        .limit(1)

      if (checkError) throw checkError

      if (pendingItems && pendingItems.length > 0) {
        throw new Error(
          'No se puede eliminar esta publicación: tiene pedidos pendientes. Espera a que se procesen o cancélalos primero.'
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('products') as any)
        .update({ is_deleted: true })
        .eq('id', product_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventario-ocasion', user_id] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
