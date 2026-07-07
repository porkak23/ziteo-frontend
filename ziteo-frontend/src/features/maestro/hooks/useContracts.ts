import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export interface ContractCardData {
  id: string
  constructor_id: string
  maestro_id: string
  description: string | null
  budget: number | null
  city: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  created_at: string
  project_id: string | null
  constructor: { name: string; phone: string | null } | null
}

export function usePendingContracts(maestro_id: string) {
  return useQuery<ContractCardData[]>({
    queryKey: ['pending-contracts', maestro_id],
    enabled: !!maestro_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, constructor:profiles!contracts_constructor_id_fkey(name, phone)')
        .eq('maestro_id', maestro_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data ?? []) as ContractCardData[]
    },
  })
}

// Trae todos los contratos del maestro (pending + accepted + completed) para
// vistas que necesiten el historial completo, no solo los pendientes de revisar.
export function useMaestroContracts(maestroId: string) {
  return useQuery<ContractCardData[]>({
    queryKey: ['maestro-contracts', maestroId],
    enabled: !!maestroId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*, constructor:profiles!contracts_constructor_id_fkey(name, phone)')
        .eq('maestro_id', maestroId)
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

export function useCompleteContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (contract_id: string) => {
      const { error } = await supabase
        .from('contracts')
        .update({ status: 'completed' })
        .eq('id', contract_id)
      if (error) throw error

      const { data: contract } = await supabase
        .from('contracts')
        .select('constructor_id, description')
        .eq('id', contract_id)
        .single()

      return { contract }
    },
    onSuccess: async (res) => {
      queryClient.invalidateQueries({ queryKey: ['maestro-contracts'] })
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
      queryClient.invalidateQueries({ queryKey: ['maestro-current-contract'] })
      queryClient.invalidateQueries({ queryKey: ['pending-contracts'] })

      // Best-effort: notificar al constructor. Si falla, no debe romper el flujo principal
      // (mismo patrón que usePostularse en licitaciones/hooks/useLicitaciones.ts).
      if (res.contract?.constructor_id) {
        try {
          await supabase.rpc('send_notification', {
            p_user_id: res.contract.constructor_id,
            p_type: 'contract',
            p_title: 'Trabajo finalizado',
            p_message: 'El maestro marcó tu contrato como finalizado.',
          })
        } catch (err) {
          console.warn('[send_notification] contract completion notify failed:', err)
        }
      }
    },
  })
}
