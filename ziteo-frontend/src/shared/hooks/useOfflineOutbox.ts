// Offline-first outbox for critical RPC calls that must survive loss of connectivity.
// Uses localStorage (JSON, small payloads only) and replays on the 'online' event.
// Idempotency is the caller's responsibility — use a stable id (e.g. transaction_id).

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export interface OutboxEntry {
  id: string
  rpc: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: Record<string, any>
  createdAt: number
  attempts: number
}

const STORAGE_KEY = 'ziteoo_offline_outbox'
const MAX_ATTEMPTS = 10

function readOutbox(): OutboxEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as OutboxEntry[]
  } catch {
    return []
  }
}

function writeOutbox(entries: OutboxEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch { /* storage quota */ }
}

function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) return true
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    return msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')
  }
  return false
}

export function useOfflineOutbox() {
  const [pendingCount, setPendingCount] = useState(() => readOutbox().length)

  const syncOutbox = useCallback(async () => {
    const entries = readOutbox()
    if (entries.length === 0) return

    const remaining: OutboxEntry[] = []

    for (const entry of entries) {
      try {
        const { error } = await supabase.rpc(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          entry.rpc as any,
          entry.params,
        )
        if (error && !isNetworkError(new Error(error.message))) {
          // Non-network error (e.g. token invalid) — discard after too many attempts
          if (entry.attempts < MAX_ATTEMPTS) {
            remaining.push({ ...entry, attempts: entry.attempts + 1 })
          }
        }
        // success → drop from outbox
      } catch (e) {
        if (isNetworkError(e)) {
          remaining.push({ ...entry, attempts: entry.attempts + 1 })
        }
        // other errors: discard
      }
    }

    writeOutbox(remaining)
    setPendingCount(remaining.length)
  }, [])

  // Replay on reconnect
  useEffect(() => {
    window.addEventListener('online', syncOutbox)
    return () => window.removeEventListener('online', syncOutbox)
  }, [syncOutbox])

  function enqueue(entry: Omit<OutboxEntry, 'createdAt' | 'attempts'>): void {
    const entries = readOutbox()
    // Skip if already queued (idempotent enqueue by id)
    if (entries.some((e) => e.id === entry.id)) return
    const next = [...entries, { ...entry, createdAt: Date.now(), attempts: 0 }]
    writeOutbox(next)
    setPendingCount(next.length)
  }

  return { enqueue, syncOutbox, pendingCount }
}
