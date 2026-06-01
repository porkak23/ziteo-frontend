import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { queryKeys } from '../../../shared/query/keys'

export interface Licitacion {
  id: string
  constructor_id: string
  title: string
  description: string | null
  specialty: string | null
  city: string | null
  budget_min: number | null
  budget_max: number | null
  status: string
  created_at: string
  constructor: { name: string; avatar_url: string | null } | null
  _postulaciones_count?: number
  _ya_postulado?: boolean
}

export interface LicitacionPostulacion {
  id: string
  licitacion_id: string
  maestro_id: string
  message: string | null
  proposed_budget: number | null
  status: string
  created_at: string
  maestro: { name: string; avatar_url: string | null } | null
}

export interface CreateLicitacionPayload {
  title: string
  description?: string
  specialty?: string
  city?: string
  budget_min?: number
  budget_max?: number
}

// Maestro: ver licitaciones abiertas
export function useLicitacionesAbiertas(filters?: { city?: string; specialty?: string }) {
  const user = useAuthStore((s) => s.user)
  return useQuery<Licitacion[]>({
    queryKey: queryKeys.licitacionesAbiertas(filters),
    enabled: !!user?.user_id,
    queryFn: async () => {
      let q = supabase
        .from('licitaciones')
        .select('*, constructor:profiles!licitaciones_constructor_id_fkey(name, avatar_url)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
      if (filters?.city) q = q.eq('city', filters.city)
      if (filters?.specialty) q = q.eq('specialty', filters.specialty)
      const { data, error } = await q.limit(50)
      if (error) throw error
      // Verificar cuáles ya postulé
      if (!data?.length) return []
      const { data: mis } = await supabase
        .from('licitacion_postulaciones')
        .select('licitacion_id')
        .eq('maestro_id', user!.user_id)
      const yaPostulados = new Set((mis ?? []).map((r: { licitacion_id: string }) => r.licitacion_id))
      return (data as Licitacion[]).map(l => ({ ...l, _ya_postulado: yaPostulados.has(l.id) }))
    },
    staleTime: 30_000,
  })
}

// Constructor: ver sus propias licitaciones
export function useMisLicitaciones() {
  const user = useAuthStore((s) => s.user)
  return useQuery<Licitacion[]>({
    queryKey: queryKeys.misLicitaciones(user?.user_id),
    enabled: !!user?.user_id && user.active_role === 'constructor',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licitaciones')
        .select('*, constructor:profiles!licitaciones_constructor_id_fkey(name, avatar_url)')
        .eq('constructor_id', user!.user_id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as Licitacion[]
    },
    staleTime: 30_000,
  })
}

// Constructor: ver postulantes de una licitación
export function usePostulantesDeLicitacion(licitacionId: string) {
  return useQuery<LicitacionPostulacion[]>({
    queryKey: queryKeys.postulantesDeLicitacion(licitacionId),
    enabled: !!licitacionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('licitacion_postulaciones')
        .select('*, maestro:profiles!licitacion_postulaciones_maestro_id_fkey(name, avatar_url)')
        .eq('licitacion_id', licitacionId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return (data ?? []) as LicitacionPostulacion[]
    },
  })
}

// Constructor: crear licitación
export function useCrearLicitacion() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: async (payload: CreateLicitacionPayload) => {
      const { error } = await supabase
        .from('licitaciones')
        .insert({ ...payload, constructor_id: user!.user_id, status: 'open' })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-licitaciones'] })
    },
  })
}

// Constructor: cerrar licitación
export function useCerrarLicitacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('licitaciones').update({ status: 'closed' }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-licitaciones'] })
    },
  })
}

// Maestro: postularse
export function usePostularse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { licitacion_id: string; maestro_id: string; message?: string; proposed_budget?: number }) => {
      const { error } = await supabase.from('licitacion_postulaciones').insert(payload)
      if (error) throw error

      const { data: licitacion } = await supabase
        .from('licitaciones')
        .select('constructor_id, title')
        .eq('id', payload.licitacion_id)
        .single()

      return { licitacion }
    },
    onSuccess: async (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.licitacionesAbiertas() })

      if (res.licitacion?.constructor_id) {
        const notifTitle = 'Nueva postulacion'
        const notifBody  = `Un maestro ha postulado a tu licitacion "${res.licitacion.title}".`
        await supabase.rpc('send_notification', {
          p_user_id: res.licitacion.constructor_id,
          p_type:    'contract',
          p_title:   notifTitle,
          p_message: notifBody,
        })
        // Also deliver as Web Push if the constructor has an active subscription
        supabase.functions.invoke('notifications/send-push', {
          body: {
            user_id: res.licitacion.constructor_id,
            title:   notifTitle,
            body:    notifBody,
            url:     '/',
          },
        }).catch((err: unknown) => console.warn('[send-push] licitacion push failed:', err))
      }
    },
  })
}

// Constructor: actualizar estado de postulación
export function useActualizarPostulacion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'rejected' }) => {
      const { error } = await supabase.from('licitacion_postulaciones').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postulantes-licitacion'] }) // prefix invalidation intentional
    },
  })
}
