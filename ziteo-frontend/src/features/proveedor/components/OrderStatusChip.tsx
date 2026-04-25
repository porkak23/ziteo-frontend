export function OrderStatusChip({ status }: { status: string }) {
  let bgClass = ''
  let textClass = ''
  let label = ''

  switch (status) {
    case 'pending':
      bgClass = 'bg-status-pending-bg'
      textClass = 'text-status-pending-text'
      label = 'Pendiente'
      break
    case 'processing':
      bgClass = 'bg-status-info-bg'
      textClass = 'text-status-info-text'
      label = 'En proceso'
      break
    case 'shipped':
      bgClass = 'bg-status-purple-bg'
      textClass = 'text-status-purple-text'
      label = 'Enviado'
      break
    case 'delivered':
      bgClass = 'bg-status-success-bg'
      textClass = 'text-status-success-text'
      label = 'Entregado'
      break
    case 'cancelled':
      bgClass = 'bg-status-error-bg'
      textClass = 'text-status-error-text'
      label = 'Cancelado'
      break
    default:
      bgClass = 'bg-surface-variant'
      textClass = 'text-on-surface-variant'
      label = status
      break
  }

  return (
    <span className={`text-xs font-label rounded-full px-3 py-0.5 ${bgClass} ${textClass}`}>
      {label}
    </span>
  )
}
