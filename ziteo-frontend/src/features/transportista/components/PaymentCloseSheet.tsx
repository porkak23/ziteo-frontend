import { useRef, useState } from 'react'
import { useDeliveryPayment } from '../hooks/useDeliveryPayment'
import type { PaymentMethod } from '../hooks/useDeliveryPayment'

interface PaymentCloseSheetProps {
  deliveryId: string
  open: boolean
  onClose: () => void
  onSettled: () => void
}

const METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'qr',       label: 'QR',           icon: 'qr_code_2' },
  { key: 'cash',     label: 'Efectivo',      icon: 'payments' },
  { key: 'transfer', label: 'Transferencia', icon: 'account_balance' },
]

export function PaymentCloseSheet({ deliveryId, open, onClose, onSettled }: PaymentCloseSheetProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qr')
  const [phase, setPhase]     = useState<'select' | 'confirm' | 'done' | 'queued'>('select')
  const [error, setError]     = useState<string | null>(null)
  const fileInputRef          = useRef<HTMLInputElement>(null)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)

  const {
    startPayment,
    renewQrUrl,
    settlePayment,
    uploadTransferEvidence,
    isPending,
    txState,
    reset,
  } = useDeliveryPayment()

  function handleClose() {
    reset()
    setPhase('select')
    setError(null)
    setEvidenceFile(null)
    onClose()
  }

  async function handleStart() {
    setError(null)
    try {
      await startPayment(deliveryId, selectedMethod)
      setPhase('confirm')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar cobro')
    }
  }

  async function handleSettle() {
    if (!txState) return
    setError(null)
    try {
      let evidencePath: string | undefined
      if (selectedMethod === 'transfer' && evidenceFile) {
        evidencePath = await uploadTransferEvidence(deliveryId, txState.transactionId, evidenceFile)
      }
      const result = await settlePayment(txState.transactionId, txState.confirmToken, evidencePath)
      if (result.ok) {
        setPhase(result.queued ? 'queued' : 'done')
        setTimeout(() => { handleClose(); onSettled() }, result.queued ? 2500 : 1500)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar pago')
    }
  }

  async function handleRenewQr() {
    setError(null)
    const url = await renewQrUrl(deliveryId)
    if (!url) setError('No se pudo renovar el QR. Intenta de nuevo.')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-xl flex flex-col transition-transform duration-300 ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-outline-variant" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-outline-variant">
          <h2 className="font-label font-semibold text-on-surface text-base">Cobrar pedido</h2>
          <button
            onClick={handleClose}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-container"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

          {/* Phase: select method */}
          {phase === 'select' && (
            <>
              <p className="font-body text-sm text-on-surface-variant">
                Elige cómo el cliente realizará el pago:
              </p>

              <div className="grid grid-cols-3 gap-2">
                {METHODS.map((m) => {
                  const active = selectedMethod === m.key
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setSelectedMethod(m.key)}
                      className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border transition-all ${
                        active
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-outline-variant bg-surface-container text-on-surface-variant'
                      }`}
                      aria-pressed={active}
                    >
                      <span className={`material-symbols-outlined text-2xl leading-none ${active ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {m.icon}
                      </span>
                      <span className="font-label text-xs font-semibold">{m.label}</span>
                    </button>
                  )
                })}
              </div>

              {error && <p className="font-body text-xs text-error">{error}</p>}

              <button
                onClick={handleStart}
                disabled={isPending}
                className="h-12 rounded-xl bg-primary text-on-primary font-label font-semibold text-sm disabled:opacity-60 active:opacity-80"
              >
                {isPending ? 'Iniciando…' : 'Continuar'}
              </button>
            </>
          )}

          {/* Phase: confirm (show amount + QR / efectivo / transfer UI) */}
          {phase === 'confirm' && txState && (
            <>
              {/* Amount */}
              <div className="bg-surface-container rounded-2xl p-4 flex flex-col items-center gap-1">
                <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Monto a cobrar</span>
                <span className="font-headline font-extrabold text-primary text-3xl">
                  Bs. {txState.amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* QR image */}
              {selectedMethod === 'qr' && (
                <div className="flex flex-col items-center gap-3">
                  {txState.qrSignedUrl ? (
                    <img
                      src={txState.qrSignedUrl}
                      alt="QR de pago del proveedor"
                      className="w-48 h-48 object-contain rounded-xl border border-outline-variant bg-white p-2"
                    />
                  ) : (
                    <div className="w-48 h-48 flex flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-container gap-2">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant">qr_code_2</span>
                      <p className="font-body text-xs text-on-surface-variant text-center px-4">
                        No hay QR configurado
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleRenewQr}
                    className="flex items-center gap-1.5 font-label text-xs text-on-surface-variant hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-base">refresh</span>
                    Renovar QR
                  </button>
                </div>
              )}

              {/* Efectivo: just show amount again with icon */}
              {selectedMethod === 'cash' && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
                    payments
                  </span>
                  <p className="font-body text-sm text-on-surface-variant text-center">
                    Solicita al cliente el pago en efectivo por el monto indicado.
                  </p>
                </div>
              )}

              {/* Transfer: upload comprobante */}
              {selectedMethod === 'transfer' && (
                <div className="flex flex-col gap-3">
                  <p className="font-body text-sm text-on-surface-variant">
                    Sube el comprobante de transferencia del cliente:
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                      evidenceFile
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {evidenceFile ? 'check_circle' : 'upload'}
                    </span>
                    <span className="font-label text-xs font-semibold">
                      {evidenceFile ? evidenceFile.name : 'Toca para subir comprobante'}
                    </span>
                  </button>
                </div>
              )}

              {error && <p className="font-body text-xs text-error">{error}</p>}

              <button
                onClick={handleSettle}
                disabled={isPending || (selectedMethod === 'transfer' && !evidenceFile)}
                className="h-12 rounded-xl bg-primary text-on-primary font-label font-semibold text-sm disabled:opacity-60 active:opacity-80"
              >
                {isPending
                  ? 'Registrando…'
                  : selectedMethod === 'qr'
                  ? 'Ya cobré el QR'
                  : selectedMethod === 'cash'
                  ? 'Cobré en efectivo'
                  : 'Enviar comprobante'}
              </button>

              <button
                onClick={() => { setPhase('select'); setError(null) }}
                className="font-label text-xs text-on-surface-variant text-center"
              >
                Cambiar método
              </button>
            </>
          )}

          {/* Phase: done */}
          {phase === 'done' && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <span
                className="material-symbols-outlined text-6xl text-status-success-text"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <p className="font-headline font-bold text-on-surface text-lg text-center">
                {selectedMethod === 'transfer' ? '¡Comprobante enviado!' : '¡Pago registrado!'}
              </p>
              <p className="font-body text-sm text-on-surface-variant text-center">
                {selectedMethod === 'transfer'
                  ? 'El proveedor revisará y confirmará la transferencia.'
                  : 'Puedes confirmar la entrega ahora.'}
              </p>
            </div>
          )}

          {/* Phase: queued (offline) */}
          {phase === 'queued' && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant">
                cloud_off
              </span>
              <p className="font-headline font-bold text-on-surface text-base text-center">
                Sin conexión · pago en cola
              </p>
              <p className="font-body text-sm text-on-surface-variant text-center">
                El pago está guardado localmente y se enviará automáticamente cuando recuperes señal.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
