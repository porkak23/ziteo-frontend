import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'

export interface ProjectCard {
  id: string
  name: string
  description: string | null
  status: string
  location_address: string | null
  estimated_budget: number | null
  needs_maestro: boolean
  needs_materials: boolean
  constructor_id: string
  created_at: string
  constructor: { name: string } | null
}

export function useTrabajos(filters?: { location?: string }) {
  const user = useAuthStore((s) => s.user)
  const user_id = user?.user_id ?? ''
  const active_role = user?.active_role

  return useQuery<ProjectCard[]>({
    queryKey: ['proyectos-necesitan-maestro', user_id, filters],
    enabled: !!user_id && active_role === 'maestro',
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*, constructor:profiles!projects_constructor_id_fkey(name)')
        .eq('needs_maestro', true)
        .order('created_at', { ascending: false })

      if (filters?.location) {
        query = query.ilike('location_address', `%${filters.location}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as ProjectCard[]
    },
  })
}

export function usePostularseAProyecto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      project_id,
      applicant_id,
    }: {
      project_id: string
      applicant_id: string
    }) => {
      const { error } = await supabase
        .from('project_applications')
        .insert({ project_id, applicant_id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos-necesitan-maestro'] })
    },
  })
}
