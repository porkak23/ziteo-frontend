import { IconMoto, IconCamion } from './VehicleIcons'
import type { UnifiedJob } from '../types/jobTypes'

interface JobFocusCardProps {
  job: UnifiedJob
  onAccept: () => void
  onSkip: () => void
  isAccepting: boolean
}

export function JobFocusCard({ job, onAccept, onSkip, isAccepting }: JobFocusCardProps) {
  const isHeavy = job.cargoType === 'heavy'

  return (
    <div className="bg-surface rounded-3xl border border-outline-variant overflow-hidden">
      {/* Type + cargo chips */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-2 border-b border-outline-variant/50">
        <span className={`flex items-center gap-1.5 font-label text-xs font-bold px-2.5 py-1 rounded-full ${
          job.kind === 'delivery'
            ? 'bg-primary/10 text-primary'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
        }`}>
          <span className="material-symbols-outlined text-sm leading-none"
            style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
            {job.kind === 'delivery' ? 'package_2' : 'local_shipping'}
          </span>
          {job.kind === 'delivery' ? 'Entrega' : 'Transporte'}
        </span>
        <span className={`flex items-center gap-1 font-label text-xs font-bold px-2.5 py-1 rounded-full ${
          isHeavy
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            : 'bg-surface-container text-on-surface-variant'
        }`}>
          {isHeavy ? <IconCamion size={13} /> : <IconMoto size={13} />}
          {isHeavy ? 'Pesado' : 'Ligero'}
        </span>
        <span className="ml-auto font-headline font-black text-primary text-2xl">{job.feeLabel}</span>
      </div>

      {/* Route */}
      <div className="px-4 py-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center gap-0.5 shrink-0 mt-1">
            <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
            <div className="w-0.5 h-6 bg-outline-variant" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Recoger en</p>
            <p className="font-body text-sm text-on-surface leading-tight">{job.pickupAddress ?? 'Dirección de recojo'}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-1">
            <div className="w-3 h-3 rounded-full bg-error border-2 border-error/30" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Entregar en</p>
            <p className="font-body text-sm text-on-surface leading-tight">{job.dropoffAddress ?? 'Dirección de entrega'}</p>
          </div>
        </div>
        {job.kind === 'transport' && job.description && (
          <p className="font-body text-xs text-on-surface-variant bg-surface-container rounded-xl px-3 py-2 leading-relaxed">
            {job.description}
          </p>
        )}
        {job.kind === 'delivery' && job.distanceKm != null && (
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">schedule</span>
            <span className="font-body text-xs">~{Math.round(job.distanceKm * 4)} min estimado · {job.distanceKm} km</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-5 flex flex-col gap-2">
        <button
          onClick={onAccept}
          disabled={isAccepting}
          className="w-full bg-primary text-on-primary font-label font-bold text-lg py-[18px] rounded-2xl active:opacity-80 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ minHeight: 72 }}
          aria-label="Aceptar trabajo"
        >
          {isAccepting ? (
            <span className="material-symbols-outlined text-2xl animate-spin" aria-hidden="true">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>
          )}
          {isAccepting ? 'Aceptando...' : 'Aceptar'}
        </button>
        <button
          onClick={onSkip}
          disabled={isAccepting}
          className="w-full text-on-surface-variant font-label font-semibold text-sm py-3 rounded-2xl border border-outline-variant active:opacity-60 transition-opacity disabled:opacity-40"
        >
          Ver siguiente
        </button>
      </div>
    </div>
  )
}
