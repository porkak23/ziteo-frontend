import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { track } from '../../../lib/analytics'

export function usePaymentQr() {
  const user = useAuthStore((s) => s.user)
  const [uploading, setUploading] = useState(false)

  // ─── Provider: upload QR image ──────────────────────────────────────────────

  async function uploadQr(file: File): Promise<string> {
    if (!user) throw new Error('No autenticado')

    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen')
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('La imagen no debe superar los 5MB')
    }

    setUploading(true)
    try {
      // Fixed path — upsert always overwrites the same file, no garbage accumulates
      const filePath = `${user.user_id}/qr.png`

      const { error: uploadError } = await supabase.storage
        .from('payment-qrs')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Store the relative path (not a public URL — bucket is private)
      const { error: dbError } = await supabase
        .from('user_roles')
        .update({ payment_qr_url: filePath })
        .eq('user_id', user.user_id)
        .eq('role', 'proveedor')

      if (dbError) throw new Error('QR subido pero no se pudo guardar en perfil')

      return filePath
    } finally {
      setUploading(false)
    }
  }

  // ─── Constructor: fetch signed QR URL to display ─────────────────────────────

  async function getSignedQrUrl(providerUserId: string): Promise<string | null> {
    // Verify that the authenticated buyer has at least one order with this provider
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const { data: orderRows } = await supabase
      .from('orders')
      .select('id')
      .eq('provider_id', providerUserId)
      .eq('constructor_id', authUser.id)
      .limit(1)

    if (!orderRows || orderRows.length === 0) return null

    // Fetch the stored relative path from user_roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('payment_qr_url')
      .eq('user_id', providerUserId)
      .eq('role', 'proveedor')
      .maybeSingle()

    if (error || !data?.payment_qr_url) return null

    const { data: signed } = await supabase.storage
      .from('payment-qrs')
      .createSignedUrl(data.payment_qr_url, 600) // 10 minutes

    return signed?.signedUrl ?? null
  }

  // ─── Constructor: upload payment proof (comprobante) ─────────────────────────
  // Uploads the file to the 'payment-proofs' bucket (private), then calls the
  // SECURITY DEFINER RPC so the evidence URL is recorded atomically.

  async function uploadPaymentEvidence(orderId: string, file: File): Promise<string> {
    if (!user) throw new Error('No autenticado')

    if (!file.type.startsWith('image/')) {
      throw new Error('El comprobante debe ser una imagen')
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('El comprobante no debe superar los 10MB')
    }

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const filePath = `${user.user_id}/${orderId}.${ext}`

      const { error: storageError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, { upsert: true })

      if (storageError) throw storageError

      // Call the server-side RPC which validates caller = constructor and
      // updates payment_evidence_url + payment_evidence_uploaded_at atomically
      const { error: rpcError } = await supabase.rpc('upload_payment_evidence', {
        p_order_id:     orderId,
        p_evidence_url: filePath,
      })

      if (rpcError) throw new Error(rpcError.message)

      track.paymentEvidenceUploaded(orderId)
      return filePath
    } finally {
      setUploading(false)
    }
  }

  // ─── Provider: get signed URL for the constructor's payment proof ─────────────

  async function getPaymentEvidence(orderId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('payment_evidence_url, provider_id')
      .eq('id', orderId)
      .maybeSingle()

    if (error || !data?.payment_evidence_url) return null

    const { data: signed } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(data.payment_evidence_url, 600) // 10 minutes

    return signed?.signedUrl ?? null
  }

  // ─── Provider: confirm payment — ONLY callable by the order's provider ────────
  // Delegates to the SECURITY DEFINER RPC which enforces auth.uid() = provider_id

  async function confirmPayment(orderId: string): Promise<void> {
    const { error } = await supabase.rpc('confirm_payment_by_provider', {
      p_order_id: orderId,
    })
    if (error) throw new Error(error.message)
    track.paymentConfirmed(orderId)
  }

  return {
    uploadQr,
    getSignedQrUrl,
    uploadPaymentEvidence,
    getPaymentEvidence,
    confirmPayment,
    uploading,
  }
}
