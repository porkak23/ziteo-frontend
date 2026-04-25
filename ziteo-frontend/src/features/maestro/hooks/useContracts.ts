import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export interface ContractCardData {
  id: string
  constructor_id: string
  maestro_id: string
  description: string | null
  budget: number | null
  city: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  constructor: { name: string } | null
}

export function usePendingContracts(maestro_id: string) {
  return useQuery<ContractCardData[]>({
    queryKey: ['pending-contracts', maestro_id],
    enabled: !!maestro_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, constructor:profiles!contracts_constructor_id_fkey(name)')
        .eq('maestro_id', maestro_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data ?? []) as ContractCardData[]
    },
  })
}

export function useAcceptContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contract_id: string) => {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'accepted' })
        .eq('id', contract_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-contracts'] })
    },
  })
}

export function useRejectContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contract_id: string) => {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'rejected' })
        .eq('id', contract_id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-contracts'] })
    },
  })
}
