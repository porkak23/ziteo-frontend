import type { Delivery } from '../types/deliveryTypes'

export function deliveryFee(delivery: Delivery): { raw: number | null; label: string } {
  const raw = delivery.estimated_fee ?? (delivery.order?.total != null ? delivery.order.total * 0.08 : null)
  return { raw, label: raw != null ? `Bs. ${raw.toFixed(2)}` : '—' }
}
