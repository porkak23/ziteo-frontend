import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export interface MaestroProfile {
  user_id: string
  name: string
  city: string
  avatar_url: string | null
  bio: string | null
  specialty: string | null
  years_experience: number | null
  hourly_rate: number | null
  is_available: boolean
  is_verified: boolean
}

export function useMaestroProfile(maestroId: string) {
  return useQuery<MaestroProfile>({
    queryKey: ['maestroProfile', maestroId],
    enabled: !!maestroId,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`*, user_roles!inner(*)`)
        .eq('user_id', maestroId)
        .eq('user_roles.role', 'maestro')
        .single()

      if (error) throw error

      const role = Array.isArray(data.user_roles) ? data.user_roles[0] : data.user_roles

      return {
        user_id: data.user_id,
        name: data.name,
        city: data.city ?? '',
        avatar_url: data.avatar_url ?? null,
        bio: data.bio ?? null,
        specialty: role?.specialty ?? null,
        years_experience: role?.years_experience ?? null,
        hourly_rate: role?.hourly_rate ?? null,
        is_available: role?.is_available ?? false,
        is_verified: role?.is_verified ?? false,
      } satisfies MaestroProfile
    },
  })
}

export interface UpdateMaestroProfileVars {
  maestroId: string
  bio?: string
  specialty?: string
  years_experience?: number | null
  hourly_rate?: number | null
  is_available?: boolean
}

export function useUpdateMaestroProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ maestroId, bio, specialty, years_experience, hourly_rate, is_available }: UpdateMaestroProfileVars) => {
      if (bio !== undefined) {
        const { error } = await supabase
          .from('profiles')
          .update({ bio })
          .eq('user_id', maestroId)
        if (error) throw error
      }

      const roleUpdate: Record<string, unknown> = {}
      if (specialty !== undefined) roleUpdate.specialty = specialty
      if (years_experience !== undefined) roleUpdate.years_experience = years_experience
      if (hourly_rate !== undefined) roleUpdate.hourly_rate = hourly_rate
      if (is_available !== undefined) roleUpdate.is_available = is_available

      if (Object.keys(roleUpdate).length > 0) {
        const { error } = await supabase
          .from('user_roles')
          .update(roleUpdate)
          .eq('user_id', maestroId)
          .eq('role', 'maestro')
        if (error) throw error
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['maestroProfile', vars.maestroId] })
    },
  })
}
