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
    retry: 1,
    queryFn: async () => {
      // Ensure session is fresh before querying — access tokens expire in 1h
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        await supabase.auth.refreshSession()
      }

      // Two independent queries so a missing user_roles row doesn't kill the fetch
      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', maestroId).maybeSingle(),
        supabase.from('user_roles').select('*').eq('user_id', maestroId).eq('role', 'maestro').maybeSingle(),
      ])

      if (profileRes.error) throw profileRes.error
      if (!profileRes.data) throw new Error('PROFILE_NOT_FOUND')

      const profile = profileRes.data
      const role = roleRes.data ?? null

      return {
        user_id: profile.user_id,
        name: profile.name ?? '',
        city: profile.city ?? '',
        avatar_url: profile.avatar_url ?? null,
        bio: profile.bio ?? null,
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
        // Upsert so the row is created if it didn't exist yet
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: maestroId, role: 'maestro', ...roleUpdate }, { onConflict: 'user_id,role' })
        if (error) throw error
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['maestroProfile', vars.maestroId] })
    },
  })
}

export function useBootstrapMaestroRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (maestroId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: maestroId, role: 'maestro', is_available: false }, { onConflict: 'user_id,role' })
      if (error) throw error
    },
    onSuccess: (_, maestroId) => {
      queryClient.invalidateQueries({ queryKey: ['maestroProfile', maestroId] })
    },
  })
}
