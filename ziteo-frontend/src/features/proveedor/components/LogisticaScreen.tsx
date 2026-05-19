import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { CIUDADES_ACTIVAS } from '../../../shared/constants/geography'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LogisticaProfile {
  min_order_amount: number | null
  delivery_time_hours: number | null
  free_shipping_threshold: number | null
  service_zones: string[] | null
}

const BOLIVIAN_CITIES = CIUDADES_ACTIVAS

const DELIVERY_SUGGESTIONS = [
  { label: '12 h', value: 12 },
  { label: '24 h', value: 24 },
  { label: '48 h', value: 48 },
  { label: '72 h', value: 72 },
]

// ─── Completeness helper ──────────────────────────────────────────────────────

function calcCompleteness(profile: LogisticaProfile): number {
  let filled = 0
  if (profile.min_order_amount != null && profile.min_order_amount > 0) filled++
  if (profile.delivery_time_hours != null && profile.delivery_time_hours > 0) filled++
  if (profile.free_shipping_threshold != null && profile.free_shipping_threshold > 0) filled++
  if (profile.service_zones && profile.service_zones.length > 0) filled++
  return Math.round((filled / 4) * 100)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useLogisticaProfile(userId: string) {
  return useQuery<LogisticaProfile>({
    queryKey: ['logistica-profile', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('min_order_amount, delivery_time_hours, free_shipping_threshold, service_zones')
        .eq('user_id', userId)
        .eq('role', 'proveedor')
        .maybeSingle()
      if (error) throw error
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any) ?? {
        min_order_amount: null,
        delivery_time_hours: null,
        free_shipping_threshold: null,
        service_zones: [],
      }
    },
  })
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LogisticaScreen() {
  const user = useAuthStore((s) => s.user)
  const userId = user?.user_id ?? ''
  const { toasts, showToast, removeToast } = useToast()
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useLogisticaProfile(userId)

  // Local form state
  const [minOrder, setMinOrder] = useState('')
  const [deliveryHours, setDeliveryHours] = useState('')
  const [freeShipping, setFreeShipping] = useState('')
  const [zones, setZones] = useState<string[]>([])

  // Hydrate form once data loads
  useEffect(() => {
    if (!profile) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinOrder(profile.min_order_amount != null ? String(profile.min_order_amount) : '')
    setDeliveryHours(profile.delivery_time_hours != null ? String(profile.delivery_time_hours) : '')
    setFreeShipping(profile.free_shipping_threshold != null ? String(profile.free_shipping_threshold) : '')
    setZones(profile.service_zones ?? [])
  }, [profile])

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_roles')
        .update({
          min_order_amount: minOrder ? parseFloat(minOrder) : null,
          delivery_time_hours: deliveryHours ? parseInt(deliveryHours, 10) : null,
          free_shipping_threshold: freeShipping ? parseFloat(freeShipping) : null,
          service_zones: zones.length > 0 ? zones : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .eq('user_id', userId)
        .eq('role', 'proveedor')
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['logistica-profile', userId] })
      showToast('Condiciones de servicio guardadas', 'success')
    },
    onError: () => {
      showToast('Error al guardar los cambios', 'error')
    },
  })

  const toggleZone = (city: string) => {
    setZones((prev) =>
      prev.includes(city) ? prev.filter((z) => z !== city) : [...prev, city]
    )
  }

  // Derive completeness from current form values (not saved profile)
  const currentProfile: LogisticaProfile = {
    min_order_amount: minOrder ? parseFloat(minOrder) : null,
    delivery_time_hours: deliveryHours ? parseInt(deliveryHours, 10) : null,
    free_shipping_threshold: freeShipping ? parseFloat(freeShipping) : null,
    service_zones: zones,
  }
  const completeness = calcCompleteness(currentProfile)
  const isComplete = completeness === 100

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-container animate-pulse rounded-2xl h-20" />
        ))}
      </div>
    )
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex flex-col gap-5 py-4 pb-28 px-4">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-1">
          <h2 className="font-headline font-extrabold text-2xl text-on-surface">
            Logística
          </h2>
          <p className="font-body text-sm text-on-surface-variant">
            Define las condiciones de tu servicio como proveedor
          </p>
        </div>

        {/* ── Completeness indicator ─────────────────────────────────────── */}
        <div className={`rounded-2xl p-4 flex items-center gap-4 border ${
          isComplete
            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
            : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: isComplete ? '#dcfce7' : '#fef3c7' }}>
            <span className={`material-symbols-outlined text-xl ${isComplete ? 'text-green-700' : 'text-amber-700'}`}
              style={{ fontVariationSettings: "'FILL' 1" }}>
              {isComplete ? 'verified' : 'warning'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-label font-semibold text-sm ${isComplete ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}`}>
              {isComplete ? 'Perfil completo' : 'Perfil incompleto'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-600' : 'bg-amber-500'}`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className={`font-label text-xs font-semibold ${isComplete ? 'text-green-700' : 'text-amber-700'}`}>
                {completeness}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Info banner ────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-primary/[0.06] border border-primary/20 px-4 py-3 flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-[18px] mt-0.5 shrink-0"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            info
          </span>
          <p className="font-body text-xs text-on-surface-variant leading-relaxed">
            Los proveedores con condiciones completas <span className="font-semibold text-primary">aparecen primero en la búsqueda</span> y generan más confianza en los compradores.
          </p>
        </div>

        {/* ── Pedido mínimo ──────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                shopping_cart
              </span>
            </div>
            <div>
              <p className="font-label font-semibold text-on-surface text-sm">Pedido mínimo</p>
              <p className="font-body text-xs text-on-surface-variant">Monto mínimo para aceptar un pedido</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-surface-container rounded-2xl px-4 py-2.5">
            <span className="font-label font-semibold text-on-surface-variant text-sm">Bs.</span>
            <input
              type="number"
              min="0"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="flex-1 bg-transparent outline-none font-body text-sm text-on-surface placeholder:text-on-surface-variant/40"
              placeholder="ej: 200"
            />
          </div>
        </div>

        {/* ── Tiempo de entrega ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                schedule
              </span>
            </div>
            <div>
              <p className="font-label font-semibold text-on-surface text-sm">Tiempo de entrega</p>
              <p className="font-body text-xs text-on-surface-variant">Horas prometidas desde la confirmación</p>
            </div>
          </div>

          {/* Quick suggestion chips */}
          <div className="flex gap-2 flex-wrap">
            {DELIVERY_SUGGESTIONS.map((s) => {
              const isSelected = deliveryHours === String(s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setDeliveryHours(String(s.value))}
                  className={`px-4 py-1.5 rounded-full border font-label text-xs font-semibold transition-[background-color,border-color,color] ${
                    isSelected
                      ? 'bg-primary border-primary text-on-primary'
                      : 'bg-surface-container border-outline-variant text-on-surface-variant'
                  }`}
                >
                  {s.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 bg-surface-container rounded-2xl px-4 py-2.5">
            <input
              type="number"
              min="1"
              value={deliveryHours}
              onChange={(e) => setDeliveryHours(e.target.value)}
              className="flex-1 bg-transparent outline-none font-body text-sm text-on-surface placeholder:text-on-surface-variant/40"
              placeholder="ej: 24"
            />
            <span className="font-label text-on-surface-variant text-sm">horas</span>
          </div>
        </div>

        {/* ── Envío gratis ────────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                local_shipping
              </span>
            </div>
            <div>
              <p className="font-label font-semibold text-on-surface text-sm">Envío gratis sobre</p>
              <p className="font-body text-xs text-on-surface-variant">Umbral para ofrecer envío sin costo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-surface-container rounded-2xl px-4 py-2.5">
            <span className="font-label font-semibold text-on-surface-variant text-sm">Bs.</span>
            <input
              type="number"
              min="0"
              value={freeShipping}
              onChange={(e) => setFreeShipping(e.target.value)}
              className="flex-1 bg-transparent outline-none font-body text-sm text-on-surface placeholder:text-on-surface-variant/40"
              placeholder="ej: 500"
            />
          </div>
        </div>

        {/* ── Zonas de cobertura ─────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl border border-outline-variant p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}>
                location_on
              </span>
            </div>
            <div>
              <p className="font-label font-semibold text-on-surface text-sm">Zonas de cobertura</p>
              <p className="font-body text-xs text-on-surface-variant">Ciudades donde realizas entregas</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {BOLIVIAN_CITIES.map((city) => {
              const isSelected = zones.includes(city)
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => toggleZone(city)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-label text-xs font-semibold transition-[background-color,border-color,color] ${
                    isSelected
                      ? 'bg-primary border-primary text-on-primary'
                      : 'bg-surface-container border-outline-variant text-on-surface-variant'
                  }`}
                >
                  {isSelected && (
                    <span className="material-symbols-outlined text-[12px] leading-none">check</span>
                  )}
                  {city}
                </button>
              )
            })}
          </div>

          {zones.length > 0 && (
            <p className="font-body text-xs text-on-surface-variant">
              {zones.length} {zones.length === 1 ? 'ciudad seleccionada' : 'ciudades seleccionadas'}
            </p>
          )}
        </div>

        {/* ── Save button ────────────────────────────────────────────────────── */}
        <button
          onClick={() => saveProfile()}
          disabled={saving}
          className="w-full bg-primary text-on-primary font-label font-semibold rounded-2xl py-4 disabled:opacity-50 transition-opacity active:opacity-80"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

      </div>
    </>
  )
}
