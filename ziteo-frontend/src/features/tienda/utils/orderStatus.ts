// Canonical order status utility — single source of truth for labels and colors.
// Colors are Tailwind classes from the project's design system tokens.

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'expired'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:    'Pendiente de pago',
  confirmed:  'Pago confirmado',
  processing: 'Pago confirmado — preparando envío',
  shipped:    'En camino',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
  expired:    'Expirado',
}

// Tailwind text-color classes using project design system tokens.
// These are intentionally text-only — no badge backgrounds, per design rules.
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending:    'text-on-surface-variant',
  confirmed:  'text-on-secondary-container',
  processing: 'text-on-tertiary-container',
  shipped:    'text-primary',
  delivered:  'text-on-primary-container',
  cancelled:  'text-error',
  expired:    'text-on-surface-variant',
}

export function getOrderStatusLabel(status: OrderStatus | string): string {
  return STATUS_LABELS[status as OrderStatus] ?? status
}

export function getOrderStatusColor(status: OrderStatus | string): string {
  return STATUS_COLORS[status as OrderStatus] ?? 'text-on-surface-variant'
}
