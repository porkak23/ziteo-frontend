import { Z } from '@/shared/design/tokens'
import { usePendingPayments } from '@/features/admin/hooks/usePendingPayments'
import { useAbandonedCarts, useSendCartRecoveryPush } from '@/features/admin/hooks/useAbandonedCarts'
import { useConversionFunnel } from '@/features/admin/hooks/useConversionFunnel'
import type { AbandonedCartItem } from '@/features/admin/hooks/useAbandonedCarts'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 14, fontWeight: 600, color: Z.text, marginBottom: 8 }}>{children}</h3>
  )
}

function ageLabel(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime()
  const hours = Math.floor(ms / (60 * 60 * 1000))
  if (hours < 1) return 'hace menos de 1h'
  if (hours < 24) return `hace ${hours}h`
  return `hace ${Math.floor(hours / 24)}d`
}

function FunnelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: Z.textMuted }}>{label}</span>
        <span style={{ color: Z.text, fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: Z.border, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: Z.orange, borderRadius: 4 }} />
      </div>
    </div>
  )
}

function AbandonedCartRow({ item }: { item: AbandonedCartItem }) {
  const sendPush = useSendCartRecoveryPush()
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: 12,
        borderRadius: 8,
        border: `1px solid ${Z.border}`,
        background: Z.surface,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: Z.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.product_name} × {item.quantity}
        </div>
        <div style={{ fontSize: 11, color: Z.textMuted, marginTop: 2 }}>
          Bs {(item.price_unit * item.quantity).toLocaleString('es-BO')} · abandonado {ageLabel(item.updated_at)}
        </div>
      </div>
      <button
        onClick={() => sendPush.mutate(item)}
        disabled={sendPush.isPending || sendPush.isSuccess}
        style={{
          flexShrink: 0,
          fontSize: 12,
          padding: '6px 12px',
          borderRadius: 6,
          border: `1px solid ${Z.border}`,
          background: sendPush.isSuccess ? Z.successBg : Z.surface,
          color: sendPush.isSuccess ? Z.success : Z.text,
          cursor: sendPush.isPending || sendPush.isSuccess ? 'default' : 'pointer',
        }}
      >
        {sendPush.isSuccess ? 'Enviado' : sendPush.isPending ? '...' : 'Recuperar'}
      </button>
    </div>
  )
}

export function CommerceScreen() {
  const { data: pendingPayments = [] } = usePendingPayments()
  const { data: abandonedCarts = [] } = useAbandonedCarts()
  const { data: funnel } = useConversionFunnel()

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <SectionTitle>Pagos por verificar ({pendingPayments.length})</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pendingPayments.length === 0 && (
            <div style={{ color: Z.textMuted, fontSize: 13, padding: 12 }}>Sin pagos pendientes.</div>
          )}
          {pendingPayments.map((order) => (
            <div
              key={order.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 12,
                borderRadius: 8,
                border: `1px solid ${Z.border}`,
                background: Z.surface,
                fontSize: 13,
              }}
            >
              <span style={{ color: Z.text }}>Bs {order.total.toLocaleString('es-BO')}</span>
              <span style={{ color: Z.textMuted }}>evidencia subida {ageLabel(order.payment_evidence_uploaded_at)}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Carritos abandonados ({abandonedCarts.length})</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {abandonedCarts.length === 0 && (
            <div style={{ color: Z.textMuted, fontSize: 13, padding: 12 }}>Sin carritos abandonados.</div>
          )}
          {abandonedCarts.map((item) => (
            <AbandonedCartRow key={`${item.user_id}:${item.product_id}`} item={item} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Funnel de conversión (7 días)</SectionTitle>
        {funnel && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: 16,
              borderRadius: 8,
              border: `1px solid ${Z.border}`,
              background: Z.surface,
            }}
          >
            <FunnelBar label="Agregado al carrito" value={funnel.addedToCart} max={funnel.addedToCart} />
            <FunnelBar label="Orden colocada" value={funnel.orderPlaced} max={funnel.addedToCart} />
            <FunnelBar label="Pago confirmado" value={funnel.paymentConfirmed} max={funnel.addedToCart} />
          </div>
        )}
      </div>
    </div>
  )
}
