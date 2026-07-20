import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface EdgeFunctionHealthRow {
  function_name: string
  request_count: number
  error_count: number
  error_rate_pct: number
  p95_duration_ms: number
  last_seen_at: string
}

async function fetchEdgeHealth(): Promise<EdgeFunctionHealthRow[]> {
  const { data, error } = await supabase.from('admin_edge_health_summary').select('*')
  if (error) throw error
  return (data ?? []) as EdgeFunctionHealthRow[]
}

// Ver admin_edge_health_summary en 20260719000006_admin_edge_health.sql.
// Solo funciones que adoptaron withTelemetry() (_shared/telemetry.ts)
// aparecen aquí — adopción incremental, no todas la tienen todavía.
export function useEdgeFunctionHealth() {
  return useQuery<EdgeFunctionHealthRow[], Error>({
    queryKey: ['admin', 'edge-function-health'],
    queryFn: fetchEdgeHealth,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
