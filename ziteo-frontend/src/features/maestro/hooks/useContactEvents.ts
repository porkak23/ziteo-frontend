import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

export type ContactEventType = 'whatsapp_click' | 'profile_view'

// Registra un evento de contacto (click de WhatsApp o vista de perfil) vía RPC
// SECURITY DEFINER. Falla en silencio (solo console.warn): esto se usa para
// analítica, nunca debe bloquear un flujo real como abrir WhatsApp.
export function useLogContactEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      maestroId,
      eventType,
    }: {
      maestroId: string
      eventType: ContactEventType
    }) => {
      // `log_contact_event` es una RPC nueva (migración 20260707_contact_events.sql) que
      // aún no está en los tipos generados de Supabase; mismo escape hatch que
      // `broadcast_licitacion` en licitaciones/hooks/useLicitaciones.ts.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.rpc as any)('log_contact_event', {
        p_maestro_id: maestroId,
        p_event_type: eventType,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-stats'] })
    },
    onError: (err) => {
      // No propagar: el logging de contacto nunca debe romper el flujo que lo dispara.
      console.warn('[log_contact_event] failed:', err)
    },
  })
}

export interface ContactStats {
  whatsappClicks30d: number
  profileViews30d: number
  isLoading: boolean
}

export function useContactStats(maestroId: string): ContactStats {
  const { data, isLoading } = useQuery({
    queryKey: ['contact-stats', maestroId],
    enabled: !!maestroId,
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      // `contact_events` es una tabla nueva (misma migración) que aún no está en los
      // tipos generados de Supabase; mismo escape hatch que arriba.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contactEvents = supabase.from('contact_events' as any)

      const [whatsappRes, profileRes] = await Promise.all([
        contactEvents
          .select('id', { count: 'exact', head: true })
          .eq('maestro_id', maestroId)
          .eq('event_type', 'whatsapp_click')
          .gte('created_at', since),
        contactEvents
          .select('id', { count: 'exact', head: true })
          .eq('maestro_id', maestroId)
          .eq('event_type', 'profile_view')
          .gte('created_at', since),
      ])

      if (whatsappRes.error) throw whatsappRes.error
      if (profileRes.error) throw profileRes.error

      return {
        whatsappClicks30d: whatsappRes.count ?? 0,
        profileViews30d: profileRes.count ?? 0,
      }
    },
  })

  return {
    whatsappClicks30d: data?.whatsappClicks30d ?? 0,
    profileViews30d: data?.profileViews30d ?? 0,
    isLoading,
  }
}
