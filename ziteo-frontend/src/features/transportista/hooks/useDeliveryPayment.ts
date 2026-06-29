import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { usePaymentQr } from '../../proveedor/hooks/usePaymentQr'
import { useOfflineOutbox } from '../../../shared/hooks/useOfflineOutbox'

export type PaymentMethod = 'qr' | 'transfer' | 'cash'

export interface DeliveryPaymentState {
  transactionId: string
  amount: number
  confirmToken: string
  orderId: string
  qrSignedUrl: string | null
  qrHash: string | null
  method: PaymentMethod
}

export function useDeliveryPayment() {
  const [isPending, setIsPending]       = useState(false)
  const [txState, setTxState]           = useState<DeliveryPaymentState | null>(null)
  const { getProviderQrForDelivery }    = usePaymentQr()
  const { enqueue, syncOutbox, pendingCount } = useOfflineOutbox()

  async function startPayment(deliveryId: string, method: PaymentMethod): Promise<DeliveryPaymentState> {
    setIsPending(true)
    try {
      // Client-generated idempotency key — safe to retry on network failure
      const transactionId = crypto.randomUUID()

      const { data, error } = await supabase.rpc('start_delivery_payment', {
        p_transaction_id: transactionId,
        p_delivery_id:    deliveryId,
        p_method:         method,
      })

      if (error) throw new Error(error.message)

      const result = data as { transaction_id: string; amount: number; confirm_token: string; order_id: string }

      let qrSignedUrl: string | null = null
      let qrHash: string | null = null

      if (method === 'qr') {
        const qrData = await getProviderQrForDelivery(deliveryId)
        qrSignedUrl = qrData.signedUrl
        qrHash = qrData.qrHash
      }

      const state: DeliveryPaymentState = {
        transactionId: result.transaction_id,
        amount:        result.amount,
        confirmToken:  result.confirm_token,
        orderId:       result.order_id,
        qrSignedUrl,
        qrHash,
        method,
      }
      setTxState(state)
      return state
    } finally {
      setIsPending(false)
    }
  }

  async function renewQrUrl(deliveryId: string): Promise<string | null> {
    const { signedUrl } = await getProviderQrForDelivery(deliveryId)
    if (txState && signedUrl) setTxState({ ...txState, qrSignedUrl: signedUrl })
    return signedUrl
  }

  async function settlePayment(
    transactionId: string,
    confirmToken:  string,
    evidenceUrl?:  string | null,
  ): Promise<{ ok: boolean; status: string; queued?: boolean }> {
    setIsPending(true)
    try {
      if (!navigator.onLine) {
        // Offline: enqueue for background sync when connectivity returns
        enqueue({
          id:  transactionId,
          rpc: 'settle_delivery_payment',
          params: {
            p_transaction_id: transactionId,
            p_confirm_token:  confirmToken,
            p_evidence_url:   evidenceUrl ?? undefined,
          },
        })
        return { ok: true, status: 'pending', queued: true }
      }

      const { data, error } = await supabase.rpc('settle_delivery_payment', {
        p_transaction_id: transactionId,
        p_confirm_token:  confirmToken,
        p_evidence_url:   evidenceUrl ?? undefined,
      })

      if (error) {
        // Network error mid-request: fall back to outbox
        const msg = error.message.toLowerCase()
        if (msg.includes('network') || msg.includes('fetch')) {
          enqueue({
            id:  transactionId,
            rpc: 'settle_delivery_payment',
            params: {
              p_transaction_id: transactionId,
              p_confirm_token:  confirmToken,
              p_evidence_url:   evidenceUrl ?? undefined,
            },
          })
          return { ok: true, status: 'pending', queued: true }
        }
        throw new Error(error.message)
      }
      return data as { ok: boolean; status: string }
    } finally {
      setIsPending(false)
    }
  }

  async function uploadTransferEvidence(
    deliveryId: string,
    transactionId: string,
    file: File,
  ): Promise<string> {
    if (!file.type.startsWith('image/')) throw new Error('El comprobante debe ser una imagen')
    if (file.size > 10 * 1024 * 1024) throw new Error('El comprobante no debe superar los 10MB')

    const ext = file.name.split('.').pop() ?? 'jpg'
    const filePath = `delivery/${deliveryId}/${transactionId}.${ext}`

    await supabase.storage.from('payment-proofs').remove([filePath])

    const { error } = await supabase.storage
      .from('payment-proofs')
      .upload(filePath, file, { upsert: false })

    if (error) throw new Error(error.message)
    return filePath
  }

  function reset() {
    setTxState(null)
  }

  return { startPayment, renewQrUrl, settlePayment, uploadTransferEvidence, reset, syncOutbox, isPending, txState, pendingCount }
}
