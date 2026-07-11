import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { generateFakeQrSvg } from '@/sandbox/fixtures/fakeQr'

interface SimulatedPaymentPanelProps {
  orderId: string
  onSimulated: () => void
}

/**
 * Reemplaza el paso 'qr' de QrPagoModal en modo sandbox. No sube nada a Storage:
 * llama directo al RPC real `upload_payment_evidence` con una URL placeholder
 * `sandbox://...`, que dispara el trigger real de notificación al vendedor.
 */
export function SimulatedPaymentPanel({ orderId, onSimulated }: SimulatedPaymentPanelProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const qrSvg = useMemo(() => generateFakeQrSvg(orderId), [orderId])
  const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`

  async function handleSimulate() {
    setLoading(true)
    setError(null)
    try {
      const { error: rpcError } = await supabase.rpc('upload_payment_evidence', {
        p_order_id: orderId,
        p_evidence_url: `sandbox://simulated-payment/${Date.now()}`,
      })
      if (rpcError) throw new Error(rpcError.message)
      onSimulated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo simular el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <div className="w-full rounded-2xl border border-dashed border-primary bg-primary-container/30 px-3 py-1 text-center">
        <span className="font-label font-semibold text-xs uppercase tracking-wide text-primary">
          Sandbox — QR ficticio
        </span>
      </div>
      <img
        src={qrDataUri}
        alt="QR de pago simulado"
        width={192}
        height={192}
        className="object-contain rounded-2xl border border-outline-variant"
      />
      <p className="font-body text-sm text-center text-on-surface-variant">
        Este QR no es real. Pulsa el botón para simular que el pago fue exitoso — esto dispara
        la notificación real al vendedor.
      </p>
      {error && (
        <div className="w-full bg-error-container text-on-error-container rounded-2xl px-4 py-3 font-body text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleSimulate}
        disabled={loading}
        className="w-full bg-primary text-on-primary font-label font-semibold px-6 py-3 rounded-2xl disabled:opacity-50"
      >
        {loading ? 'Simulando...' : 'Simular Pago Exitoso'}
      </button>
    </div>
  )
}
