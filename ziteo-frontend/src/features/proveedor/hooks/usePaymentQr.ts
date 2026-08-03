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
    try {
      // El guard (comprador con ≥1 orden con este proveedor, o cualquiera si
      // es maestro) ahora vive en el RPC — ver get_provider_qr_path en
      // 20260802000003_public_role_profiles_view.sql. payment_qr_url no es
      // legible directo desde user_roles para un tercero desde que se retiró
      // la policy pública amplia.
      const { data: qrPath, error } = await supabase.rpc('get_provider_qr_path', {
        p_provider_user_id: providerUserId,
        p_role: role,
      })

      if (error) throw new Error('No se pudieron cargar los datos de pago del proveedor.')

      // Legitimate case: provider hasn't configured a QR yet — not an error.
      if (!qrPath) return null

      const { data: signed, error: signError } = await supabase.storage
        .from('payment-qrs')
        .createSignedUrl(qrPath, 300) // 5 minutes — short window, renewable on demand

      if (signError) throw new Error('No se pudo generar el enlace del QR. Intenta de nuevo.')

      return signed?.signedUrl ?? null
    } catch (err) {
      // Real failures (network, auth, permissions) are re-thrown so the caller can
      // distinguish them from the legitimate "provider has no QR configured" case (null).
      if (err instanceof Error) throw err
      throw new Error('No se pudo cargar el QR de pago. Intenta de nuevo.')
    }
  }

  // ─── Driver: fetch provider QR for an assigned delivery ──────────────────────
  // Validates the caller has an active delivery for this provider's order before
  // serving the QR URL. Used by PaymentCloseSheet during COD collection.

  async function getProviderQrForDelivery(
    deliveryId: string,
  ): Promise<{ signedUrl: string | null; qrHash: string | null }> {
    // El guard (chofer asignado a esa entrega) ahora vive en el RPC — ver
    // get_provider_qr_for_delivery en 20260802000003_public_role_profiles_view.sql.
    // Endurecido respecto al código anterior: el SQL ahora sí exige
    // driver_id = auth.uid(), que antes solo estaba implícito en un
    // comentario sin aplicarse.
    const { data, error } = await supabase.rpc('get_provider_qr_for_delivery', {
      p_delivery_id: deliveryId,
    })

    const row = Array.isArray(data) ? data[0] : data
    if (error || !row?.qr_path) return { signedUrl: null, qrHash: null }

    const { data: signed } = await supabase.storage
      .from('payment-qrs')
      .createSignedUrl(row.qr_path, 300)

    return {
      signedUrl: signed?.signedUrl ?? null,
      qrHash: row.qr_hash ?? null,
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
    // payment_bank_transfer/payment_cash son intencionalmente públicos — se
    // renderizan a cualquier visitante en VendedorPublicProfile/MaestroPublicProfile
    // (ficha de cobro del vendedor). Se lee de la vista pública en vez de
    // user_roles directo (20260802000003_public_role_profiles_view.sql) para
    // no depender del acceso amplio a la tabla que se está retirando.
    const { data, error } = await supabase
      .from('public_role_profiles')
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
