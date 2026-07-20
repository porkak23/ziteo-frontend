import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

export interface ActivityEvent {
  id: number
  user_id: string | null
  event_name: string
  properties: Record<string, unknown>
  created_at: string
}

const FEED_LIMIT = 50

async function fetchRecentEvents(): Promise<ActivityEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(FEED_LIMIT)
  if (error) throw error
  return (data ?? []) as ActivityEvent[]
}

// Feed en vivo del Command Center: snapshot inicial + canal realtime
// sobre la tabla `events` (ver 20260719000002_admin_events_and_activity.sql).
export function useActivityFeed() {
  const query = useQuery<ActivityEvent[], Error>({
    queryKey: ['admin', 'activity-feed'],
    queryFn: fetchRecentEvents,
    staleTime: 30_000,
  })

  const [liveEvents, setLiveEvents] = useState<ActivityEvent[]>([])

  useEffect(() => {
    const uid = Math.random().toString(36).slice(2, 8)
    const channel = supabase
      .channel(`admin:events:${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events' },
        (payload) => {
          setLiveEvents((prev) => [payload.new as ActivityEvent, ...prev].slice(0, FEED_LIMIT))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const events = [...liveEvents, ...(query.data ?? [])]
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, FEED_LIMIT)

  return { ...query, data: events }
}
