import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import type { ProjectCard, ProjectStatus, Project } from '../types/proyectosTypes'

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

export function useProyectos(filters?: { status?: string; constructor_id?: string; city?: string }) {
  const user = useAuthStore((s) => s.user)
  const user_id = user?.user_id ?? null
  const active_role = user?.active_role ?? null

  const _status = filters?.status
  const _constructor_id = filters?.constructor_id

  return useQuery<ProjectCard[]>({
    queryKey: ['proyectos', user_id, active_role, _status, _constructor_id],
    enabled: !!user_id,
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('id, name, description, status, location_address, estimated_budget, photo_url, start_date, needs_maestro, needs_materials, constructor_id, city, location_lat, location_lng, created_at, constructor:profiles!projects_constructor_id_fkey(name), applications:project_applications(count)')

      if (active_role === 'maestro') {
        query = query.eq('needs_maestro', true).in('status', ['active', 'planning'])
      } else if (active_role === 'proveedor') {
        query = query.eq('needs_materials', true).in('status', ['active', 'planning'])
      }

      if (_constructor_id) {
        query = query.eq('constructor_id', _constructor_id)
      }

      if (_status && _status !== 'todos') {
        query = query.eq('status', _status)
      }

      if (filters?.city) {
        query = query.eq('city', filters.city)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50)
      if (error) throw error

      return (data as unknown as SupabaseProjectRow[]).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status as ProjectStatus,
        location_address: p.location_address,
        estimated_budget: p.estimated_budget,
        photo_url: p.photo_url,
        start_date: p.start_date,
        needs_maestro: p.needs_maestro,
        needs_materials: p.needs_materials,
        constructor_id: p.constructor_id,
        city: p.city ?? null,
        location_lat: p.location_lat ?? null,
        location_lng: p.location_lng ?? null,
        created_at: p.created_at,
        constructor_name: p.constructor?.name ?? '',
        application_count: p.applications?.[0]?.count ?? 0,
      }))
    },
  })
}

export function useCreateProyecto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: Omit<Project, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          constructor_id: payload.constructor_id,
          name: payload.name,
          description: payload.description,
          location_address: payload.location_address,
          estimated_budget: payload.estimated_budget,
          status: payload.status,
          photo_url: payload.photo_url,
          start_date: payload.start_date,
          needs_maestro: payload.needs_maestro,
          needs_materials: payload.needs_materials,
          city: payload.city ?? null,
          location_lat: payload.location_lat ?? null,
          location_lng: payload.location_lng ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proyectos'] })
    },
  })
}
