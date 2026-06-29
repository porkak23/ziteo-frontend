import { useState } from 'react'
import {
  useMisLicitaciones,
  usePostulantesDeLicitacion,
  useActualizarPostulacion,
  useCerrarLicitacion,
  type Licitacion,
  type LicitacionPostulacion,
} from '../hooks/useLicitaciones'
import { NuevaLicitacionForm } from './NuevaLicitacionForm'
import { MaestroPublicProfile } from '../../maestro/components/MaestroPublicProfile'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { AdBanner } from '../../../shared/components/AdBanner'
import { Z } from '../../../shared/design/tokens'

function StatusBadge({ status }: { status: string }) {
  // Solo 'closed' se considera cerrada; cualquier otro valor (open o legacy
  // inesperado) se trata como abierta para no esconder controles ni mal-etiquetar.
  if (status === 'closed') {
    return (
      <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-label font-semibold">
        Cerrada
      </span>
    )
  }
  return (
    <span className="px-2 py-0.5 rounded-full bg-status-success-bg text-status-success-text text-[11px] font-label font-semibold">
      Abierta
    </span>
  )
}

function PostulanteCard({
  postulacion,
  onShowToast,
  onVerPerfil,
}: {
  postulacion: LicitacionPostulacion
  onShowToast: (msg: string, type: 'success' | 'error') => void
  onVerPerfil: (maestroId: string) => void
}) {
  const { mutate: actualizar, isPending } = useActualizarPostulacion()

  const handleAction = (status: 'accepted' | 'rejected') => {
    actualizar(
      { id: postulacion.id, status },
      {
        onSuccess: () => onShowToast(status === 'accepted' ? 'Postulante aceptado' : 'Postulante rechazado', 'success'),
        onError: () => onShowToast('Error al actualizar', 'error'),
      }
    )
  }

  const initials = postulacion.maestro?.name?.charAt(0).toUpperCase() ?? 'M'

  return (
    <div className="bg-surface-container rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="font-label text-sm text-primary font-semibold">{initials}</span>
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="font-label text-sm text-on-surface font-semibold line-clamp-1">
            {postulacion.maestro?.name ?? 'Maestro'}
          </span>
          {postulacion.proposed_budget && (
            <span className="font-body text-xs text-primary">
              Bs. {postulacion.proposed_budget.toLocaleString('es-BO')}
            </span>
          )}
        </div>
        <button
          onClick={() => onVerPerfil(postulacion.maestro_id)}
          className="flex items-center gap-1 px-3 py-2.5 rounded-lg bg-surface border border-outline-variant text-on-surface-variant text-[11px] font-label font-semibold shrink-0 active:opacity-70 transition-opacity"
        >
          <span className="material-symbols-outlined text-[12px]">person</span>
          Ver perfil
        </button>
        {postulacion.status !== 'pending' && (
          <span className={`text-[11px] font-label font-semibold px-2 py-0.5 rounded-full ${
            postulacion.status === 'accepted'
              ? 'bg-status-success-bg text-status-success-text'
              : 'bg-status-error-bg text-status-error-text'
          }`}>
            {postulacion.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
          </span>
        )}
      </div>
      {postulacion.message && (
        <p className="font-body text-xs text-on-surface-variant line-clamp-3">{postulacion.message}</p>
      )}
      {postulacion.status === 'pending' && (
        <div className="flex gap-2 mt-1">
          <button
            disabled={isPending}
            onClick={() => handleAction('accepted')}
            className="flex-1 bg-primary text-on-primary rounded-xl py-3 text-xs font-label font-semibold disabled:opacity-50 transition-opacity active:opacity-80"
          >
            Aceptar
          </button>
          <button
            disabled={isPending}
            onClick={() => handleAction('rejected')}
            className="flex-1 bg-surface border border-outline-variant text-on-surface rounded-xl py-3 text-xs font-label font-semibold disabled:opacity-50 transition-opacity active:opacity-80"
          >
            Rechazar
          </button>
        </div>
      )}
    </div>
  )
}

function LicitacionCard({
  licitacion,
  onShowToast,
  onVerPerfil,
}: {
  licitacion: Licitacion
  onShowToast: (msg: string, type: 'success' | 'error') => void
  onVerPerfil: (maestroId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { data: postulantes = [], isLoading: isLoadingPostulantes } = usePostulantesDeLicitacion(
    expanded ? licitacion.id : ''
  )
  const { mutate: cerrar, isPending: isCerrando } = useCerrarLicitacion()

  const handleCerrar = () => {
    cerrar(licitacion.id, {
      onSuccess: () => onShowToast('Licitación cerrada', 'success'),
      onError: () => onShowToast('Error al cerrar', 'error'),
    })
  }

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant overflow-hidden">
      <button
        className="w-full text-left p-4 flex flex-col gap-2"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-title text-base text-on-surface line-clamp-1 flex-1">{licitacion.title}</h3>
          <StatusBadge status={licitacion.status} />
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant font-body">
          {licitacion.city && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">location_on</span>
              {licitacion.city}
            </span>
          )}
          {licitacion.specialty && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">build</span>
              {licitacion.specialty}
            </span>
          )}
          {(licitacion.budget_min || licitacion.budget_max) && (
            <span className="flex items-center gap-1 text-primary font-semibold">
              <span className="material-symbols-outlined text-[13px]">payments</span>
              {licitacion.budget_min && licitacion.budget_max
                ? `Bs. ${licitacion.budget_min.toLocaleString('es-BO')} – ${licitacion.budget_max.toLocaleString('es-BO')}`
                : licitacion.budget_min
                ? `Desde Bs. ${licitacion.budget_min.toLocaleString('es-BO')}`
                : `Hasta Bs. ${licitacion.budget_max!.toLocaleString('es-BO')}`}
            </span>
          )}
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
            {new Date(licitacion.created_at).toLocaleDateString('es-BO')}
          </span>
        </div>
        <div className="flex items-center justify-end">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-outline-variant px-4 pb-4 flex flex-col gap-3">
          {/* Postulantes */}
          <h4 className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50 mt-3">
            Postulantes {postulantes.length > 0 ? `(${postulantes.length})` : ''}
          </h4>
          {isLoadingPostulantes ? (
            <div className="bg-surface-container animate-pulse rounded-xl h-16" />
          ) : postulantes.length === 0 ? (
            <p className="font-body text-xs text-on-surface-variant italic">Aún no hay postulantes</p>
          ) : (
            <div className="flex flex-col gap-2">
              {postulantes.map((p) => (
                <PostulanteCard key={p.id} postulacion={p} onShowToast={onShowToast} onVerPerfil={onVerPerfil} />
              ))}
            </div>
          )}

          {licitacion.status === 'open' && (
            <button
              disabled={isCerrando}
              onClick={handleCerrar}
              className="w-full border border-outline-variant text-on-surface-variant rounded-xl py-3 text-sm font-label font-semibold disabled:opacity-50 transition-opacity active:opacity-80 mt-1"
            >
              {isCerrando ? 'Cerrando...' : 'Cerrar licitación'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function MisLicitacionesScreen() {
  const { data: licitaciones = [], isLoading } = useMisLicitaciones()
  const [showForm, setShowForm] = useState(false)
  const [selectedMaestroId, setSelectedMaestroId] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  return (
    <div className="flex flex-col gap-3 py-3 pb-6 relative">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex items-center justify-between px-4">
        <h2 className="font-headline font-bold text-[18px] text-on-surface tracking-[-0.02em]">Mis licitaciones</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-on-primary rounded-xl px-4 py-2 text-sm font-label font-semibold flex items-center gap-1 transition-opacity active:opacity-80"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva
        </button>
      </div>

      <div className="px-4">
        <AdBanner variant="banner" />
      </div>

      <div className="flex flex-col gap-3 px-4">
        {isLoading ? (
          <>
            <div className="bg-surface-container animate-pulse rounded-2xl h-24" />
            <div className="bg-surface-container animate-pulse rounded-2xl h-24" />
          </>
        ) : licitaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">gavel</span>
            <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">Sin licitaciones publicadas</p>
            <p className="font-body text-sm text-on-surface-variant/50 text-center">Publica una licitación y recibe propuestas de maestros calificados</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-1 bg-primary text-on-primary rounded-2xl px-6 py-3 text-sm font-label font-semibold transition-opacity active:opacity-80"
            >
              Publicar licitación
            </button>
          </div>
        ) : (
          licitaciones.map((lic) => (
            <LicitacionCard key={lic.id} licitacion={lic} onShowToast={showToast} onVerPerfil={setSelectedMaestroId} />
          ))
        )}
      </div>

      {showForm && (
        <NuevaLicitacionForm
          onClose={() => setShowForm(false)}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {selectedMaestroId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: Z.bg }}>
          <MaestroPublicProfile
            maestroId={selectedMaestroId}
            isOwn={false}
            onBack={() => setSelectedMaestroId(null)}
          />
        </div>
      )}
    </div>
  )
}
