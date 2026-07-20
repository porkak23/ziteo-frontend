import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface AdminAlert {
  id: string
  severity: AlertSeverity
  kind: string
  payload: Record<string, unknown>
  created_at: string
  acknowledged_at: string | null
  acknowledged_by: string | null
}

async function fetchUnacknowledgedAlerts(): Promise<AdminAlert[]> {
  const { data, error } = await supabase
    .from('admin_alerts')
    .select('*')
    .is('acknowledged_at', null)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as AdminAlert[]
}

// Canal realtime sobre admin_alerts (ver 20260719000001_admin_role_foundation.sql).
export function useAdminAlerts() {
  const queryClient = useQueryClient()
  const query = useQuery<AdminAlert[], Error>({
    queryKey: ['admin', 'alerts'],
    queryFn: fetchUnacknowledgedAlerts,
    staleTime: 15_000,
  })

  useEffect(() => {
    const uid = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`admin:alerts:${uid}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()
  const [pendingId, setPendingId] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (alertId: string) => {
      setPendingId(alertId)
      const { error } = await supabase.rpc('acknowledge_admin_alert', { p_alert_id: alertId })
      if (error) throw error
    },
    onSettled: () => {
      setPendingId(null)
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] })
    },
  })

  return { ...mutation, pendingId }
}
