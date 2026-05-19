import { useState } from 'react'
import type { Maestro } from '../../contratar/hooks/useMaestros'
import { useContratarMaestro } from '../../contratar/hooks/useMaestros'
import { MaestroPublicProfile } from '../../maestro/components/MaestroPublicProfile'
import { useAuthStore } from '../../auth/store/authStore'
import { Toast } from '../../../shared/components/Toast'
import { useToast } from '../../../shared/hooks/useToast'

// ── Contract bottom sheet ─────────────────────────────────────────────────────

interface ContractSheetProps {
  worker: Maestro
  constructorCity: string | null
  onClose: () => void
  onSuccess: () => void
}

function ContractSheet({ worker, constructorCity, onClose, onSuccess }: ContractSheetProps) {
  const [description, setDescription] = useState('')
  const [budget, setBudget] = useState('')
  const [city, setCity] = useState(constructorCity ?? '')
  const { mutateAsync, isPending } = useContratarMaestro()
  const user = useAuthStore((s) => s.user)
  const { toasts, showToast, removeToast } = useToast()

  async function handleSubmit() {
    if (!user) return
    if (!description.trim()) {
      showToast('Describe el trabajo que necesitas', 'error')
      return
    }
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      showToast('Ingresa un presupuesto válido', 'error')
      return
    }
    if (!city.trim()) {
      showToast('Indica la ciudad donde se realizará el trabajo', 'error')
      return
    }
    try {
      await mutateAsync({
        constructor_id: user.user_id,
        maestro_id: worker.user_id,
        description: description.trim(),
        budget: Number(budget),
        city: city.trim(),
      })
      onSuccess()
    } catch {
      showToast('No se pudo enviar la solicitud. Intenta de nuevo.', 'error')
    }
  }

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl p-6 flex flex-col gap-5 shadow-2xl"
        style={{ animation: 'zFadeSlideIn 0.2s ease' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="font-headline font-bold text-base text-on-surface">
              Contratar a {worker.name}
            </span>
            <span className="font-body text-xs text-on-surface-variant">
              {worker.specialties[0] ?? 'Especialista'} · {worker.city}
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-label text-xs text-on-surface-variant active:opacity-70 flex-shrink-0 pt-0.5"
          >
            Cancelar
          </button>
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="font-label text-xs font-semibold text-on-surface-variant">
              Descripción del trabajo
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe qué necesitas hacer, materiales disponibles, tiempo estimado..."
              rows={3}
              className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="font-label text-xs font-semibold text-on-surface-variant">
                Presupuesto (Bs.)
              </span>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ej. 500"
                min={0}
                className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="font-label text-xs font-semibold text-on-surface-variant">
                Ciudad
              </span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Sucre"
                className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-primary text-on-primary rounded-2xl py-3.5 font-label font-semibold text-sm disabled:opacity-50 active:opacity-80 transition-opacity"
        >
          {isPending ? 'Enviando solicitud...' : 'Enviar solicitud de contrato'}
        </button>
      </div>
    </>
  )
}

// ── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({ worker, onBack }: { worker: Maestro; onBack: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center bg-background">
      <div className="w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
        <span className="font-headline font-bold text-2xl text-primary">OK</span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-headline font-bold text-xl text-on-surface">
          Solicitud enviada
        </span>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
          {worker.name} recibirá tu solicitud de contrato y se pondrá en contacto contigo pronto.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full mt-2">
        <button
          onClick={onBack}
          className="w-full bg-primary text-on-primary rounded-2xl py-3.5 font-label font-semibold text-sm active:opacity-80 transition-opacity"
        >
          Volver a la búsqueda
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export interface WorkerMock {
  name: string
  specialty: string
  experience: string
  rating: number
  verified: boolean
}

interface Props {
  worker: Maestro
  onBack: () => void
}

type SheetState = 'idle' | 'contract' | 'success'

export function WorkerProfileSubScreen({ worker, onBack }: Props) {
  const [sheet, setSheet] = useState<SheetState>('idle')
  const user = useAuthStore((s) => s.user)

  if (sheet === 'success') {
    return <SuccessScreen worker={worker} onBack={onBack} />
  }

  return (
    <div className="relative h-full">
      <MaestroPublicProfile
        maestroId={worker.user_id}
        isOwn={false}
        onBack={onBack}
        onHire={() => setSheet('contract')}
      />

      {sheet === 'contract' && (
        <ContractSheet
          worker={worker}
          constructorCity={user?.city ?? null}
          onClose={() => setSheet('idle')}
          onSuccess={() => setSheet('success')}
        />
      )}
    </div>
  )
}
