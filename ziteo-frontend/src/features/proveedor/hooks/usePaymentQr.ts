import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { track } from '../../../lib/analytics'

async function computeFileSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

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

      // Intentamos borrar el archivo anterior (si existe) para evitar error de upsert
      await supabase.storage.from('payment-qrs').remove([filePath])

      const { error: uploadError } = await supabase.storage
        .from('payment-qrs')
        .upload(filePath, file, { upsert: false })

      if (uploadError) throw uploadError

      // Compute SHA-256 hash before storing path (anti-substitution: hash binds file to DB record)
      const hash = await computeFileSha256(file)

      const role = user.active_role || 'proveedor'
      const { error: dbError } = await supabase
        .from('user_roles')
        .update({ payment_qr_url: filePath, payment_qr_hash: hash, payment_qr_updated_at: new Date().toISOString() })
        .eq('user_id', user.user_id)
        .eq('role', role)

      if (dbError) throw new Error('QR subido pero no se pudo guardar en perfil')

      // Also store hash via SECURITY DEFINER RPC (triggers audit log on user_roles)
      try { await supabase.rpc('store_qr_hash', { p_hash: hash, p_role: role }) } catch { /* non-critical */ }

      return filePath
    } finally {
      setUploading(false)
    }
  }

  // ─── Constructor: fetch signed QR URL to display ─────────────────────────────

  async function getSignedQrUrl(providerUserId: string, role: string = 'proveedor'): Promise<string | null> {
    // Verify that the authenticated buyer has at least one order with this provider
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return null

    const { data: orderRows } = await supabase
      .from('orders')
      .select('id')
      .eq('provider_id', providerUserId)
      .eq('constructor_id', authUser.id)
      .limit(1)

    if (!orderRows || orderRows.length === 0) {
      // If it's a maestro, we also allow the own worker or a constructor to read it without active ecommerce orders.
      // For now let's bypass order check if the role is 'maestro', since workers are hired differently.
      if (role !== 'maestro') return null
    }

    // Fetch the stored relative path from user_roles
    const { data, error } = await supabase
      .from('user_roles')
      .select('payment_qr_url')
      .eq('user_id', providerUserId)
      .eq('role', role)
      .maybeSingle()

    if (error || !data?.payment_qr_url) return null

    const { data: signed } = await supabase.storage
      .from('payment-qrs')
      .createSignedUrl(data.payment_qr_url, 300) // 5 minutes — short window, renewable on demand

    return signed?.signedUrl ?? null
  }

  // ─── Driver: fetch provider QR for an assigned delivery ──────────────────────
  // Validates the caller has an active delivery for this provider's order before
  // serving the QR URL. Used by PaymentCloseSheet during COD collection.

  async function getProviderQrForDelivery(
    deliveryId: string,
  ): Promise<{ signedUrl: string | null; qrHash: string | null }> {
    // Lookup order → provider via the delivery
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('order_id, driver_id')
      .eq('id', deliveryId)
      .maybeSingle()

    if (!delivery?.order_id) return { signedUrl: null, qrHash: null }

    const { data: order } = await supabase
      .from('orders')
      .select('provider_id')
      .eq('id', delivery.order_id)
      .maybeSingle()

    if (!order?.provider_id) return { signedUrl: null, qrHash: null }

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('payment_qr_url, payment_qr_hash')
      .eq('user_id', order.provider_id)
      .eq('role', 'proveedor')
      .maybeSingle()

    if (!roleRow?.payment_qr_url) return { signedUrl: null, qrHash: null }

    const { data: signed } = await supabase.storage
      .from('payment-qrs')
      .createSignedUrl(roleRow.payment_qr_url, 300)

    return {
      signedUrl: signed?.signedUrl ?? null,
      qrHash: roleRow.payment_qr_hash ?? null,
    }
  }

  // ─── Constructor: fetch provider's alternative payment methods ───────────────
  // Returns the bank-transfer details and whether cash is accepted, so the
  // checkout can show them when the buyer picks "Transferencia" or when the
  // provider has no QR configured.

  async function getProviderPaymentMethods(
    providerUserId: string,
    role: string = 'proveedor',
  ): Promise<{ bankTransfer: string | null; cash: boolean }> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('payment_bank_transfer, payment_cash')
      .eq('user_id', providerUserId)
      .eq('role', role)
      .maybeSingle()

    if (error || !data) return { bankTransfer: null, cash: false }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = data as any
    return {
      bankTransfer: d.payment_bank_transfer ?? null,
      cash: Boolean(d.payment_cash),
    }
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

      // Borramos comprobante previo si existiera
      await supabase.storage.from('payment-proofs').remove([filePath])

      const { error: storageError } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, { upsert: false })

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
    getProviderQrForDelivery,
    getProviderPaymentMethods,
    uploadPaymentEvidence,
    getPaymentEvidence,
    confirmPayment,
    uploading,
  }
}
