import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export interface Maestro {
  user_id: string
  name: string
  city: string
  avatar_url: string | null
  specialties: string[]
  rate_type: string
  rate_amount: number
  available: boolean
  experience_years: number
}

interface ContractPayload {
  constructor_id: string
  maestro_id: string
  description: string
  budget: number
  city: string
}

export function useMaestros(search?: string) {
  return useQuery<Maestro[]>({
    queryKey: ['maestros', search],
    queryFn: async () => {
      // Filter by user_roles table (not active_role) so maestros with a different
      // active role are still discoverable.
      const { data: roleRows, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'maestro')
      if (roleError) throw roleError

      const maestroIds = (roleRows ?? []).map((r: { user_id: string }) => r.user_id)
      if (maestroIds.length === 0) return []

      let query = supabase
        .from('profiles')
        .select(`
          user_id,
          name,
          city,
          avatar_url,
          maestro_profiles!maestro_profiles_user_id_fkey (
            specialties,
            rate_type,
            rate_amount,
            available,
            experience_years
          )
        `)
        .in('user_id', maestroIds)

      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      const { data, error } = await query.limit(50)
      if (error) throw error

      type RawRow = {
        user_id: string; name: string; city: string; avatar_url: string | null
        maestro_profiles: { specialties: string[]; rate_type: string; rate_amount: number; available: boolean; experience_years: number }[] | null
      }
      return (data as RawRow[] ?? []).map((row) => ({
        user_id: row.user_id,
        name: row.name,
        city: row.city,
        avatar_url: row.avatar_url,
        specialties: row.maestro_profiles?.[0]?.specialties ?? [],
        rate_type: row.maestro_profiles?.[0]?.rate_type ?? 'per_day',
        rate_amount: row.maestro_profiles?.[0]?.rate_amount ?? 0,
        available: row.maestro_profiles?.[0]?.available ?? false,
        experience_years: row.maestro_profiles?.[0]?.experience_years ?? 0,
      }))
    },
  })
}

export function useContratarMaestro() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ContractPayload) => {
      const { error } = await supabase.from('contracts').insert({
        maestro_id: payload.maestro_id,
        constructor_id: payload.constructor_id,
        description: payload.description,
        budget: payload.budget ? Number(payload.budget) : null,
        city: payload.city,
        status: 'pending',
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contratos-constructor'] })
    },
  })
}
