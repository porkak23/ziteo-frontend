import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { usePendingDeliveries, useMyDeliveries } from '../hooks/useDeliveries'
import { useDriverEarnings } from '../hooks/useDriverEarnings'
import { useDriverProfile, useSaveVehicleType } from '../hooks/useDriverProfile'
import { DeliveryCard, DeliverySkeleton } from './DeliveryCard'
import { deliveryFee } from '../utils/deliveryUtils'
import { DeliveryDetailScreen } from './DeliveryDetailScreen'
import { useGeolocation, haversineDistance } from '../../../shared/hooks/useGeolocation'
import type { Delivery, VehicleType } from '../types/deliveryTypes'

type ServiceMode = 'entregas' | 'transporte'

// ─── Vehicle setup banner ─────────────────────────────────────────────────────

const VEHICLE_OPTS: { value: VehicleType; icon: string; label: string }[] = [
  { value: 'moto',      icon: '🛵', label: 'Moto' },
  { value: 'camioneta', icon: '🚗', label: 'Camioneta' },
  { value: 'camion',    icon: '🚛', label: 'Camión' },
  { value: 'pickup',    icon: '🛻', label: 'Pickup' },
]

function VehicleSetupBanner() {
  const { mutate: save, isPending } = useSaveVehicleType()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="mx-4 mt-4 bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-label font-bold text-on-surface text-sm">Configura tu vehículo</p>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            Verás solo pedidos compatibles con tu tipo de carga
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label="Cerrar"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-base" aria-hidden="true">close</span>
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {VEHICLE_OPTS.map((v) => (
          <button
            key={v.value}
            type="button"
            disabled={isPending}
            onClick={() => save(v.value)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl border border-outline-variant bg-surface-container active:opacity-70 transition-opacity disabled:opacity-50 text-center"
          >
            <span className="text-xl leading-none">{v.icon}</span>
            <span className="font-label text-[11px] font-semibold text-on-surface">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Radar SVG ────────────────────────────────────────────────────────────────

function RadarActive({
  jobCount,
  hasLocation,
}: {
  jobCount: number
  hasLocation: boolean
}) {
  const dots = [
    { x: 124, y: 56 },
    { x: 156, y: 116 },
    { x: 110, y: 144 },
    { x: 60, y: 110 },
    { x: 76, y: 60 },
    { x: 140, y: 160 },
    { x: 40, y: 140 },
  ].slice(0, Math.max(1, Math.min(jobCount, 7)))

  return (
    <div
      className="relative w-full"
      style={{ height: 200 }}
      role="img"
      aria-label={`Radar: ${jobCount} trabajo${jobCount !== 1 ? 's' : ''} cerca`}
    >
      <div className="absolute inset-0 bg-[--color-driver-bg] rounded-b-3xl overflow-hidden">
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 200 200" preserveAspectRatio="none">
          {[25, 50, 75, 100, 125, 150, 175].map((v) => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="200" stroke="white" strokeWidth="0.4" />
              <line x1="0" y1={v} x2="200" y2={v} stroke="white" strokeWidth="0.4" />
            </g>
          ))}
        </svg>

        {/* Radar arcs from driver position (center-bottom) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
          {/* Static rings */}
          {[40, 70, 100, 130].map((r, i) => (
            <circle
              key={r}
              cx="100" cy="200"
              r={r}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="0.5"
              opacity={0.2 - i * 0.03}
            />
          ))}
          {/* Pulse rings */}
          <circle cx="100" cy="200" r="25" fill="none" stroke="var(--color-primary)" strokeWidth="1.2"
            style={{ transformOrigin: '100px 200px', animation: 'radarRingScale1 2.4s ease-out infinite' }} />
          <circle cx="100" cy="200" r="25" fill="none" stroke="var(--color-primary)" strokeWidth="0.8"
            style={{ transformOrigin: '100px 200px', animation: 'radarRingScale2 2.4s ease-out infinite 0.8s' }} />
          <circle cx="100" cy="200" r="25" fill="none" stroke="var(--color-primary)" strokeWidth="0.5"
            style={{ transformOrigin: '100px 200px', animation: 'radarRingScale3 2.4s ease-out infinite 1.6s' }} />
          {/* Job dots */}
          {dots.map((dot, i) => (
            <g key={i}>
              <circle cx={dot.x} cy={dot.y} r="5" fill="var(--color-primary)" opacity="0.9" />
              <circle cx={dot.x} cy={dot.y} r="8" fill="none" stroke="var(--color-primary)" strokeWidth="0.6" opacity="0.35" />
            </g>
          ))}
          {/* Driver center */}
          <circle cx="100" cy="200" r="7" fill="var(--color-primary)" />
          <circle cx="100" cy="200" r="4" fill="white" />
        </svg>

        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[--color-driver-bg] to-transparent" />

        {/* Jobs badge */}
        <div className="absolute top-3 right-3 bg-primary rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-label font-bold text-on-primary text-xs">
            {jobCount} {jobCount === 1 ? 'trabajo' : 'trabajos'} cerca
          </span>
        </div>

        {/* GPS indicator */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`material-symbols-outlined text-sm ${hasLocation ? 'text-primary' : 'text-white/30'}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            {hasLocation ? 'gps_fixed' : 'gps_off'}
          </span>
          <span className="font-body text-white/50 text-xs">
            {hasLocation ? 'GPS activo' : 'Sin GPS'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Job card ─────────────────────────────────────────────────────────────────

function JobCard({
  delivery,
  onAccept,
  distanceM,
}: {
  delivery: Delivery
  onAccept: (id: string) => void
  distanceM?: number
}) {
  const fee = deliveryFee(delivery)
  const kmLabel = delivery.distance_km != null
    ? `${delivery.distance_km} km`
    : distanceM != null
    ? `${(distanceM / 1000).toFixed(1)} km`
    : null

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
      {/* Fee row */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-outline-variant/50">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none" aria-hidden="true">
            {delivery.cargo_type === 'heavy' ? '🚛' : '🛵'}
          </span>
          <span className="font-label font-semibold text-on-surface text-sm">
            Pedido #{delivery.id.slice(0, 6).toUpperCase()}
          </span>
          <span className={`font-label text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
            delivery.cargo_type === 'heavy'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
          }`}>
            {delivery.cargo_type === 'heavy' ? 'Pesado' : 'Ligero'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-headline font-black text-primary text-xl">{fee.label}</span>
          {kmLabel && (
            <span className="bg-primary/10 text-primary font-label font-semibold text-xs px-2 py-0.5 rounded-full">
              {kmLabel}
            </span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-0.5 shrink-0 mt-0.5">
            <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
            <div className="w-0.5 h-5 bg-outline-variant" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Recoger en</p>
            <p className="font-body text-sm text-on-surface leading-tight">{delivery.pickup_address ?? 'Dirección de recogida'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <div className="w-3 h-3 rounded-full bg-error border-2 border-error/30" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Entregar en</p>
            <p className="font-body text-sm text-on-surface leading-tight">{delivery.dropoff_address ?? 'Dirección de entrega'}</p>
          </div>
        </div>
      </div>

      {/* Tiempo estimado */}
      {delivery.distance_km != null && (
        <div className="flex items-center gap-1.5 px-4 pb-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm" aria-hidden="true">schedule</span>
          <span className="font-body text-xs">~{Math.round(delivery.distance_km * 4)} min estimado</span>
        </div>
      )}

      {/* Accept */}
      <div className="px-4 pb-4">
        <button
          onClick={() => onAccept(delivery.id)}
          className="w-full bg-primary text-on-primary font-label font-bold text-base py-4 rounded-2xl active:opacity-80 transition-opacity flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
            check_circle
          </span>
          Aceptar trabajo
        </button>
      </div>
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function TransportistaScreen() {
  const user = useAuthStore((s) => s.user)
  const firstName = (user?.name ?? '').split(' ')[0] || 'Chofer'

  const [isOnline, setIsOnline] = useState(false)
  const [serviceMode, setServiceMode] = useState<ServiceMode>('entregas')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [arrivedAt, setArrivedAt] = useState<string | null>(null)

  const { data: driverProfile } = useDriverProfile()
  const cargoCapability = driverProfile?.cargo_capability ?? null

  const { data: poolDeliveries = [], isLoading: poolLoading } = usePendingDeliveries(cargoCapability)
  const { data: myDeliveries = [], isLoading: myLoading } = useMyDeliveries()
  const { today } = useDriverEarnings()
  const geo = useGeolocation(isOnline)

  const activeDeliveries = myDeliveries.filter(
    (d) => d.status === 'accepted' || d.status === 'in_transit'
  )
  const completedToday = myDeliveries.filter((d) => d.status === 'delivered').length

  // Publica la posición GPS del chofer cada 30s mientras está en línea.
  const latestPosRef = useRef(geo.position)
  latestPosRef.current = geo.position
  useEffect(() => {
    if (!isOnline) return
    const publish = () => {
      const pos = latestPosRef.current
      if (!pos) return
      supabase.rpc('upsert_driver_location', { p_lat: pos.lat, p_lng: pos.lng }).then(undefined, () => {})
    }
    publish()
    const id = setInterval(publish, 30_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline])

  // Auto-detect arrival: if driver is within 200m of active delivery's dropoff
  useEffect(() => {
    if (!geo.position || activeDeliveries.length === 0) return
    const delivery = activeDeliveries[0]
    if (delivery.dropoff_lat == null || delivery.dropoff_lng == null) return
    const dist = haversineDistance(
      geo.position.lat, geo.position.lng,
      delivery.dropoff_lat, delivery.dropoff_lng
    )
    if (dist < 200 && arrivedAt !== delivery.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setArrivedAt(delivery.id)
    }
  }, [geo.position, activeDeliveries, arrivedAt])

  if (detailId) {
    return <DeliveryDetailScreen deliveryId={detailId} onBack={() => setDetailId(null)} />
  }

  // ── OFFLINE ───────────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div data-testid="radar-offline-panel" className="flex flex-col min-h-dvh bg-[--color-driver-bg] pb-16">
        {/* Header */}
        <div className="px-5 pt-8 pb-4 flex items-start justify-between">
          <div>
            <p className="font-body text-white/40 text-xs tracking-wider uppercase mb-1">Transportista</p>
            <h1 className="font-headline font-black text-white text-3xl leading-none tracking-tight">{firstName}</h1>
          </div>
          <div data-testid="radar-status-badge" className="flex items-center gap-1.5 bg-error/15 border border-error/30 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            <span className="font-label font-bold text-error text-xs">Offline</span>
          </div>
        </div>

        {/* Radar (static / dormant) */}
        <div className="mx-5 rounded-2xl overflow-hidden bg-[--color-driver-surface]">
          <div className="relative" style={{ height: 180 }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 180" preserveAspectRatio="xMidYMid meet">
              {[35, 65, 95, 125].map((r) => (
                <circle key={r} cx="100" cy="180" r={r} fill="none" stroke="white" strokeWidth="0.4" opacity="0.06" />
              ))}
              <circle cx="100" cy="180" r="8" fill="white" opacity="0.08" />
              <circle cx="100" cy="180" r="4" fill="white" opacity="0.12" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-white/25 text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  local_shipping
                </span>
              </div>
              <p className="font-label font-bold text-white/25 text-sm">Radar inactivo</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[--color-driver-surface] to-transparent" />
          </div>
        </div>

        {/* Stats del día */}
        {(completedToday > 0 || today.net > 0) && (
          <div className="flex gap-3 mx-5 mt-4">
            <div className="flex-1 bg-white/5 rounded-2xl px-4 py-3 text-center border border-white/8">
              <p className="font-headline font-black text-white text-2xl">{completedToday}</p>
              <p className="font-body text-white/40 text-xs mt-0.5">viajes hoy</p>
            </div>
            <div className="flex-1 bg-white/5 rounded-2xl px-4 py-3 text-center border border-white/8">
              <p className="font-headline font-black text-white text-2xl">Bs. {today.net.toFixed(0)}</p>
              <p className="font-body text-white/40 text-xs mt-0.5">ganado hoy</p>
            </div>
          </div>
        )}

        {/* Texto motivacional */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-4 text-center gap-3">
          <p className="font-headline font-black text-white text-2xl leading-tight">
            ¿Listo para trabajar?
          </p>
          <p className="font-body text-white/40 text-sm max-w-xs leading-relaxed">
            Actívate para ver pedidos y transportes disponibles en tu zona
          </p>
        </div>

        {/* CTA principal — toggle gigante estilo InDrive */}
        <div className="px-5 pb-10 flex flex-col items-center gap-4">
          <button
            data-testid="radar-activar-btn"
            onClick={() => setIsOnline(true)}
            aria-label="Conectarme para recibir trabajos"
            className="w-full bg-primary text-on-primary font-headline font-black text-2xl tracking-tight py-6 rounded-3xl active:scale-[0.98] transition-[transform,opacity] active:opacity-90 shadow-[0_0_40px_var(--color-primary)/25]"
          >
            <span className="flex items-center justify-center gap-3">
              <span
                className="material-symbols-outlined text-3xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                power_settings_new
              </span>
              CONECTARME
            </span>
          </button>
          <p className="font-body text-white/25 text-xs text-center">
            Se usará tu ubicación mientras estés conectado
          </p>
        </div>
      </div>
    )
  }

  // ── ONLINE ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-dvh bg-background pb-16">

      {/* Dark hero con radar */}
      <div className="bg-[--color-driver-bg]">
        {/* Top bar */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p data-testid="radar-status-badge" className="font-body text-white/40 text-xs">Conectado</p>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-black text-white text-xl leading-tight">{firstName}</h1>
              {driverProfile?.vehicle_type && (
                <span className="font-label text-[11px] font-semibold bg-white/10 text-white/70 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                    {driverProfile.vehicle_type === 'moto' ? 'two_wheeler' : 'local_shipping'}
                  </span>
                  {driverProfile.vehicle_type === 'moto' ? 'Moto' :
                   driverProfile.vehicle_type === 'camion' ? 'Camión' :
                   driverProfile.vehicle_type === 'camioneta' ? 'Camioneta' : 'Pickup'}
                </span>
              )}
            </div>
          </div>

          {/* Toggle online — pill visible */}
          <button
            onClick={() => setIsOnline(false)}
            aria-pressed={true}
            aria-label="Desconectarme"
            className="flex items-center gap-2 bg-primary/15 border border-primary/40 rounded-full px-4 py-2 active:opacity-80 transition-opacity"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label font-bold text-primary text-sm">En línea</span>
            <span className="material-symbols-outlined text-on-surface-variant text-base" aria-hidden="true">close</span>
          </button>
        </div>

        {/* Earnings strip */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {[
            { label: 'Hoy', value: `Bs. ${today.net.toFixed(0)}` },
            { label: 'Viajes', value: String(completedToday) },
            { label: 'En curso', value: String(activeDeliveries.length) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 rounded-2xl px-3 py-2.5 text-center border border-white/8">
              <p className="font-body text-white/40 text-[10px] uppercase tracking-wider">{label}</p>
              <p className="font-headline font-black text-white text-lg mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Radar activo */}
        <RadarActive
          jobCount={serviceMode === 'entregas' ? poolDeliveries.length : 0}
          hasLocation={geo.position !== null}
        />
      </div>

      {/* Llegó a destino — banner auto-search */}
      {arrivedAt && (
        <div className="mx-4 mt-4 bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-start gap-3">
          <span
            className="material-symbols-outlined text-primary text-2xl mt-0.5 shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}
            aria-hidden="true"
          >
            location_on
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-label font-bold text-primary text-sm">¡Llegaste al destino!</p>
            <p className="font-body text-on-surface-variant text-xs mt-0.5">
              Buscando trabajos cerca de tu ubicación actual…
            </p>
          </div>
          <button
            onClick={() => setArrivedAt(null)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-base" aria-hidden="true">close</span>
          </button>
        </div>
      )}

      {/* Vehicle setup nudge — shown only if driver has no vehicle_type configured */}
      {driverProfile !== undefined && driverProfile.vehicle_type === null && (
        <VehicleSetupBanner />
      )}

      {/* Service mode selector */}
      <div className="bg-surface border-b border-outline-variant px-4 py-3">
        <p className="font-body text-[10px] uppercase tracking-[0.12em] text-on-surface-variant/60 font-semibold mb-2">
          ¿Qué tipo de trabajo buscas?
        </p>
        <div className="flex gap-2">
          {(['entregas', 'transporte'] as const).map((mode) => {
            const isActive = serviceMode === mode
            const badge = mode === 'entregas' ? poolDeliveries.length : 0
            return (
              <button
                key={mode}
                onClick={() => setServiceMode(mode)}
                aria-pressed={isActive}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-label font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant'
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  {mode === 'entregas' ? 'package_2' : 'local_shipping'}
                </span>
                {mode === 'entregas' ? 'Entregas' : 'Transporte'}
                {badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-on-primary/20 text-on-primary' : 'bg-surface text-on-surface-variant'}`}>
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Active delivery banner */}
      {activeDeliveries.length > 0 && (
        <div className="mx-4 mt-4">
          <button
            onClick={() => setDetailId(activeDeliveries[0].id)}
            className="w-full bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center gap-3 active:opacity-80 transition-opacity text-left"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-white text-xl animate-pulse"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                local_shipping
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label font-bold text-primary text-sm">Entrega en curso</p>
              <p className="font-body text-on-surface-variant text-xs truncate">
                {activeDeliveries[0].dropoff_address ?? 'Destino pendiente'}
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 px-4 pt-4 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-label font-semibold text-on-surface text-sm">
              {serviceMode === 'entregas' ? 'Disponibles en tu zona' : 'Solicitudes de transporte'}
            </h2>
            {serviceMode === 'entregas' && cargoCapability && (
              <span className={`font-label text-[10px] font-bold px-2 py-0.5 rounded-full ${
                cargoCapability === 'heavy'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              }`}>
                {cargoCapability === 'heavy' ? '🚛 Pesados' : '🛵 Ligeros'}
              </span>
            )}
          </div>
          {serviceMode === 'entregas' && poolDeliveries.length > 0 && (
            <span className="font-body text-xs text-on-surface-variant">{poolDeliveries.length} disponibles</span>
          )}
        </div>

        {serviceMode === 'entregas' && (
          <>
            {poolLoading ? (
              <DeliverySkeleton count={2} />
            ) : poolDeliveries.length === 0 ? (
              <EmptyZone />
            ) : (
              poolDeliveries.map((d) => (
                <JobCard
                  key={d.id}
                  delivery={d}
                  onAccept={setDetailId}
                  distanceM={
                    geo.position && d.pickup_lat != null && d.pickup_lng != null
                      ? haversineDistance(geo.position.lat, geo.position.lng, d.pickup_lat, d.pickup_lng)
                      : undefined
                  }
                />
              ))
            )}
          </>
        )}

        {serviceMode === 'transporte' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[32px] text-on-surface-variant/40"
                style={{ fontVariationSettings: "'FILL' 1" }}
                aria-hidden="true"
              >
                local_shipping
              </span>
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface/70 text-base mb-1">Transporte directo</p>
              <p className="font-body text-sm text-on-surface-variant/60 max-w-xs">
                Las solicitudes de camión y volqueta aparecerán aquí. Próximamente disponible.
              </p>
            </div>
            <span className="font-label font-bold text-[11px] text-on-surface-variant bg-surface-container px-3 py-1 rounded-full uppercase tracking-wider">
              Próximamente
            </span>
          </div>
        )}

        {serviceMode === 'entregas' && !myLoading && activeDeliveries.length > 0 && (
          <div className="mt-2">
            <h2 className="font-label font-semibold text-on-surface text-sm mb-3">En curso</h2>
            {activeDeliveries.map((d) => (
              <DeliveryCard key={d.id} delivery={d} onClick={setDetailId} asListItem />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyZone() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40" aria-hidden="true">
          local_shipping
        </span>
      </div>
      <div>
        <p className="font-headline font-bold text-on-surface/70 text-base mb-1">Sin entregas cerca</p>
        <p className="font-body text-sm text-on-surface-variant/60 max-w-xs">
          Nuevas solicitudes aparecerán aquí en tiempo real.
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-body text-xs text-on-surface-variant/60">Radar activo</span>
      </div>
    </div>
  )
}
