import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export interface Habilidad {
  id: string
  maestro_id: string
  skill: string
  porcentaje: number
}

export const SKILLS_DISPONIBLES = [
  'Albañilería',
  'Electricidad',
  'Plomería',
  'Carpintería',
  'Pintura',
  'Gasfitería',
  'Soldadura',
  'Yesería',
  'Techado',
  'Cerámica',
  'Fierrería',
  'Movimiento de tierra',
  'Acabados finos',
  'Instalaciones sanitarias',
  'Instalaciones eléctricas',
]

export function useHabilidades(maestroId: string) {
  return useQuery<Habilidad[]>({
    queryKey: ['habilidades', maestroId],
    enabled: !!maestroId,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maestro_habilidades')
        .select('*')
        .eq('maestro_id', maestroId)
        .order('porcentaje', { ascending: false })
      if (error) throw error
      return (data ?? []) as Habilidad[]
    },
  })
}

export function useUpsertHabilidad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ maestro_id, skill, porcentaje }: { maestro_id: string; skill: string; porcentaje: number }) => {
      // 1. Guardar en maestro_habilidades
      const { error } = await supabase
        .from('maestro_habilidades')
        .upsert({ maestro_id, skill, porcentaje }, { onConflict: 'maestro_id,skill' })
      if (error) throw error

      // 2. Obtener lista completa de habilidades actualizadas
      const { data } = await supabase
        .from('maestro_habilidades')
        .select('skill')
        .eq('maestro_id', maestro_id)

      const skills = (data ?? []).map(r => r.skill)

      // 3. Sincronizar en maestro_profiles
      const { error: profileError } = await supabase
        .from('maestro_profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ user_id: maestro_id, specialties: skills } as any, { onConflict: 'user_id' })
      if (profileError) throw profileError

      // 4. Sincronizar en user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: maestro_id, role: 'maestro', specialty: skills.join(', ') }, { onConflict: 'user_id,role' })
      if (roleError) throw roleError
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['habilidades', vars.maestro_id] })
      queryClient.invalidateQueries({ queryKey: ['maestroProfile', vars.maestro_id] })
    },
  })
}

export function useDeleteHabilidad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, maestro_id }: { id: string; maestro_id: string }) => {
      // 1. Eliminar de maestro_habilidades
      const { error } = await supabase.from('maestro_habilidades').delete().eq('id', id)
      if (error) throw error

      // 2. Obtener lista restante de habilidades
      const { data } = await supabase
        .from('maestro_habilidades')
        .select('skill')
        .eq('maestro_id', maestro_id)

      const skills = (data ?? []).map(r => r.skill)

      // 3. Sincronizar en maestro_profiles
      const { error: profileError } = await supabase
        .from('maestro_profiles')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert({ user_id: maestro_id, specialties: skills } as any, { onConflict: 'user_id' })
      if (profileError) throw profileError

      // 4. Sincronizar en user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({ user_id: maestro_id, role: 'maestro', specialty: skills.join(', ') }, { onConflict: 'user_id,role' })
      if (roleError) throw roleError
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['habilidades', vars.maestro_id] })
      queryClient.invalidateQueries({ queryKey: ['maestroProfile', vars.maestro_id] })
    },
  })
}
