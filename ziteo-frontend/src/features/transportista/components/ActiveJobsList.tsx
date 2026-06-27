import { useMyDeliveries, useUpdateDeliveryStatus } from '../hooks/useDeliveries'
import { useMyTransportRequests, useAdvanceTransportRequest } from '../../transporte/hooks/useTransportRequests'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

interface ActiveJobsListProps {
  onOpenDelivery: (id: string) => void
}

function statusLabel(status: string): string {
  if (status === 'accepted')  return 'Aceptado'
  if (status === 'in_transit') return 'En tránsito'
  return status
}

function nextDeliveryStatus(status: string): 'in_transit' | 'delivered' | null {
  if (status === 'accepted')  return 'in_transit'
  if (status === 'in_transit') return 'delivered'
  return null
}

function nextTransportStatus(status: string): 'in_transit' | 'completed' | null {
  if (status === 'accepted')  return 'in_transit'
  if (status === 'in_transit') return 'completed'
  return null
}

export function ActiveJobsList({ onOpenDelivery }: ActiveJobsListProps) {
  const { data: myDeliveries = [] }  = useMyDeliveries()
  const { data: myTransports = [] }  = useMyTransportRequests()
  const { mutate: updateDelivery, isPending: isUpdatingD } = useUpdateDeliveryStatus()
  const { mutate: advanceTransport, isPending: isUpdatingT } = useAdvanceTransportRequest()
  const { toasts, showToast, removeToast } = useToast()

  const activeDeliveries = myDeliveries.filter((d) => d.status === 'accepted' || d.status === 'in_transit')
  const activeTransports = myTransports.filter((t) => t.status === 'accepted' || t.status === 'in_transit')

  if (activeDeliveries.length === 0 && activeTransports.length === 0) return null

  return (
    <>
      <Toast toasts={toasts} onRemove={removeToast} />
      <div className="mt-2">
        <h2 className="font-label font-semibold text-on-surface text-sm mb-3 px-4">En curso</h2>
        <div className="flex flex-col gap-2 px-4">

          {activeDeliveries.map((d) => {
            const next = nextDeliveryStatus(d.status)
            return (
              <div key={d.id} className="bg-surface-container rounded-2xl p-4 flex items-center gap-3">
                <button onClick={() => onOpenDelivery(d.id)} className="flex-1 min-w-0 text-left">
                  <p className="font-label font-bold text-on-surface text-sm">Entrega #{d.id.slice(0, 6).toUpperCase()}</p>
                  <p className="font-body text-xs text-on-surface-variant truncate mt-0.5">{d.dropoff_address ?? '—'}</p>
                  <span className="inline-block mt-1 font-label text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {statusLabel(d.status)}
                  </span>
                </button>
                {next && (
                  <button
                    onClick={() => updateDelivery({ deliveryId: d.id, newStatus: next }, {
                      onError: (e) => showToast(e.message, 'error'),
                    })}
                    disabled={isUpdatingD}
                    className="shrink-0 bg-primary text-on-primary font-label font-bold text-xs px-3 py-2 rounded-xl active:opacity-80 disabled:opacity-50"
                  >
                    {next === 'in_transit' ? 'Iniciar' : 'Entregar'}
                  </button>
                )}
              </div>
            )
          })}

          {activeTransports.map((t) => {
            const next = nextTransportStatus(t.status)
            return (
              <div key={t.id} className="bg-surface-container rounded-2xl p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-label font-bold text-on-surface text-sm">Transporte #{t.id.slice(0, 6).toUpperCase()}</p>
                  <p className="font-body text-xs text-on-surface-variant truncate mt-0.5">{t.dropoff_address ?? '—'}</p>
                  <span className="inline-block mt-1 font-label text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                    {statusLabel(t.status)}
                  </span>
                </div>
                {next && (
                  <button
                    onClick={() => advanceTransport({ requestId: t.id, newStatus: next }, {
                      onError: (e) => showToast(e.message, 'error'),
                    })}
                    disabled={isUpdatingT}
                    className="shrink-0 bg-primary text-on-primary font-label font-bold text-xs px-3 py-2 rounded-xl active:opacity-80 disabled:opacity-50"
                  >
                    {next === 'in_transit' ? 'Iniciar' : 'Completar'}
                  </button>
                )}
              </div>
            )
          })}

        </div>
      </div>
    </>
  )
}
