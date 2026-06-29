import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export interface VendedorProfileData {
  user_id: string
  name: string
  city: string
  avatar_url: string | null
  store_name: string | null
  company_name: string | null
  store_logo_url: string | null
  store_description: string | null
  min_order_amount: number | null
  payment_cash: boolean | null
  payment_bank_transfer: string | null
  payment_qr_url: string | null
  is_available: boolean | null
  is_verified: boolean | null
}

export function useVendedorProfile(vendedorId: string) {
  return useQuery<VendedorProfileData>({
    queryKey: ['vendedorProfile', vendedorId],
    enabled: !!vendedorId,
    retry: 1,
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        await supabase.auth.refreshSession()
      }

      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('user_id, name, city, avatar_url').eq('user_id', vendedorId).maybeSingle(),
        supabase.from('user_roles').select('*').eq('user_id', vendedorId).eq('role', 'proveedor').maybeSingle(),
      ])

      if (profileRes.error) throw profileRes.error
      if (!profileRes.data) throw new Error('PROFILE_NOT_FOUND')

      const profile = profileRes.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = (roleRes.data ?? null) as any

      return {
        user_id: profile.user_id,
        name: profile.name ?? '',
        city: profile.city ?? '',
        avatar_url: profile.avatar_url ?? null,
        store_name: role?.store_name ?? null,
        company_name: role?.company_name ?? null,
        store_logo_url: role?.store_logo_url ?? null,
        store_description: role?.store_description ?? null,
        min_order_amount: role?.min_order_amount ?? null,
        payment_cash: role?.payment_cash ?? null,
        payment_bank_transfer: role?.payment_bank_transfer ?? null,
        payment_qr_url: role?.payment_qr_url ?? null,
        is_available: role?.is_available ?? null,
        is_verified: role?.is_verified ?? null,
      } satisfies VendedorProfileData
    },
  })
}

export interface UpdateVendedorVars {
  vendedorId: string
  store_name?: string | null
  company_name?: string | null
  store_logo_url?: string | null
  store_description?: string | null
  min_order_amount?: number | null
  payment_cash?: boolean
  payment_bank_transfer?: string | null
  payment_qr_url?: string | null
  is_available?: boolean
}

export function useUpdateVendedorProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ vendedorId, ...fields }: UpdateVendedorVars) => {
      const roleUpdate: Record<string, unknown> = {}
      if (fields.store_name !== undefined) roleUpdate.store_name = fields.store_name
      if (fields.company_name !== undefined) roleUpdate.company_name = fields.company_name
      if (fields.store_logo_url !== undefined) roleUpdate.store_logo_url = fields.store_logo_url
      if (fields.store_description !== undefined) roleUpdate.store_description = fields.store_description
      if (fields.min_order_amount !== undefined) roleUpdate.min_order_amount = fields.min_order_amount
      if (fields.payment_cash !== undefined) roleUpdate.payment_cash = fields.payment_cash
      if (fields.payment_bank_transfer !== undefined) roleUpdate.payment_bank_transfer = fields.payment_bank_transfer
      if (fields.payment_qr_url !== undefined) roleUpdate.payment_qr_url = fields.payment_qr_url
      if (fields.is_available !== undefined) roleUpdate.is_available = fields.is_available

      if (Object.keys(roleUpdate).length > 0) {
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: vendedorId, role: 'proveedor', ...roleUpdate }, { onConflict: 'user_id,role' })
        if (error) throw error
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['vendedorProfile', vars.vendedorId] })
    },
  })
}

export function useBootstrapVendedorRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vendedorId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: vendedorId, role: 'proveedor', is_available: false }, { onConflict: 'user_id,role' })
      if (error) throw error
    },
    onSuccess: (_, vendedorId) => {
      queryClient.invalidateQueries({ queryKey: ['vendedorProfile', vendedorId] })
    },
  })
}
