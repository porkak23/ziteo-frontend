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
  payment_qr_url: string | null
  payment_cash: boolean
  payment_bank_transfer: string | null
}

export function useMaestroProfile(maestroId: string, isOwn: boolean = false) {
  return useQuery<MaestroProfile>({
    queryKey: ['maestroProfile', maestroId],
    enabled: !!maestroId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Ensure session is fresh before querying — access tokens expire in 1h
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        await supabase.auth.refreshSession()
      }

      // El dueño lee user_roles directo (necesita todas sus columnas para
      // editar); un tercero lee la vista pública, que ya no expone toda la
      // fila (ver 20260802000003_public_role_profiles_view.sql).
      const roleQuery = isOwn
        ? supabase.from('user_roles').select('*').eq('user_id', maestroId).eq('role', 'maestro').maybeSingle()
        : supabase.from('public_role_profiles').select('*').eq('user_id', maestroId).eq('role', 'maestro').maybeSingle()

      // Two independent queries so a missing user_roles row doesn't kill the fetch
      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('user_id, name, city, avatar_url, bio').eq('user_id', maestroId).maybeSingle(),
        roleQuery,
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
        bio: profile.bio ?? null,
        specialty: role?.specialty ?? null,
        years_experience: role?.years_experience ?? null,
        hourly_rate: role?.hourly_rate ?? null,
        is_available: role?.is_available ?? false,
        is_verified: role?.is_verified ?? false,
        payment_qr_url: role?.payment_qr_url ?? null,
        payment_cash: role?.payment_cash ?? false,
        payment_bank_transfer: role?.payment_bank_transfer ?? null,
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
  payment_qr_url?: string | null
  payment_cash?: boolean
  payment_bank_transfer?: string | null
}

export function useUpdateMaestroProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ maestroId, bio, specialty, years_experience, hourly_rate, is_available, payment_qr_url, payment_cash, payment_bank_transfer }: UpdateMaestroProfileVars) => {
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
      if (payment_qr_url !== undefined) roleUpdate.payment_qr_url = payment_qr_url
      if (payment_cash !== undefined) roleUpdate.payment_cash = payment_cash
      if (payment_bank_transfer !== undefined) roleUpdate.payment_bank_transfer = payment_bank_transfer

      if (Object.keys(roleUpdate).length > 0) {
        // Upsert so the row is created if it didn't exist yet
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: maestroId, role: 'maestro', ...roleUpdate }, { onConflict: 'user_id,role' })
        if (error) throw error
      }

      // Sincronizar automáticamente con la tabla maestro_profiles para búsquedas del comprador
      const mProfileUpdate: Record<string, unknown> = {}
      if (specialty !== undefined) {
        mProfileUpdate.specialties = specialty.split(', ').map(s => s.trim()).filter(Boolean)
      }
      if (years_experience !== undefined) mProfileUpdate.experience_years = years_experience
      if (hourly_rate !== undefined) mProfileUpdate.rate_amount = hourly_rate ?? 0
      if (is_available !== undefined) mProfileUpdate.available = is_available

      if (Object.keys(mProfileUpdate).length > 0) {
        const { error } = await supabase
          .from('maestro_profiles')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .upsert({ user_id: maestroId, ...mProfileUpdate } as any, { onConflict: 'user_id' })
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
