import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { useMyDeliveries } from '../hooks/useDeliveries'
import { useDriverEarnings } from '../hooks/useDriverEarnings'
import { useDriverProfile, useSaveVehicleType } from '../hooks/useDriverProfile'
import { useGeolocation } from '../../../shared/hooks/useGeolocation'
import { useUnifiedPool } from '../hooks/useUnifiedPool'
import { DeliveryDetailScreen } from './DeliveryDetailScreen'
import { RadarActive } from './RadarActive'
import { JobFocusCard } from './JobFocusCard'
import { ActiveJobsList } from './ActiveJobsList'
import { IconMoto, IconCamioneta, IconPickup, IconCamion } from './VehicleIcons'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import type { VehicleType } from '../types/deliveryTypes'
import { vehicleToCargoCapability } from '../types/deliveryTypes'

// ─── VehicleSetupBanner ───────────────────────────────────────────────────────

const VEHICLE_OPTS: { value: VehicleType; Icon: (p: { color: string; size: number }) => React.ReactElement; label: string }[] = [
  { value: 'moto',      Icon: IconMoto,      label: 'Moto' },
  { value: 'camioneta', Icon: IconCamioneta, label: 'Camioneta' },
  { value: 'camion',    Icon: IconCamion,    label: 'Camión' },
  { value: 'pickup',    Icon: IconPickup,    label: 'Pickup' },
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
          <p className="font-body text-xs text-on-surface-variant mt-0.5">Verás solo pedidos compatibles con tu tipo de carga</p>
        </div>
        <button onClick={() => setDismissed(true)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container" aria-label="Cerrar">
          <span className="material-symbols-outlined text-on-surface-variant text-base" aria-hidden="true">close</span>
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {VEHICLE_OPTS.map((v) => (
          <button key={v.value} type="button" disabled={isPending} onClick={() => save(v.value)}
            className="flex flex-col items-center gap-1 py-2 rounded-xl border border-outline-variant bg-surface-container active:opacity-70 disabled:opacity-50 text-center">
            <v.Icon color="currentColor" size={22} />
            <span className="font-label text-[11px] font-semibold text-on-surface">{v.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── EmptyZone ────────────────────────────────────────────────────────────────

function EmptyZone() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
        <span className="material-symbols-outlined text-[28px] text-on-surface-variant/40" aria-hidden="true">local_shipping</span>
      </div>
      <div>
        <p className="font-headline font-bold text-on-surface/70 text-base mb-1">Sin trabajos cerca</p>
        <p className="font-body text-sm text-on-surface-variant/60 max-w-xs">Nuevas solicitudes aparecerán aquí en tiempo real.</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="font-body text-xs text-on-surface-variant/60">Radar activo</span>
      </div>
    </div>
  )
}

// ─── TransportistaScreen ──────────────────────────────────────────────────────

export function TransportistaScreen() {
  const user      = useAuthStore((s) => s.user)
  const firstName = (user?.name ?? '').split(' ')[0] || 'Chofer'

  const [isOnline, setIsOnline]   = useState(false)
  const [detailId, setDetailId]   = useState<string | null>(null)
  const [poolIndex, setPoolIndex] = useState(0)
  const [isAccepting, setAccepting] = useState(false)

  const { data: driverProfile }    = useDriverProfile()
  const cargoCapability            = vehicleToCargoCapability(driverProfile?.vehicle_type ?? null)
  const { data: myDeliveries = [] } = useMyDeliveries()
  const { today }                  = useDriverEarnings()
  const geo                        = useGeolocation(isOnline)
  const { toasts, showToast, removeToast } = useToast()

  const { pool, isLoading, accept } = useUnifiedPool(cargoCapability, geo.position)

  const completedToday  = myDeliveries.filter((d) => d.status === 'delivered').length
  const activeDeliveries = myDeliveries.filter((d) => d.status === 'accepted' || d.status === 'in_transit')

  const currentJob = pool[poolIndex] ?? null
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

  useEffect(() => { setPoolIndex(0) }, [pool.length])

  if (detailId) {
    return <DeliveryDetailScreen deliveryId={detailId} onBack={() => setDetailId(null)} />
  }

  // ── OFFLINE ──────────────────────────────────────────────────────────────
  if (!isOnline) {
    return (
      <div data-testid="radar-offline-panel" className="flex flex-col min-h-dvh bg-[--color-driver-bg] pb-16">
        <div className="px-5 pt-8 pb-4 flex items-start justify-between">
          <div>
            <p className="font-body text-white/70 text-xs tracking-wider uppercase mb-1">Transportista</p>
            <h1 className="font-headline font-black text-white text-3xl leading-none tracking-tight">{firstName}</h1>
          </div>
          <div data-testid="radar-status-badge" className="flex items-center gap-1.5 bg-error/15 border border-error/30 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            <span className="font-label font-bold text-error text-xs">Offline</span>
          </div>
        </div>
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
                <span className="material-symbols-outlined text-white/25 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">local_shipping</span>
              </div>
              <p className="font-label font-bold text-white/65 text-sm">Radar inactivo</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[--color-driver-surface] to-transparent" />
          </div>
        </div>
        {(completedToday > 0 || today.net > 0) && (
          <div className="flex gap-3 mx-5 mt-4">
            <div className="flex-1 bg-white/5 rounded-2xl px-4 py-3 text-center border border-white/8">
              <p className="font-headline font-black text-white text-2xl">{completedToday}</p>
              <p className="font-body text-white/70 text-xs mt-0.5">viajes hoy</p>
            </div>
            <div className="flex-1 bg-white/5 rounded-2xl px-4 py-3 text-center border border-white/8">
              <p className="font-headline font-black text-white text-2xl">Bs. {today.net.toFixed(0)}</p>
              <p className="font-body text-white/70 text-xs mt-0.5">ganado hoy</p>
            </div>
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-4 text-center gap-3">
          <p className="font-headline font-black text-white text-2xl leading-tight">¿Listo para trabajar?</p>
          <p className="font-body text-white/70 text-sm max-w-xs leading-relaxed">Actívate para ver entregas y transportes disponibles en tu zona</p>
        </div>
        <div className="px-5 pb-10 flex flex-col items-center gap-4">
          <button data-testid="radar-activar-btn" onClick={() => setIsOnline(true)}
            aria-label="Conectarme para recibir trabajos"
            className="w-full bg-primary text-on-primary font-headline font-black text-2xl tracking-tight py-6 rounded-3xl active:scale-[0.98] transition-[transform,opacity] active:opacity-90">
            <span className="flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">power_settings_new</span>
              CONECTARME
            </span>
          </button>
          <p className="font-body text-white/65 text-xs text-center">Se usará tu ubicación mientras estés conectado</p>
        </div>
      </div>
    )
  }

  // ── ONLINE ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-dvh bg-background pb-16">
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="bg-[--color-driver-bg]">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
          <div>
            <p data-testid="radar-status-badge" className="font-body text-white/70 text-xs">Conectado</p>
            <div className="flex items-center gap-2">
              <h1 className="font-headline font-black text-white text-xl leading-tight">{firstName}</h1>
              {driverProfile?.vehicle_type && (
                <span className="font-label text-[11px] font-semibold bg-white/10 text-white/70 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                    {driverProfile.vehicle_type === 'moto' ? 'two_wheeler' : 'local_shipping'}
                  </span>
                  {driverProfile.vehicle_type === 'moto' ? 'Moto' : driverProfile.vehicle_type === 'camion' ? 'Camión' : driverProfile.vehicle_type === 'camioneta' ? 'Camioneta' : 'Pickup'}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setIsOnline(false)} aria-pressed={true} aria-label="Desconectarme"
            className="flex items-center gap-2 bg-primary/15 border border-primary/40 rounded-full px-4 py-2 active:opacity-80">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-label font-bold text-primary text-sm">En línea</span>
            <span className="material-symbols-outlined text-on-surface-variant text-base" aria-hidden="true">close</span>
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {[
            { label: 'Hoy',     value: `Bs. ${today.net.toFixed(0)}` },
            { label: 'Viajes',  value: String(completedToday) },
            { label: 'En curso', value: String(activeDeliveries.length) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/5 rounded-2xl px-3 py-2.5 text-center border border-white/8">
              <p className="font-body text-white/70 text-[10px] uppercase tracking-wider">{label}</p>
              <p className="font-headline font-black text-white text-lg mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        <RadarActive jobCount={pool.length} hasLocation={geo.position !== null} />
      </div>

      {driverProfile !== undefined && driverProfile.vehicle_type === null && <VehicleSetupBanner />}

      <div className="flex-1 px-4 pt-4 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-label font-semibold text-on-surface text-sm">Disponibles en tu zona</h2>
          {pool.length > 1 && (
            <span className="font-body text-xs text-on-surface-variant">{poolIndex + 1} de {pool.length}</span>
          )}
        </div>

        {isLoading ? (
          <div className="rounded-3xl bg-surface-container h-48 animate-pulse" />
        ) : currentJob ? (
          <JobFocusCard
            job={currentJob}
            isAccepting={isAccepting}
            onAccept={() => {
              setAccepting(true)
              accept(currentJob, {
                onSuccess: () => { setAccepting(false); setPoolIndex(0) },
                onError: (e) => { setAccepting(false); showToast(e.message, 'error') },
              })
            }}
            onSkip={() => setPoolIndex((i) => (i + 1) % pool.length)}
          />
        ) : (
          <EmptyZone />
        )}

        <ActiveJobsList onOpenDelivery={setDetailId} />
      </div>
    </div>
  )
}
