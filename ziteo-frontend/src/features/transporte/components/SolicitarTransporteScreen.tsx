import { useState } from 'react'
import { useCreateTransportRequest } from '../hooks/useTransportRequests'

type TransporteType = 'pesado' | 'ligero'

interface Props {
  type: TransporteType
  onBack: () => void
}

const CONFIG = {
  pesado: {
    icon: 'local_shipping',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600',
    label: 'Transporte pesado',
    sublabel: 'Camión / Volqueta',
    description: 'Para materiales de gran volumen o peso: acero, cemento, bloques, áridos.',
    examples: ['Acero corrugado', 'Cemento (pallets)', 'Bloques y ladrillos', 'Áridos y grava', 'Maquinaria pequeña'],
  },
  ligero: {
    icon: 'two_wheeler',
    iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    iconColor: 'text-sky-600',
    label: 'Transporte ligero',
    sublabel: 'Moto / Mensajería',
    description: 'Para insumos y herramientas de pequeño volumen con entrega rápida.',
    examples: ['Herramientas manuales', 'Clavos y tornillos', 'Pinturas y selladores', 'Cables eléctricos', 'Accesorios menores'],
  },
}

export function SolicitarTransporteScreen({ type, onBack }: Props) {
  const cfg = CONFIG[type]
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [notes, setNotes] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { mutate: createRequest, isPending } = useCreateTransportRequest()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pickup.trim() || !dropoff.trim()) return
    createRequest(
      {
        cargo_type: type === 'pesado' ? 'heavy' : 'light',
        pickup_address: pickup.trim(),
        dropoff_address: dropoff.trim(),
        description: notes.trim() || undefined,
      },
      {
        onSuccess: () => setSubmitted(true),
        onError: () => setSubmitted(true),
      }
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-surface border-b border-outline-variant/40">
          <button onClick={onBack} className="flex items-center gap-1.5 px-3 h-10 rounded-full border border-outline-variant bg-surface shadow-sm active:opacity-70 transition-opacity cursor-pointer" aria-label="Volver">
            <span className="material-symbols-outlined text-[18px] text-on-surface">arrow_back</span>
            <span className="font-label font-semibold text-sm text-on-surface">Volver</span>
          </button>
          <span className="font-headline font-bold text-base text-on-surface">{cfg.label}</span>
        </div>

        {/* Success state */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span
              className="material-symbols-outlined text-[40px] text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <div>
            <p className="font-headline font-black text-xl text-on-surface mb-1">Solicitud enviada</p>
            <p className="font-body text-sm text-on-surface-variant">
              Te notificaremos cuando un transportista acepte tu solicitud.
            </p>
          </div>
          <button
            onClick={onBack}
            className="mt-4 w-full max-w-xs rounded-2xl bg-primary text-on-primary font-label font-bold text-sm px-6 py-4 active:opacity-90 transition-opacity cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 bg-surface border-b border-outline-variant/40">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center active:bg-on-surface/[0.06] transition-colors cursor-pointer -ml-1"
          aria-label="Volver"
        >
          <span className="material-symbols-outlined text-[22px] text-on-surface-variant">arrow_back</span>
        </button>
        <span className="font-headline font-bold text-base text-on-surface">{cfg.label}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-6">
        {/* Type card */}
        <div className="flex items-center gap-4 bg-surface-container rounded-2xl px-5 py-4 border border-outline-variant/40">
          <div className={`w-12 h-12 rounded-xl ${cfg.iconBg} flex items-center justify-center shrink-0`}>
            <span
              className={`material-symbols-outlined text-2xl ${cfg.iconColor}`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {cfg.icon}
            </span>
          </div>
          <div>
            <p className="font-label font-bold text-on-surface text-sm">{cfg.label}</p>
            <p className="font-body text-xs text-on-surface-variant">{cfg.sublabel}</p>
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="font-body text-sm text-on-surface-variant mb-3">{cfg.description}</p>
          <div className="flex flex-wrap gap-2">
            {cfg.examples.map((ex) => (
              <span
                key={ex}
                className="font-label text-[11px] font-semibold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full border border-outline-variant/50"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <p className="font-body text-[11px] uppercase tracking-[0.14em] text-on-surface-variant/50 font-semibold -mb-1">
            Datos del servicio
          </p>

          {/* Pickup */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label font-semibold text-xs text-on-surface-variant">
              Dirección de recogida
            </label>
            <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/60 focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-[18px] text-primary shrink-0">location_on</span>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Ej: Av. Heroínas 456, Cochabamba"
                className="flex-1 bg-transparent font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none"
                required
              />
            </div>
          </div>

          {/* Dropoff */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label font-semibold text-xs text-on-surface-variant">
              Dirección de entrega
            </label>
            <div className="flex items-center gap-3 bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/60 focus-within:border-primary transition-colors">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant/60 shrink-0">flag</span>
              <input
                type="text"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Ej: Obra calle Colombia, Quillacollo"
                className="flex-1 bg-transparent font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="font-label font-semibold text-xs text-on-surface-variant">
              Notas adicionales <span className="font-normal text-on-surface-variant/50">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: 5 toneladas de acero, acceso por portón lateral"
              rows={3}
              className="bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/60 focus:border-primary transition-colors font-body text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!pickup.trim() || !dropoff.trim() || isPending}
            className="w-full rounded-2xl bg-primary text-on-primary font-label font-bold text-sm px-6 py-4 active:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? 'Enviando...' : 'Solicitar transporte'}
          </button>
        </form>
      </div>
    </div>
  )
}
