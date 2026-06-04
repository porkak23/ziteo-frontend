import { useEffect, useRef, useState } from 'react'
import { usePaymentQr } from '../../proveedor/hooks/usePaymentQr'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'

// How often (ms) to poll for provider confirmation while waiting
const POLL_INTERVAL_MS = 30_000

interface QrPagoModalProps {
  providerId: string
  orderId: string
  /** Payment method the buyer chose at checkout. Defaults to QR. */
  method?: 'qr' | 'transfer'
  /** Called when provider has confirmed the payment */
  onConfirmed: () => void
  onClose: () => void
}

type Step = 'qr' | 'upload' | 'waiting' | 'confirmed'

export function QrPagoModal({ providerId, orderId, method = 'qr', onConfirmed, onClose }: QrPagoModalProps) {
  const { getSignedQrUrl, getProviderPaymentMethods, uploadPaymentEvidence, uploading } = usePaymentQr()
  const queryClient = useQueryClient()

  const [step, setStep]         = useState<Step>('qr')
  const [signedUrl, setSignedUrl] = useState<string | null | undefined>(undefined)
  const [bankInfo, setBankInfo] = useState<{ bankTransfer: string | null; cash: boolean } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Load the provider's QR + bank details on mount ───────────────────────────
  useEffect(() => {
    let cancelled = false
    getSignedQrUrl(providerId).then((url) => {
      if (!cancelled) setSignedUrl(url)
    })
    getProviderPaymentMethods(providerId).then((info) => {
      if (!cancelled) setBankInfo(info)
    })
    return () => { cancelled = true }
  }, [providerId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll for confirmation when in 'waiting' step ─────────────────────────────
  useEffect(() => {
    if (step !== 'waiting') {
      if (pollRef.current) clearInterval(pollRef.current)
      return
    }

    async function checkStatus() {
      // Re-fetch the order to see if it moved to 'confirmed'
      await queryClient.invalidateQueries({ queryKey: ['orders'] })
      // Also check via direct query so we don't depend on the list being rendered
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .maybeSingle()
      if (data?.status === 'confirmed') {
        setStep('confirmed')
      }
    }

    // Check immediately, then on interval
    void checkStatus()
    pollRef.current = setInterval(checkStatus, POLL_INTERVAL_MS)

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [step, orderId, queryClient])

  // ── File selection ────────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFile(file)
    setUploadError(null)
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  // ── Upload comprobante ────────────────────────────────────────────────────────
  async function handleUpload() {
    if (!selectedFile) return
    setUploadError(null)
    try {
      await uploadPaymentEvidence(orderId, selectedFile)
      setStep('waiting')
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir el comprobante')
    }
  }

  const isLoading = signedUrl === undefined

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-surface w-full max-w-md rounded-t-3xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h3 className="font-headline font-semibold text-lg text-on-surface">
            {step === 'qr'        && (method === 'transfer' ? 'Datos de transferencia' : 'QR de Pago')}
            {step === 'upload'    && 'Subir comprobante'}
            {step === 'waiting'   && 'Esperando confirmacion'}
            {step === 'confirmed' && 'Pago confirmado'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant font-label font-semibold text-sm"
          >
            X
          </button>
        </div>

        {/* ── Step: QR / bank display ─────────────────────────────────────────── */}
        {step === 'qr' && (() => {
          // Show bank details when the buyer chose "Transferencia", or as a
          // fallback when the provider has no QR configured.
          const noQr = signedUrl === null
          const hasBank = Boolean(bankInfo?.bankTransfer)
          const showBank = method === 'transfer' || (noQr && hasBank)

          if (isLoading) {
            return (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="w-48 h-48 bg-surface-container animate-pulse rounded-2xl" />
              </div>
            )
          }

          // Bank-transfer view
          if (showBank) {
            if (!hasBank) {
              return (
                <div className="flex flex-col items-center gap-4 py-2">
                  <p className="font-body text-sm text-center text-on-surface-variant py-8">
                    El proveedor aun no ha configurado una cuenta para transferencias. Contacta directamente con la tienda.
                  </p>
                  <button
                    onClick={onClose}
                    className="w-full bg-surface-container text-on-surface font-label font-semibold px-6 py-3 rounded-2xl"
                  >
                    Cerrar
                  </button>
                </div>
              )
            }
            return (
              <div className="flex flex-col gap-4 py-2">
                <div className="rounded-2xl border border-outline-variant bg-surface-container p-4">
                  <p className="font-label font-semibold text-xs uppercase tracking-wide text-on-surface-variant mb-1">
                    Cuenta para transferencia
                  </p>
                  <p className="font-body text-sm text-on-surface whitespace-pre-line">
                    {bankInfo?.bankTransfer}
                  </p>
                </div>
                <p className="font-body text-sm text-center text-on-surface-variant">
                  Realiza la transferencia a esta cuenta. Luego sube tu comprobante para que el proveedor lo verifique.
                </p>
                <button
                  onClick={() => setStep('upload')}
                  className="w-full bg-primary text-on-primary font-label font-semibold px-6 py-3 rounded-2xl"
                >
                  Ya pague — subir comprobante
                </button>
              </div>
            )
          }

          // QR view
          if (signedUrl) {
            return (
              <div className="flex flex-col items-center gap-4 py-2">
                <img
                  src={signedUrl}
                  alt="QR de pago del proveedor"
                  width={192}
                  height={192}
                  className="object-contain rounded-2xl"
                />
                <p className="font-body text-sm text-center text-on-surface-variant">
                  Escanea este QR y realiza la transferencia. Luego sube tu comprobante para que el proveedor lo verifique.
                </p>
                <a
                  href={signedUrl}
                  download="qr-pago.png"
                  className="w-full text-center bg-surface-container text-on-surface font-label font-semibold px-6 py-3 rounded-2xl"
                >
                  Descargar QR
                </a>
                <button
                  onClick={() => setStep('upload')}
                  className="w-full bg-primary text-on-primary font-label font-semibold px-6 py-3 rounded-2xl"
                >
                  Ya pague — subir comprobante
                </button>
              </div>
            )
          }

          // No QR and no bank
          return (
            <div className="flex flex-col items-center gap-4 py-2">
              <p className="font-body text-sm text-center text-on-surface-variant py-8">
                El proveedor aun no ha configurado su QR de cobro. Contacta directamente con la tienda.
              </p>
              <button
                onClick={onClose}
                className="w-full bg-surface-container text-on-surface font-label font-semibold px-6 py-3 rounded-2xl"
              >
                Cerrar
              </button>
            </div>
          )
        })()}

        {/* ── Step: Upload comprobante ────────────────────────────────────────── */}
        {step === 'upload' && (
          <div className="flex flex-col gap-4">
            <p className="font-body text-sm text-on-surface-variant">
              Sube una foto o captura de pantalla de tu comprobante de pago. El proveedor la revisara y confirmara tu pedido.
            </p>

            {/* File picker */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-outline-variant rounded-2xl py-8 flex flex-col items-center gap-2 text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
            >
              <span className="font-label font-semibold text-sm">
                {selectedFile ? selectedFile.name : 'Seleccionar imagen'}
              </span>
              <span className="font-body text-xs">JPG, PNG, hasta 10MB</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Preview */}
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Vista previa del comprobante"
                className="w-full max-h-48 object-contain rounded-2xl border border-outline-variant"
              />
            )}

            {uploadError && (
              <div className="bg-error-container text-on-error-container rounded-2xl px-4 py-3 font-body text-sm">
                {uploadError}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-primary text-on-primary font-label font-semibold px-6 py-3 rounded-2xl disabled:opacity-50 transition-opacity"
            >
              {uploading ? 'Subiendo...' : 'Enviar comprobante'}
            </button>
            <button
              onClick={() => setStep('qr')}
              disabled={uploading}
              className="w-full bg-surface-container text-on-surface font-label font-semibold px-6 py-3 rounded-2xl"
            >
              Volver al QR
            </button>
          </div>
        )}

        {/* ── Step: Waiting for provider ──────────────────────────────────────── */}
        {step === 'waiting' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="font-headline font-semibold text-on-surface text-center">
              Comprobante enviado
            </p>
            <p className="font-body text-sm text-center text-on-surface-variant">
              El proveedor revisara tu comprobante y confirmara el pago. Te notificaremos cuando este listo. Esta pantalla se actualiza automaticamente cada 30 segundos.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-surface-container text-on-surface font-label font-semibold px-6 py-3 rounded-2xl mt-2"
            >
              Cerrar y seguir navegando
            </button>
          </div>
        )}

        {/* ── Step: Confirmed ─────────────────────────────────────────────────── */}
        {step === 'confirmed' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center">
              <span className="font-headline font-bold text-primary text-2xl">OK</span>
            </div>
            <p className="font-headline font-semibold text-on-surface text-center">
              Pago confirmado
            </p>
            <p className="font-body text-sm text-center text-on-surface-variant">
              El proveedor verifico tu pago. Tu pedido esta siendo preparado.
            </p>
            <button
              onClick={() => { onConfirmed(); onClose() }}
              className="w-full bg-primary text-on-primary font-label font-semibold px-6 py-3 rounded-2xl"
            >
              Ver mis pedidos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
