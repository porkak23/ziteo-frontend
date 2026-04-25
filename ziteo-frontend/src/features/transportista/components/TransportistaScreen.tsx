import { useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { usePendingDeliveries, useMyDeliveries } from '../hooks/useDeliveries'
import { useDriverEarnings } from '../hooks/useDriverEarnings'
import { DeliveryCard, DeliverySkeleton, deliveryFee } from './DeliveryCard'
import { DeliveryDetailScreen } from './DeliveryDetailScreen'
import type { Delivery } from '../types/deliveryTypes'

type ServiceMode = 'entregas' | 'transporte'

// ─── Radar visualization ──────────────────────────────────────────────────────

function RadarPulse({ jobCount }: { jobCount: number }) {
  const dots = [
    { x: 62, y: 28, size: 6 },
    { x: 78, y: 58, size: 5 },
    { x: 55, y: 72, size: 7 },
    { x: 30, y: 55, size: 5 },
    { x: 38, y: 30, size: 6 },
    { x: 70, y: 80, size: 4 },
    { x: 20, y: 70, size: 5 },
  ].slice(0, Math.max(1, Math.min(jobCount, 7)))

  return (
    <div
      className="relative w-full aspect-[2/1] overflow-hidden"
      role="img"
      aria-label={`Radar de zona: ${jobCount} trabajo${jobCount !== 1 ? 's' : ''} disponible${jobCount !== 1 ? 's' : ''} cerca`}
    >
      {/* Dark bg */}
      <div className="absolute inset-0 bg-[--color-driver-bg]" />

      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 50" preserveAspectRatio="none">
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="50" stroke="white" strokeWidth="0.2" />
        ))}
        {[10, 20, 30, 40].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeWidth="0.2" />
        ))}
      </svg>

      {/* Radar arcs + pulse rings */}
      <div className="absolute inset-0 flex items-end justify-center">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="xMidYMax meet">
          {/* Static concentric arcs */}
          {[30, 55, 80].map((r, i) => (
            <circle
              key={r}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="0.6"
              opacity={0.25 - i * 0.05}
            />
          ))}
          {/* Pulse rings — transform: scale() is cross-browser safe; animating SVG `r` is not */}
          <circle
            cx="100" cy="100" r="20"
            fill="none" stroke="var(--color-primary)" strokeWidth="1"
            style={{ transformOrigin: '100px 100px', animation: 'radarRingScale1 2.4s ease-out infinite' }}
          />
          <circle
            cx="100" cy="100" r="20"
            fill="none" stroke="var(--color-primary)" strokeWidth="0.8"
            style={{ transformOrigin: '100px 100px', animation: 'radarRingScale2 2.4s ease-out infinite 0.8s' }}
          />
          <circle
            cx="100" cy="100" r="20"
            fill="none" stroke="var(--color-primary)" strokeWidth="0.6"
            style={{ transformOrigin: '100px 100px', animation: 'radarRingScale3 2.4s ease-out infinite 1.6s' }}
          />
          {/* Job dots */}
          {dots.map((dot, i) => (
            <g key={i}>
              <circle cx={dot.x * 2} cy={dot.y * 2} r={dot.size * 0.7} fill="var(--color-primary)" opacity="0.9" />
              <circle cx={dot.x * 2} cy={dot.y * 2} r={dot.size * 0.7 + 2} fill="none" stroke="var(--color-primary)" strokeWidth="0.5" opacity="0.4" />
            </g>
          ))}
          {/* Driver center */}
          <circle cx="100" cy="100" r="5" fill="var(--color-primary)" />
          <circle cx="100" cy="100" r="3" fill="white" />
        </svg>
      </div>

      {/* Overlay gradient at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[--color-driver-bg] to-transparent" />

      {/* Jobs count badge */}
      <div className="absolute top-3 right-3 bg-primary rounded-full px-3 py-1 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span className="font-label font-bold text-on-primary text-xs">{jobCount} trabajo{jobCount !== 1 ? 's' : ''} cerca</span>
      </div>

      {/* Location label */}
      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
        <span className="material-symbols-outlined text-white/60 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
        <span className="font-body text-white/60 text-xs">Tu zona</span>
      </div>
    </div>
  )
}

// ─── Job card (enhanced) ──────────────────────────────────────────────────────

function JobCard({
  delivery,
  onAccept,
  showAccept = true,
}: {
  delivery: Delivery
  onAccept?: (id: string) => void
  showAccept?: boolean
}) {
  const fee = deliveryFee(delivery)
  const distanceLabel = delivery.distance_km != null ? `${delivery.distance_km} km` : '~5 km'

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
      {/* Fee header bar */}
      <div className="bg-primary/5 border-b border-outline-variant/50 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
          <span className="font-label font-semibold text-on-surface text-sm">
            Entrega #{delivery.id.slice(0, 6).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-headline font-black text-primary text-lg">{fee.label}</span>
          {delivery.distance_km != null && (
            <span className="bg-primary/10 text-primary font-label font-semibold text-xs px-2 py-0.5 rounded-full">
              {distanceLabel}
            </span>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="px-4 py-3 flex flex-col gap-2">
        {/* Pickup */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
            <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
            <div className="w-0.5 h-5 bg-outline-variant" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-[11px] text-on-surface-variant uppercase tracking-wider mb-0.5">Recoger en</p>
            <p className="font-body text-sm text-on-surface leading-tight">
              {delivery.pickup_address ?? 'Dirección de recogida'}
            </p>
          </div>
        </div>
        {/* Dropoff */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center shrink-0 pt-0.5">
            <div className="w-3 h-3 rounded-full bg-error border-2 border-error/30" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-[11px] text-on-surface-variant uppercase tracking-wider mb-0.5">Entregar en</p>
            <p className="font-body text-sm text-on-surface leading-tight">
              {delivery.dropoff_address ?? 'Dirección de entrega'}
            </p>
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <div className="flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span className="font-body text-xs">
            ~{delivery.distance_km != null ? Math.round(delivery.distance_km * 4) : 25} min
          </span>
        </div>
      </div>

      {/* Accept button */}
      {showAccept && onAccept && (
        <div className="px-4 pb-4">
          <button
            onClick={() => onAccept(delivery.id)}
            className="w-full bg-primary text-on-primary font-label font-bold text-base py-3.5 rounded-2xl active:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            Aceptar viaje
          </button>
        </div>
      )}
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

  const { data: poolDeliveries = [], isLoading: poolLoading } = usePendingDeliveries()
  const { data: myDeliveries = [], isLoading: myLoading } = useMyDeliveries()
  const { today } = useDriverEarnings()

  const activeDeliveries = myDeliveries.filter(
    (d) => d.status === 'accepted' || d.status === 'in_transit'
  )
  const completedToday = myDeliveries.filter((d) => d.status === 'delivered').length

  if (detailId) {
    return <DeliveryDetailScreen deliveryId={detailId} onBack={() => setDetailId(null)} />
  }

  // ── Offline state ─────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div className="flex flex-col min-h-dvh bg-[--color-driver-bg]">
        {/* Dark header */}
        <div className="px-4 pt-6 pb-4 flex items-center justify-between">
          <div>
            <p className="font-body text-white/50 text-xs">Hola,</p>
            <h1 className="font-headline font-black text-white text-2xl leading-tight">{firstName}</h1>
          </div>
          <button
            onClick={() => {}}
            className="flex items-center gap-1.5 bg-surface/10 border border-white/10 rounded-full px-3 py-1.5"
          >
            <span className="material-symbols-outlined text-white/60 text-sm">person</span>
            <span className="font-label text-white/60 text-xs">Perfil</span>
          </button>
        </div>

        {/* Offline radar */}
        <div className="relative mx-4 rounded-2xl overflow-hidden">
          <div className="w-full aspect-[2/1] bg-[--color-driver-surface] flex items-center justify-center relative">
            <div className="text-center relative z-10">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-white/30 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_shipping
                </span>
              </div>
              <p className="font-headline font-black text-white/30 text-lg">Offline</p>
              <p className="font-body text-white/20 text-sm">No estás recibiendo trabajos</p>
            </div>
            {/* Static concentric circles */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              {[60, 100, 140].map((size) => (
                <div
                  key={size}
                  className="absolute rounded-full border border-white"
                  style={{ width: size, height: size }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Go online CTA */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6 py-8">
          <div className="text-center">
            <h2 className="font-headline font-black text-white text-3xl mb-2">¿Listo para trabajar?</h2>
            <p className="font-body text-white/50 text-sm">
              Actívate para recibir solicitudes de entrega y transporte en tu zona
            </p>
          </div>

          <button
            onClick={() => setIsOnline(true)}
            className="w-full max-w-xs bg-primary text-on-primary font-headline font-black text-xl py-5 rounded-2xl active:opacity-80 transition-opacity shadow-lg shadow-primary/30"
          >
            Conectarme
          </button>

          {/* Quick stats from history */}
          {completedToday > 0 || today.net > 0 ? (
            <div className="flex gap-4">
              <div className="text-center">
                <p className="font-headline font-black text-white text-xl">{completedToday}</p>
                <p className="font-body text-white/40 text-xs">hoy</p>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <p className="font-headline font-black text-white text-xl">Bs. {today.net.toFixed(0)}</p>
                <p className="font-body text-white/40 text-xs">ganado</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  // ── Online state ─────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-dvh bg-background">

      {/* ── Dark hero ──────────────────────────────────────────────────────── */}
      <div className="bg-[--color-driver-bg]">
        {/* Top bar */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p className="font-body text-white/50 text-xs">Conectado como</p>
            <h1 className="font-headline font-black text-white text-xl leading-tight">{firstName}</h1>
          </div>
          {/* Online toggle */}
          <button
            onClick={() => setIsOnline(false)}
            aria-pressed={isOnline}
            aria-label="Desconectarme"
            className="flex items-center gap-2 bg-primary/20 border border-primary/40 rounded-full px-3 py-1.5 active:opacity-80"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label font-bold text-primary text-xs">En línea</span>
          </button>
        </div>

        {/* Earnings strip */}
        <div className="flex items-center gap-4 px-4 pb-4">
          <div className="flex-1 bg-white/5 rounded-2xl p-3">
            <p className="font-body text-white/40 text-[10px] uppercase tracking-wider">Hoy</p>
            <p className="font-headline font-black text-white text-xl">Bs. {today.net.toFixed(0)}</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl p-3">
            <p className="font-body text-white/40 text-[10px] uppercase tracking-wider">Viajes</p>
            <p className="font-headline font-black text-white text-xl">{completedToday}</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl p-3">
            <p className="font-body text-white/40 text-[10px] uppercase tracking-wider">En curso</p>
            <p className="font-headline font-black text-white text-xl">{activeDeliveries.length}</p>
          </div>
        </div>

        {/* Radar */}
        <RadarPulse jobCount={serviceMode === 'entregas' ? poolDeliveries.length : 0} />
      </div>

      {/* ── Service mode selector ─────────────────────────────────────────── */}
      <div className="bg-surface border-b border-outline-variant px-4 py-3">
        <p className="font-body text-[10px] uppercase tracking-[0.12em] text-on-surface-variant/60 font-semibold mb-2">
          ¿Qué tipo de trabajo buscas?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setServiceMode('entregas')}
            aria-pressed={serviceMode === 'entregas'}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-label font-semibold text-sm transition-all ${
              serviceMode === 'entregas'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container text-on-surface-variant border-outline-variant'
            }`}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              package_2
            </span>
            Entregas
            {poolDeliveries.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                serviceMode === 'entregas' ? 'bg-on-primary/20 text-on-primary' : 'bg-surface text-on-surface-variant'
              }`}>
                {poolDeliveries.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setServiceMode('transporte')}
            aria-pressed={serviceMode === 'transporte'}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border font-label font-semibold text-sm transition-all ${
              serviceMode === 'transporte'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container text-on-surface-variant border-outline-variant'
            }`}
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_shipping
            </span>
            Transporte
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              serviceMode === 'transporte' ? 'bg-on-primary/20 text-on-primary' : 'bg-surface text-on-surface-variant'
            }`}>
              0
            </span>
          </button>
        </div>
      </div>

      {/* ── Active delivery banner (if any) ──────────────────────────────── */}
      {activeDeliveries.length > 0 && (
        <div className="mx-4 mt-4">
          <button
            onClick={() => setDetailId(activeDeliveries[0].id)}
            className="w-full bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center gap-3 active:opacity-80 transition-opacity text-left"
          >
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-xl animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_shipping
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-label font-bold text-primary text-sm">Entrega en curso</p>
              <p className="font-body text-on-surface-variant text-xs truncate">
                {activeDeliveries[0].dropoff_address ?? 'Destino pendiente'}
              </p>
            </div>
            <span className="material-symbols-outlined text-primary text-xl">chevron_right</span>
          </button>
        </div>
      )}

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 pt-4 pb-24 flex flex-col gap-3">

        {/* Section title */}
        <div className="flex items-center justify-between">
          <h2 className="font-label font-semibold text-on-surface text-sm">
            {serviceMode === 'entregas' ? 'Entregas disponibles en tu zona' : 'Solicitudes de transporte'}
          </h2>
          {serviceMode === 'entregas' && poolDeliveries.length > 0 && (
            <span className="font-body text-xs text-on-surface-variant">{poolDeliveries.length} disponibles</span>
          )}
        </div>

        {/* ── Entregas mode ──────────────────────────────────────────────── */}
        {serviceMode === 'entregas' && (
          <>
            {poolLoading ? (
              <DeliverySkeleton count={2} />
            ) : poolDeliveries.length === 0 ? (
              <EmptyZone
                icon="local_shipping"
                title="Sin entregas cerca"
                subtitle="Nuevos pedidos aparecerán aquí en tiempo real. El radar está activo."
              />
            ) : (
              poolDeliveries.map((d) => (
                <JobCard
                  key={d.id}
                  delivery={d}
                  onAccept={setDetailId}
                  showAccept
                />
              ))
            )}
          </>
        )}

        {/* ── Transporte mode ────────────────────────────────────────────── */}
        {serviceMode === 'transporte' && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40" style={{ fontVariationSettings: "'FILL' 1" }}>
                local_shipping
              </span>
            </div>
            <div>
              <p className="font-headline font-bold text-on-surface/70 text-base mb-1">Transporte directo</p>
              <p className="font-body text-sm text-on-surface-variant/60 max-w-xs">
                Las solicitudes de camión y volqueta de constructores aparecerán aquí. Próximamente disponible.
              </p>
            </div>
            <span className="font-label font-bold text-[11px] text-on-surface-variant bg-surface-container px-3 py-1 rounded-full uppercase tracking-wider">
              Próximamente
            </span>
          </div>
        )}

        {/* ── My active deliveries section ───────────────────────────────── */}
        {serviceMode === 'entregas' && activeDeliveries.length > 0 && (
          <div className="mt-2">
            <h2 className="font-label font-semibold text-on-surface text-sm mb-3">En curso</h2>
            {myLoading ? (
              <DeliverySkeleton count={1} />
            ) : (
              activeDeliveries.map((d) => (
                <DeliveryCard key={d.id} delivery={d} onClick={setDetailId} asListItem />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyZone({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[32px] text-on-surface-variant/40">{icon}</span>
      </div>
      <div>
        <p className="font-headline font-bold text-on-surface/70 text-base mb-1">{title}</p>
        <p className="font-body text-sm text-on-surface-variant/60 max-w-xs">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-body text-xs text-on-surface-variant/60">Radar activo</span>
      </div>
    </div>
  )
}
