import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface TelemetrySourceResult {
  configured: boolean
  error?: string
  issues?: unknown[]
  events?: unknown
}

async function fetchTelemetry(source: 'sentry' | 'posthog'): Promise<TelemetrySourceResult> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No hay sesión activa')

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-telemetry?source=${source}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.message ?? `admin-telemetry respondió ${res.status}`)
  }
  return res.json()
}

// Proxy a Sentry/PostHog (ver supabase/functions/admin-telemetry/index.ts).
// Cache de 5min en la propia Edge Function; aquí solo evitamos refetch
// excesivo en el cliente.
export function useSentryHealth() {
  return useQuery<TelemetrySourceResult, Error>({
    queryKey: ['admin', 'telemetry', 'sentry'],
    queryFn: () => fetchTelemetry('sentry'),
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function usePostHogHealth() {
  return useQuery<TelemetrySourceResult, Error>({
    queryKey: ['admin', 'telemetry', 'posthog'],
    queryFn: () => fetchTelemetry('posthog'),
    staleTime: 5 * 60_000,
    retry: false,
  })
}
