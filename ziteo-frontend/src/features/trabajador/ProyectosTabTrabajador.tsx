import { useState } from 'react'
import { Z } from '../../shared/design/tokens'
import { BigActionButton, ConfirmSheet } from '../../shared/design/components/accessible'
import { Toast } from '../../shared/components/Toast'
import { useToast } from '../../shared/hooks/useToast'
import { useAuthStore } from '../auth/store/authStore'
import {
  useMaestroContracts,
  useAcceptContract,
  useRejectContract,
  useCompleteContract,
  type ContractCardData,
} from '../maestro/hooks/useContracts'
import { useLogContactEvent } from '../maestro/hooks/useContactEvents'
import { openWhatsApp } from '../../shared/utils/whatsapp'

function ChevronDown({ size = 16, color = Z.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronUp({ size = 16, color = Z.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WhatsAppIcon({ color = '#fff', size = 20 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2a10 10 0 00-8.6 15.1L2 22l5.1-1.3A10 10 0 1012 2z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M8.5 9c0-.5.4-1.5 1-1.5s1 .1 1.3.7c.3.6.6 1.6.6 1.8 0 .2-.1.4-.3.6l-.5.6c-.1.2-.2.4 0 .7.2.3.9 1.3 1.9 2 1 .8 1.7 1 2 1.1.3.1.5 0 .6-.1l.6-.7c.2-.2.4-.3.6-.2l1.6.7c.2.1.4.3.4.5 0 .3-.1 1-.6 1.4-.5.5-1.4.9-2.6.7-1.2-.2-3-.9-4.4-2.3-1.4-1.4-2-3-2.2-3.6-.2-.5-.1-.9.1-1.2z"
        fill={color}
      />
    </svg>
  )
}

type StatusFilter = 'pending' | 'accepted' | 'completed' | 'todos'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'pending', label: 'Por confirmar' },
  { key: 'accepted', label: 'En curso' },
  { key: 'completed', label: 'Completados' },
  { key: 'todos', label: 'Todos' },
]

function getStatusBadge(status: ContractCardData['status']): { bg: string; color: string; label: string } {
  switch (status) {
    case 'pending':
      return { bg: 'var(--color-status-warning-bg)', color: 'var(--color-status-warning-text)', label: 'Por confirmar' }
    case 'accepted':
      return { bg: Z.orangeLight, color: Z.orangeDark, label: 'En Curso' }
    case 'completed':
      return { bg: 'var(--color-status-success-bg)', color: 'var(--color-status-success-text)', label: 'Completado' }
    default:
      return { bg: Z.divider, color: Z.textSec, label: status }
  }
}

interface ProyectosTabTrabajadorProps {
  onNavigate?: (tab: string) => void
}

export function ProyectosTabTrabajador({ onNavigate }: ProyectosTabTrabajadorProps) {
  const user = useAuthStore((s) => s.user)
  const maestroId = user?.user_id ?? ''

  const { data: contracts = [], isLoading } = useMaestroContracts(maestroId)
  const acceptContract = useAcceptContract()
  const rejectContract = useRejectContract()
  const completeContract = useCompleteContract()
  const logContactEvent = useLogContactEvent()
  const { toasts, showToast, removeToast } = useToast()

  const [activeFilter, setActiveFilter] = useState<StatusFilter>('accepted')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<
    { type: 'accept' | 'reject' | 'complete'; contract: ContractCardData } | null
  >(null)

  const filteredContracts = activeFilter === 'todos'
    ? contracts
    : contracts.filter((c) => c.status === activeFilter)

  const pendingCount = contracts.filter((c) => c.status === 'pending').length
  const acceptedCount = contracts.filter((c) => c.status === 'accepted').length
  const completedCount = contracts.filter((c) => c.status === 'completed').length

  function handleWhatsApp(contract: ContractCardData) {
    if (!contract.constructor?.phone) return
    // Fire-and-forget: nunca debe bloquear la apertura de WhatsApp.
    logContactEvent.mutate({ maestroId, eventType: 'whatsapp_click' })
    const message = `Hola ${contract.constructor.name}, soy tu maestro para "${contract.description ?? 'tu proyecto'}" en Ziteoo.`
    openWhatsApp(contract.constructor.phone, message)
  }

  async function handleConfirm() {
    if (!confirmAction) return
    const { type, contract } = confirmAction
    try {
      if (type === 'accept') {
        await acceptContract.mutateAsync(contract.id)
        showToast('Trabajo aceptado', 'success')
      } else if (type === 'reject') {
        await rejectContract.mutateAsync(contract.id)
        showToast('Trabajo rechazado', 'info')
      } else if (type === 'complete') {
        await completeContract.mutateAsync(contract.id)
        showToast('Trabajo finalizado. Se sumó a tus ganancias.', 'success')
      }
      setConfirmAction(null)
    } catch {
      showToast('Ocurrió un error, intenta de nuevo', 'error')
    }
  }

  const confirmPending = acceptContract.isPending || rejectContract.isPending || completeContract.isPending

  return (
    <div style={{ paddingBottom: 20 }}>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div style={{ padding: '16px 20px 12px' }}>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
          Mis Proyectos
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>
          {acceptedCount} en curso · {completedCount} completado{completedCount !== 1 ? 's' : ''}
          {pendingCount > 0 ? ` · ${pendingCount} por confirmar` : ''}
        </p>
      </div>

      {/* Status Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 20px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {STATUS_TABS.map((tab) => {
          const active = activeFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                flexShrink: 0,
                fontFamily: Z.font,
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                padding: '0 18px',
                minHeight: 48,
                borderRadius: Z.r.full,
                border: 'none',
                background: active ? Z.orange : Z.surface,
                color: active ? '#fff' : Z.textSec,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: active ? `0 2px 8px rgba(232,115,58,0.3)` : `0 1px 3px rgba(0,0,0,0.06)`,
                transition: 'all 0.18s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Project Cards */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!isLoading && contracts.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div style={{ fontFamily: Z.font, fontSize: 15, color: Z.textMuted }}>
              Aún no tienes trabajos. Postúlate en Trabajos disponibles.
            </div>
            {onNavigate && (
              <BigActionButton
                label="Ver trabajos disponibles"
                variant="primary"
                onClick={() => onNavigate('licitaciones')}
                fullWidth={false}
              />
            )}
          </div>
        )}

        {contracts.length > 0 && filteredContracts.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: Z.textMuted,
              fontFamily: Z.font,
              fontSize: 14,
            }}
          >
            No hay proyectos en este estado.
          </div>
        )}

        {filteredContracts.map((contract) => {
          const isOpen = selectedId === contract.id
          const badge = getStatusBadge(contract.status)

          return (
            <div
              key={contract.id}
              style={{
                borderRadius: Z.r.md,
                background: Z.surface,
                border: `1.5px solid ${Z.border}`,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setSelectedId(isOpen ? null : contract.id)}
                style={{
                  width: '100%',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  outline: 'none',
                  textAlign: 'left',
                  minHeight: 48,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 800, color: Z.text }}>
                        {contract.description ?? 'Proyecto sin descripción'}
                      </span>
                      <span
                        style={{
                          fontFamily: Z.font,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: Z.r.full,
                          background: badge.bg,
                          color: badge.color,
                          flexShrink: 0,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginTop: 4 }}>
                      {contract.constructor?.name ?? 'Constructor'}{contract.city ? ` · ${contract.city}` : ''}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp /> : <ChevronDown />}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark }}>
                    Bs {(contract.budget ?? 0).toLocaleString('es-BO')}
                  </span>
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${Z.divider}`, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4, paddingTop: 12 }}>
                  {contract.status === 'pending' && (
                    <>
                      <BigActionButton
                        label="Aceptar trabajo"
                        variant="primary"
                        onClick={() => setConfirmAction({ type: 'accept', contract })}
                      />
                      <BigActionButton
                        label="Rechazar"
                        variant="danger"
                        onClick={() => setConfirmAction({ type: 'reject', contract })}
                      />
                    </>
                  )}

                  {contract.status === 'accepted' && (
                    <>
                      {contract.constructor?.phone ? (
                        <BigActionButton
                          label="Escribir por WhatsApp"
                          variant="success"
                          icon={<WhatsAppIcon />}
                          onClick={() => handleWhatsApp(contract)}
                        />
                      ) : (
                        <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted, textAlign: 'center', padding: '10px 0' }}>
                          Contacto no disponible
                        </div>
                      )}
                      <BigActionButton
                        label="Finalizar trabajo"
                        variant="primary"
                        onClick={() => setConfirmAction({ type: 'complete', contract })}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {confirmAction?.type === 'accept' && (
        <ConfirmSheet
          open
          tone="default"
          title="¿Aceptar este trabajo?"
          message={`Confirmarás que realizarás "${confirmAction.contract.description ?? 'este proyecto'}" para ${confirmAction.contract.constructor?.name ?? 'el constructor'}.`}
          confirmLabel="Sí, aceptar"
          cancelLabel="No, volver"
          isPending={confirmPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === 'reject' && (
        <ConfirmSheet
          open
          tone="danger"
          title="¿Rechazar este trabajo?"
          message="Esta acción no se puede deshacer. El constructor será notificado."
          confirmLabel="Sí, rechazar"
          cancelLabel="No, volver"
          isPending={confirmPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {confirmAction?.type === 'complete' && (
        <ConfirmSheet
          open
          tone="success"
          title="¿Terminaste este trabajo?"
          message={`Se marcará como completado y se sumará Bs ${(confirmAction.contract.budget ?? 0).toLocaleString('es-BO')} a tus ganancias. Esta acción no se puede deshacer.`}
          confirmLabel="Sí, finalizar"
          cancelLabel="No, volver"
          isPending={confirmPending}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
