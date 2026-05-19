import { useMutation } from '@tanstack/react-query'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../features/auth/store/authStore'

interface FeedbackPayload {
  description: string
  category: 'bug' | 'mejora' | 'pregunta' | 'otro'
}

export function useSubmitFeedback() {
  const user = useAuthStore((s) => s.user)

  return useMutation({
    mutationFn: async (payload: FeedbackPayload) => {
      if (!user) throw new Error('No autenticado')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('feedback') as any).insert({
        user_id: user.user_id,
        user_role: user.active_role,
        current_url: window.location.pathname,
        description: payload.description,
        category: payload.category,
      })

      if (error) throw error
    },
    // Feedback es best-effort — no bloquear al usuario si falla
    onError: () => {
      // silently ignored
    },
    retry: false,
  })
}
