import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface QuotationItem {
  product_id: string
  name: string
  quantity: number
  price_unit: number
  weight_kg?: number
}

export interface QuotationWithProvider {
  id: string
  buyer_id: string
  provider_id: string
  items: QuotationItem[]
  subtotal: number
  pdf_url: string | null
  expires_at: string
  status: 'pending' | 'accepted' | 'expired' | 'converted'
  created_at: string
  provider_name: string | null
  store_name: string | null
}

export interface GenerateQuotationParams {
  provider_id: string
  items: QuotationItem[]
  subtotal: number
}

// ─── useGenerateQuotation ─────────────────────────────────────────────────────
// Generates one quotation record per provider via the generate_quotation RPC.

export function useGenerateQuotation() {
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (params: GenerateQuotationParams) => {
      if (!currentUser?.user_id) throw new Error('Usuario no autenticado')

      const { data: quotationId, error } = await supabase.rpc('generate_quotation', {
        p_buyer_id:        currentUser.user_id,
        p_provider_id:     params.provider_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p_items:           params.items as any,
        p_subtotal:        params.subtotal,
        p_expires_in_days: 7,
      })

      if (error) throw new Error(error.message)

      return quotationId as string
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

// ─── useMyQuotations ──────────────────────────────────────────────────────────

export function useMyQuotations() {
  const currentUser = useAuthStore((s) => s.user)
  const uid = currentUser?.user_id ?? null

  return useQuery<QuotationWithProvider[]>({
    queryKey: ['quotations', uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select('*, profiles!provider_id(name, user_roles(store_name))')
        .eq('buyer_id', uid!)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw new Error(error.message)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((q: any) => {
        const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles
        const roles   = profile?.user_roles ?? []
        const role    = Array.isArray(roles) ? roles[0] : roles

        return {
          id:           q.id,
          buyer_id:     q.buyer_id,
          provider_id:  q.provider_id,
          items:        (q.items ?? []) as QuotationItem[],
          subtotal:     q.subtotal,
          pdf_url:      q.pdf_url ?? null,
          expires_at:   q.expires_at,
          status:       q.status as QuotationWithProvider['status'],
          created_at:   q.created_at,
          provider_name: profile?.name ?? null,
          store_name:    role?.store_name ?? null,
        } satisfies QuotationWithProvider
      })
    },
  })
}
