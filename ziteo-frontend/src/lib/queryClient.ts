import { QueryClient } from '@tanstack/react-query'
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import { get, set, del } from 'idb-keyval'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 1000 * 60 * 5,        // 5 minutes
      gcTime: 1000 * 60 * 60,          // 1 hour in memory cache
      refetchOnWindowFocus: false,      // Don't reload on tab focus
      refetchOnReconnect: true,         // Reload when connection recovers
    },
    mutations: {
      retry: 1, // 1 retry for mutations (orders, payments)
    },
  },
})

export const RQ_CACHE_KEY = '__rq_cache'

export const idbPersister: Persister = {
  persistClient: (client: PersistedClient) => set(RQ_CACHE_KEY, client),
  restoreClient: () => get<PersistedClient>(RQ_CACHE_KEY),
  removeClient: () => del(RQ_CACHE_KEY),
}
