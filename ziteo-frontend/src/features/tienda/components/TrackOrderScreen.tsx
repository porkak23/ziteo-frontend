import { useEffect, useState, type CSSProperties } from 'react'
import { Z } from '@/shared/design/tokens'

// ─── Inline SVG icons (lucide-react not bundled) ─────────────────────────────
function IconArrowLeft({ size = 18, color = Z.text }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconMapPin({ size = 16, color = Z.orangeDark, style }: { size?: number; color?: string; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  )
}
function IconTruck({ size = 18, color = Z.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
      <circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  )
}
function IconClock({ size = 12, color = Z.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M12 6v6l4 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
import { LiveMap } from '@/shared/components/LiveMap'
import type { DriverPosition } from '@/shared/components/LiveMap'
import { useDriverLocation } from '../hooks/useDriverLocation'
import { haversineDistance } from '@/shared/hooks/useGeolocation'
import { supabase } from '@/lib/supabaseClient'

interface TrackOrderScreenProps {
  orderId: string
  driverId: string
  onBack: () => void
}

interface OrderGeo {
  delivery_address: string | null
  delivery_lat: number | null
  delivery_lng: number | null
}

// Estimate travel time: rough 30 km/h avg in urban Bolivia
function estimatedMinutes(distMeters: number): number {
  return Math.round((distMeters / 1000 / 30) * 60)
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function TrackOrderScreen({ orderId, driverId, onBack }: TrackOrderScreenProps) {
  const [orderGeo, setOrderGeo] = useState<OrderGeo | null>(null)
  const [loadingGeo, setLoadingGeo] = useState(true)

  const driverLocation = useDriverLocation(driverId)

  // Build DriverPosition from DriverLocation (field mapping: updated_at not updatedAt)
  const driverPosition: DriverPosition | null = driverLocation
    ? {
        lat: driverLocation.lat,
        lng: driverLocation.lng,
        heading: driverLocation.heading ?? undefined,
        updatedAt: driverLocation.updated_at,
      }
    : null

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingGeo(true)

    void supabase
      .from('orders')
      .select('delivery_address, delivery_lat, delivery_lng')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setOrderGeo(
            data
              ? {
                  delivery_address: (data as { delivery_address?: string | null }).delivery_address ?? null,
                  delivery_lat: (data as { delivery_lat?: number | null }).delivery_lat ?? null,
                  delivery_lng: (data as { delivery_lng?: number | null }).delivery_lng ?? null,
                }
              : null
          )
          setLoadingGeo(false)
        }
      }, () => {
        if (!cancelled) setLoadingGeo(false)
      })

    return () => { cancelled = true }
  }, [orderId])

  // Calculate distance if we have both positions
  const distanceMeters =
    driverPosition && orderGeo?.delivery_lat != null && orderGeo?.delivery_lng != null
      ? haversineDistance(
          driverPosition.lat,
          driverPosition.lng,
          orderGeo.delivery_lat,
          orderGeo.delivery_lng
        )
      : null

  const estMinutes = distanceMeters != null ? estimatedMinutes(distanceMeters) : null

  // Derive status label from distance
  const statusLabel =
    distanceMeters == null
      ? 'Conductor en camino'
      : distanceMeters < 300
        ? 'Llegando...'
        : 'Conductor en camino'

  // The bottom panel is ~140px; header is ~69px; window minus both gives map height
  const mapHeight =
    typeof window !== 'undefined'
      ? Math.max(200, window.innerHeight - 69 - 140)
      : 400

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: Z.bg,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          borderBottom: `1px solid ${Z.border}`,
          background: Z.surface,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Volver"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: Z.r.sm,
            border: `1px solid ${Z.border}`,
            background: 'transparent',
            cursor: 'pointer',
            outline: 'none',
            flexShrink: 0,
          }}
        >
          <IconArrowLeft size={18} color={Z.text} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2
            style={{
              fontFamily: Z.font,
              fontSize: 16,
              fontWeight: 700,
              color: Z.text,
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Seguimiento de pedido
          </h2>
          <p
            style={{
              fontFamily: Z.font,
              fontSize: 11,
              color: Z.textMuted,
              margin: '2px 0 0',
            }}
          >
            #{orderId.slice(0, 8).toUpperCase()}
          </p>
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'relative' }}>
        {loadingGeo ? (
          <div
            style={{
              height: mapHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: Z.surface,
            }}
          >
            <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted }}>
              Cargando mapa...
            </span>
          </div>
        ) : (
          <LiveMap
            driverPosition={driverPosition}
            dropoffLat={orderGeo?.delivery_lat ?? null}
            dropoffLng={orderGeo?.delivery_lng ?? null}
            height={mapHeight}
          />
        )}

        {/* No driver signal overlay — only when map is loaded and no position */}
        {!loadingGeo && !driverPosition && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
              padding: '20px 28px',
              background: Z.surface,
              border: `1px solid ${Z.border}`,
              borderRadius: Z.r.lg,
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            }}
          >
            <IconTruck size={28} color={Z.textMuted} />
            <p
              style={{
                fontFamily: Z.font,
                fontSize: 13,
                fontWeight: 600,
                color: Z.textSec,
                margin: 0,
                textAlign: 'center',
              }}
            >
              Esperando posicion del conductor...
            </p>
            <p
              style={{
                fontFamily: Z.font,
                fontSize: 11,
                color: Z.textMuted,
                margin: 0,
                textAlign: 'center',
              }}
            >
              El mapa se actualizara automaticamente
            </p>
          </div>
        )}
      </div>

      {/* Bottom info panel */}
      <div
        style={{
          flexShrink: 0,
          background: Z.surface,
          borderTop: `1px solid ${Z.border}`,
          padding: '16px 20px',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* Status row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: Z.r.sm,
              background: Z.orangeLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconTruck size={18} color={Z.orangeDark} />
          </div>
          <div>
            <p
              style={{
                fontFamily: Z.font,
                fontSize: 14,
                fontWeight: 700,
                color: Z.text,
                margin: 0,
              }}
            >
              {statusLabel}
            </p>
            {distanceMeters != null && estMinutes != null && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 2,
                }}
              >
                <IconClock size={12} color={Z.textMuted} />
                <span
                  style={{
                    fontFamily: Z.font,
                    fontSize: 12,
                    color: Z.textMuted,
                  }}
                >
                  {formatDistance(distanceMeters)} · Est. {estMinutes} min
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Destination row */}
        {(orderGeo?.delivery_address || orderGeo?.delivery_lat != null) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              borderRadius: Z.r.md,
              background: Z.bg,
              border: `1px solid ${Z.border}`,
            }}
          >
            <IconMapPin size={16} color={Z.orangeDark} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p
                style={{
                  fontFamily: Z.font,
                  fontSize: 11,
                  fontWeight: 600,
                  color: Z.textMuted,
                  margin: '0 0 2px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                }}
              >
                Destino
              </p>
              <p
                style={{
                  fontFamily: Z.font,
                  fontSize: 13,
                  fontWeight: 600,
                  color: Z.text,
                  margin: 0,
                  lineHeight: 1.4,
                }}
              >
                {orderGeo.delivery_address ??
                  (orderGeo.delivery_lat != null && orderGeo.delivery_lng != null
                    ? `${orderGeo.delivery_lat.toFixed(5)}, ${orderGeo.delivery_lng.toFixed(5)}`
                    : 'Direccion no disponible')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
