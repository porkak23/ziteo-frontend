import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'

export interface TransportRequest {
  id: string
  requester_id: string
  requester_role: string
  // 'medium' existe en BD (CHECK compartido con orders/deliveries) pero los
  // fletes directos aún solo ofrecen light/heavy al crear (ver CreateTransportPayload).
  cargo_type: 'light' | 'medium' | 'heavy'
  pickup_address: string
  dropoff_address: string
  pickup_lat: number | null
  pickup_lng: number | null
  dropoff_lat: number | null
  dropoff_lng: number | null
  description: string | null
  city: string | null
  status: 'pending' | 'accepted' | 'in_transit' | 'completed' | 'cancelled'
  driver_id: string | null
  accepted_at: string | null
  created_at: string
}

// ─── Constructor/maestro: crear solicitud ─────────────────────────────────────

export interface CreateTransportPayload {
  cargo_type: 'light' | 'heavy'
  pickup_address: string
  dropoff_address: string
  pickup_lat?: number | null
  pickup_lng?: number | null
  dropoff_lat?: number | null
  dropoff_lng?: number | null
  description?: string
  city?: string
}

export function useCreateTransportRequest() {
  const user = useAuthStore((s) => s.user)
  return useMutation({
    mutationFn: async (payload: CreateTransportPayload) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('transport_requests')
        .insert({
          requester_id:    user!.user_id,
          requester_role:  user!.active_role ?? 'constructor',
          cargo_type:      payload.cargo_type,
          pickup_address:  payload.pickup_address,
          dropoff_address: payload.dropoff_address,
          pickup_lat:      payload.pickup_lat ?? null,
          pickup_lng:      payload.pickup_lng ?? null,
          dropoff_lat:     payload.dropoff_lat ?? null,
          dropoff_lng:     payload.dropoff_lng ?? null,
          description:     payload.description ?? null,
          city:            payload.city ?? null,
          status:          'pending',
        })
        .select('id')
        .single()
      if (error) throw new Error(error.message)
      return data as { id: string }
    },
  })
}

// ─── Chofer: ver pool de pendientes ──────────────────────────────────────────

export function usePendingTransportRequests() {
  const queryClient = useQueryClient()
  const queryClientRef = useRef(queryClient)

  const query = useQuery<TransportRequest[]>({
    queryKey: ['transport-requests', 'pool'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('transport_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) {
        if (error.code === '42P01') return []  // tabla no existe aún
        throw new Error(error.message)
      }
      return (data ?? []) as TransportRequest[]
    },
    staleTime: 30_000,
  })

  useEffect(() => {
    const uid = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`transport-requests:pool:${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transport_requests', filter: 'status=eq.pending' }, () => {
        queryClientRef.current.invalidateQueries({ queryKey: ['transport-requests', 'pool'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  return query
}

// ─── Chofer: mis transportes activos/historial ───────────────────────────────

export function useMyTransportRequests() {
  const user = useAuthStore((s) => s.user)
  const driverId = user?.user_id ?? ''
  const queryClient = useQueryClient()
  const queryClientRef = useRef(queryClient)

  const query = useQuery<TransportRequest[]>({
    queryKey: ['transport-requests', 'mine', driverId],
    enabled: !!driverId,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('transport_requests')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as TransportRequest[]
    },
  })

  useEffect(() => {
    if (!driverId) return
    const uid = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`transport-requests:driver:${driverId}:${uid}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transport_requests', filter: `driver_id=eq.${driverId}` }, () => {
        queryClientRef.current.invalidateQueries({ queryKey: ['transport-requests', 'mine', driverId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [driverId])

  return query
}

// ─── Chofer: avanzar estado de transporte ────────────────────────────────────

export interface AdvanceTransportResult {
  success: boolean
  message?: string
  request_id?: string
  status?: string
}

export function useAdvanceTransportRequest() {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const driverId = user?.user_id ?? ''

  return useMutation<AdvanceTransportResult, Error, { requestId: string; newStatus: 'in_transit' | 'completed' | 'cancelled' }>({
    mutationFn: async ({ requestId, newStatus }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('advance_transport_request', {
        p_request_id: requestId,
        p_new_status: newStatus,
      })
      if (error) throw new Error(error.message)
      const result = data as AdvanceTransportResult
      if (!result.success) throw new Error(result.message ?? 'Error al avanzar estado')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-requests', 'mine', driverId] })
      queryClient.invalidateQueries({ queryKey: ['transport-requests', 'pool'] })
    },
  })
}

// ─── Chofer: aceptar solicitud ────────────────────────────────────────────────

export interface AcceptTransportResult {
  success: boolean
  message?: string
  request_id?: string
}

export function useAcceptTransportRequest() {
  const queryClient = useQueryClient()
  return useMutation<AcceptTransportResult, Error, string>({
    mutationFn: async (requestId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('accept_transport_request', { p_request_id: requestId })
      if (error) throw new Error(error.message)
      return data as AcceptTransportResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-requests', 'pool'] })
    },
  })
}
