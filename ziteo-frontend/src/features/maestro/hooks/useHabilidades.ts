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
      const { error } = await supabase
        .from('maestro_habilidades')
        .upsert({ maestro_id, skill, porcentaje }, { onConflict: 'maestro_id,skill' })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['habilidades', vars.maestro_id] })
    },
  })
}

export function useDeleteHabilidad() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; maestro_id: string }) => {
      const { error } = await supabase.from('maestro_habilidades').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['habilidades', vars.maestro_id] })
    },
  })
}
