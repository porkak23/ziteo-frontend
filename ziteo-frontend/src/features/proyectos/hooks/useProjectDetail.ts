import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import type { ProjectCard, ProjectStatus } from '../types/proyectosTypes'

interface SupabaseProjectRow {
  id: string
  name: string
  description: string | null
  status: string
  location_address: string | null
  estimated_budget: number | null
  photo_url: string | null
  start_date: string | null
  needs_maestro: boolean
  needs_materials: boolean
  constructor_id: string
  city: string | null
  location_lat: number | null
  location_lng: number | null
  created_at: string
  constructor: { name: string } | null
  applications: { count: number }[]
}

interface ApplyPayload {
  project_id: string
  applicant_id: string
  role: 'maestro' | 'proveedor'
  message: string
}

export function useProjectDetail(projectId: string) {
  return useQuery<ProjectCard | null>({
    queryKey: ['proyecto', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(
          '*, constructor:profiles!projects_constructor_id_fkey(name), applications:project_applications(count)'
        )
        .eq('id', projectId)
        .single()

      if (error) throw error
      if (!data) return null

      const row = data as SupabaseProjectRow

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        status: row.status as ProjectStatus,
        location_address: row.location_address,
        estimated_budget: row.estimated_budget,
        photo_url: row.photo_url,
        start_date: row.start_date,
        needs_maestro: row.needs_maestro,
        needs_materials: row.needs_materials,
        constructor_id: row.constructor_id,
        city: row.city,
        location_lat: row.location_lat ?? null,
        location_lng: row.location_lng ?? null,
        created_at: row.created_at,
        constructor_name: row.constructor?.name ?? '',
        application_count: row.applications?.[0]?.count ?? 0,
      }
    },
  })
}

export function useApplyToProject(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ApplyPayload) => {
      const { data, error } = await supabase
        .from('project_applications')
        .insert(payload)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('Ya postulaste a este proyecto')
        }
        throw error
      }

      const { data: project } = await supabase
        .from('projects')
        .select('constructor_id, name')
        .eq('id', payload.project_id)
        .single()

      return { data, project }
    },
    onSuccess: async (res) => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
      queryClient.invalidateQueries({ queryKey: ['proyecto', projectId] })

      if (res.project?.constructor_id) {
        await supabase.from('notifications').insert({
          user_id: res.project.constructor_id,
          type: 'project',
          title: 'Nueva postulación',
          message: `Alguien ha postulado a tu proyecto "${res.project.name}".`,
        })
      }
    },
  })
}
