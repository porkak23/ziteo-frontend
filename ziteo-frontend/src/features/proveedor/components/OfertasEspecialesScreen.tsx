import { useState } from 'react'
import { Z } from '../../../shared/design/tokens'
import { ZHeader } from '../../../shared/design/components/ZHeader'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { useProductsWithPromos, useSetPromo, type ProductoConPromo } from '../hooks/useProductPromos'

interface Props {
  onBack: () => void
}

export function OfertasEspecialesScreen({ onBack }: Props) {
  const { toasts, showToast, removeToast } = useToast()
  const { data: products = [], isLoading } = useProductsWithPromos()
  const { mutate: setPromo, isPending } = useSetPromo()
  const [editing, setEditing] = useState<Record<string, { price: string; until: string }>>({})

  const getEdit = (p: ProductoConPromo) => editing[p.id] ?? {
    price: p.promo_price ? String(p.promo_price) : '',
    until: p.promo_until ? p.promo_until.slice(0, 10) : '',  // yyyy-mm-dd
  }

  const handleToggle = (p: ProductoConPromo) => {
    const ed = getEdit(p)
    if (!p.promo_active) {
      // activar — necesita precio
      if (!ed.price || parseFloat(ed.price) <= 0) {
        showToast('Ingresa un precio especial primero', 'error')
        return
      }
      if (parseFloat(ed.price) >= p.price) {
        showToast('El precio de oferta debe ser menor al precio normal', 'error')
        return
      }
    }
    setPromo(
      {
        product_id: p.id,
        promo_active: !p.promo_active,
        promo_price: ed.price ? parseFloat(ed.price) : null,
        promo_until: ed.until ? new Date(ed.until + 'T23:59:59').toISOString() : null,
      },
      {
        onSuccess: () => showToast(p.promo_active ? 'Oferta desactivada' : 'Oferta activada', 'success'),
        onError: () => showToast('Error al guardar la oferta', 'error'),
      }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Toast toasts={toasts} onRemove={removeToast} />
      <ZHeader title="Ofertas Especiales" onBack={onBack} />

      <div style={{ padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Info banner */}
        <div style={{
          padding: '12px 14px', borderRadius: Z.r.md, background: Z.blueLight,
          border: `1px solid ${Z.bluePastel}`,
        }}>
          <p style={{ fontFamily: Z.font, fontSize: 12, color: Z.blueDark, fontWeight: 600, margin: 0 }}>
            Activa una oferta en cualquier producto. Los compradores verán el precio especial en la tienda.
          </p>
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} style={{ height: 100, borderRadius: Z.r.md, background: Z.divider, animation: 'pulse 1.5s infinite' }} />
          ))
        ) : products.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={Z.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
              <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/>
            </svg>
            <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>
              No tienes productos activos en tu inventario
            </p>
          </div>
        ) : (
          products.map((p) => {
            const ed = getEdit(p)
            return (
              <div key={p.id} style={{
                borderRadius: Z.r.md, background: Z.surface,
                border: `1.5px solid ${p.promo_active ? Z.orange : Z.border}`,
                padding: '14px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>
                      Precio normal: <strong>Bs {p.price}</strong> / {p.unit}
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(p)}
                    disabled={isPending}
                    aria-label={p.promo_active ? 'Desactivar oferta' : 'Activar oferta'}
                    style={{
                      position: 'relative', width: 42, height: 24, borderRadius: 12,
                      border: 'none', cursor: isPending ? 'default' : 'pointer', outline: 'none',
                      background: p.promo_active ? Z.orange : Z.border, transition: 'background 0.2s', flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 3,
                      left: p.promo_active ? 20 : 3,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#fff', transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </button>
                </div>

                {/* Edit row — always visible so user can set before activating */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 4 }}>
                      Precio oferta (Bs.) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={ed.price}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: { ...ed, price: e.target.value } }))}
                      placeholder={`< ${p.price}`}
                      style={{
                        width: '100%', fontFamily: Z.font, fontSize: 14, color: Z.text,
                        padding: '8px 10px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                        background: Z.bg, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 4 }}>
                      Válido hasta
                    </label>
                    <input
                      type="date"
                      value={ed.until}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [p.id]: { ...ed, until: e.target.value } }))}
                      style={{
                        width: '100%', fontFamily: Z.font, fontSize: 14, color: Z.text,
                        padding: '8px 10px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                        background: Z.bg, outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {p.promo_active && (
                  <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.success, marginTop: -4 }}>
                    En oferta activa — Bs {p.promo_price} {p.promo_until ? `(hasta ${new Date(p.promo_until).toLocaleDateString('es-BO')})` : ''}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
