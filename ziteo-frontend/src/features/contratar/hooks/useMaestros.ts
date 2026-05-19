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

// Canonical specialties for the Bolivian construction market.
// Keep in sync with the specialties stored in maestro_profiles.specialties[].
export const ESPECIALIDADES_MAESTRO = [
  'Albañilería',
  'Electricidad',
  'Plomería',
  'Carpintería',
  'Pintura',
  'Instalaciones',
  'Otro',
] as const

export type EspecialidadMaestro = (typeof ESPECIALIDADES_MAESTRO)[number]

// Returns true if a maestro profile has enough data to be shown normally.
export function isMaestroProfileCompleto(m: Maestro): boolean {
  return m.rate_amount > 0 && m.specialties.length > 0
}

interface ContractPayload {
  constructor_id: string
  maestro_id: string
  description: string
  budget: number
  city: string
}

export interface MaestroFilters {
  // '' means "all cities"
  city: string
  // '' means "all specialties"
  specialty: string
  // true = only available maestros (default)
  onlyAvailable: boolean
  // free-text name search
  search: string
}

export const DEFAULT_MAESTRO_FILTERS: MaestroFilters = {
  city: '',
  specialty: '',
  onlyAvailable: true,
  search: '',
}

/**
 * useMaestros — queries the `maestros_view` (single JOIN, no N+1) and applies
 * city, specialty, availability, and name-search filters.
 *
 * The view is defined in supabase/migrations/20260519_maestros_search.sql.
 */
export function useMaestros(filters: MaestroFilters) {
  return useQuery<Maestro[]>({
    queryKey: ['maestros', filters],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any)
        .from('maestros_view')
        .select('user_id, name, city, avatar_url, specialties, rate_type, rate_amount, available, experience_years')

      // City filter — pre-filter server-side when a specific city is selected
      if (filters.city) {
        query = query.eq('city', filters.city)
      }

      // Availability filter — on by default
      if (filters.onlyAvailable) {
        query = query.eq('available', true)
      }

      // Name search — server-side ilike
      if (filters.search.trim()) {
        query = query.ilike('name', `%${filters.search.trim()}%`)
      }

      const { data, error } = await query.limit(60).order('name')

      if (error) {
        // If the view doesn't exist yet (migration not applied), fall back to
        // the two-query approach so the app doesn't break during deploy.
        if (error.code === '42P01') {
          return fallbackTwoQueryMaestros(filters)
        }
        throw error
      }

      const rows = (data ?? []) as Maestro[]

      // Specialty filter — applied client-side because specialties is a JSONB array
      // and a server-side `@>` operator would require knowing the exact JSON shape.
      if (filters.specialty) {
        return rows.filter((m) =>
          Array.isArray(m.specialties) && m.specialties.includes(filters.specialty)
        )
      }

      return rows
    },
  })
}

/**
 * Fallback: the two-query strategy used before the view existed.
 * Only called when the maestros_view migration has not been applied yet.
 */
async function fallbackTwoQueryMaestros(filters: MaestroFilters): Promise<Maestro[]> {
  const { data: roleRows, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'maestro')
  if (roleError) throw roleError

  const maestroIds = (roleRows ?? []).map((r: { user_id: string }) => r.user_id)
  if (maestroIds.length === 0) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let profileQuery = (supabase as any)
    .from('profiles')
    .select(`
      user_id, name, city, avatar_url,
      maestro_profiles!maestro_profiles_user_id_fkey(
        specialties, rate_type, rate_amount, available, experience_years
      )
    `)
    .in('user_id', maestroIds)

  if (filters.city) profileQuery = profileQuery.eq('city', filters.city)
  if (filters.search.trim()) profileQuery = profileQuery.ilike('name', `%${filters.search.trim()}%`)

  const { data, error } = await profileQuery.limit(60)
  if (error) throw error

  type RawRow = {
    user_id: string; name: string; city: string; avatar_url: string | null
    maestro_profiles: { specialties: string[]; rate_type: string; rate_amount: number; available: boolean; experience_years: number }[] | null
  }

  let rows = (data as RawRow[] ?? []).map((row) => ({
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

  if (filters.onlyAvailable) rows = rows.filter((m) => m.available)
  if (filters.specialty) rows = rows.filter((m) => Array.isArray(m.specialties) && m.specialties.includes(filters.specialty))

  return rows
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
