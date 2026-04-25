import { useAcceptContract, useRejectContract } from '../hooks/useContracts'
import type { ContractCardData } from '../hooks/useContracts'

interface Props {
  contract: ContractCardData
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void
}

export function ContractCard({ contract, onShowToast }: Props) {
  const { mutate: accept, isPending: isAccepting } = useAcceptContract()
  const { mutate: reject, isPending: isRejecting } = useRejectContract()

  const isPending = isAccepting || isRejecting

  const handleAccept = () => {
    accept(contract.id, {
      onSuccess: () => onShowToast('Contrato aceptado exitosamente', 'success'),
      onError: () => onShowToast('Error al aceptar el contrato', 'error')
    })
  }

  const handleReject = () => {
    reject(contract.id, {
      onSuccess: () => onShowToast('Contrato rechazado', 'info'),
      onError: () => onShowToast('Error al rechazar el contrato', 'error')
    })
  }

  return (
    <div className="bg-surface rounded-2xl p-4 flex flex-col gap-3 border border-outline-variant relative overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-outline-variant pb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
            <h3 className="font-title text-base text-on-surface line-clamp-1">{contract.constructor?.name ?? 'Constructor'}</h3>
          </div>
          <div className="flex items-center gap-1 mt-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">location_on</span>
            <span className="font-body text-xs line-clamp-1">{contract.city || 'Sin ubicación'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-label text-primary font-semibold">
            {contract.budget ? `Bs. ${contract.budget.toLocaleString('es-BO')}` : 'A convenir'}
          </span>
          <span className="font-body text-[10px] text-on-surface-variant mt-1">
            {new Date(contract.created_at).toLocaleDateString('es-BO')}
          </span>
        </div>
      </div>

      {contract.description && (
        <p className="font-body text-sm text-on-surface-variant line-clamp-2">
          {contract.description}
        </p>
      )}

      <div className="mt-1 flex gap-3">
        <button
          disabled={isPending}
          onClick={handleReject}
          className="flex-1 border border-error text-error rounded-2xl py-3 text-sm font-label font-semibold disabled:opacity-50 transition-opacity active:bg-error-container/10"
        >
          {isRejecting ? 'Rechazando...' : 'Rechazar'}
        </button>
        <button
          disabled={isPending}
          onClick={handleAccept}
          className="flex-1 bg-primary text-on-primary rounded-2xl py-3 text-sm font-label font-semibold disabled:opacity-50 transition-opacity active:opacity-80"
        >
          {isAccepting ? 'Aceptando...' : 'Aceptar'}
        </button>
      </div>
    </div>
  )
}
