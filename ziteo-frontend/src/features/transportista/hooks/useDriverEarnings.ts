import { useMemo } from 'react'
import { useMyDeliveries } from './useDeliveries'
import type { Delivery } from '../types/deliveryTypes'

const COMMISSION_RATE = 0.12

export interface DailyEarnings {
  /** ISO date (YYYY-MM-DD) in local time. */
  date: string
  deliveries: number
  gross: number
  commission: number
  net: number
}

export interface EarningsSummary {
  gross: number
  commission: number
  net: number
  deliveries: number
  average: number
}

export interface DriverEarnings {
  today: EarningsSummary
  week: EarningsSummary
  byDay: DailyEarnings[]
  loading: boolean
}

function feeOf(d: Delivery): number {
  return d.estimated_fee ?? (d.order?.total != null ? d.order.total * 0.08 : 0)
}

function localDateKey(iso: string): string {
  const d = new Date(iso)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function summarize(entries: Delivery[]): EarningsSummary {
  const gross = entries.reduce((sum, d) => sum + feeOf(d), 0)
  const commission = gross * COMMISSION_RATE
  const net = gross - commission
  const deliveries = entries.length
  return {
    gross,
    commission,
    net,
    deliveries,
    average: deliveries > 0 ? net / deliveries : 0,
  }
}

export function useDriverEarnings(): DriverEarnings {
  const { data: myDeliveries = [], isLoading } = useMyDeliveries()

  return useMemo(() => {
    const completed = myDeliveries.filter((d) => d.status === 'delivered' && d.delivered_at)

    const now = new Date()
    const todayKey = localDateKey(now.toISOString())
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const todayEntries = completed.filter((d) => localDateKey(d.delivered_at!) === todayKey)
    const weekEntries = completed.filter((d) => new Date(d.delivered_at!) >= weekStart)

    const byDayMap = new Map<string, Delivery[]>()
    for (const d of weekEntries) {
      const key = localDateKey(d.delivered_at!)
      const bucket = byDayMap.get(key) ?? []
      bucket.push(d)
      byDayMap.set(key, bucket)
    }

    const byDay: DailyEarnings[] = Array.from(byDayMap.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, entries]) => {
        const s = summarize(entries)
        return {
          date,
          deliveries: s.deliveries,
          gross: s.gross,
          commission: s.commission,
          net: s.net,
        }
      })

    return {
      today: summarize(todayEntries),
      week: summarize(weekEntries),
      byDay,
      loading: isLoading,
    }
  }, [myDeliveries, isLoading])
}

export { COMMISSION_RATE }
