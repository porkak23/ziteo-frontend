import { useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { useImageUpload } from '../../../shared/hooks/useImageUpload'

export function usePaymentQr() {
  const user = useAuthStore((s) => s.user)
  const { upload: uploadFile, uploading } = useImageUpload({
    bucket: 'payment-qrs',
    folder: user?.user_id,
  })
  const [saving, setSaving] = useState(false)

  async function uploadQr(file: File): Promise<string> {
    if (!user) throw new Error('No autenticado')
    const url = await uploadFile(file)
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ payment_qr_url: url })
        .eq('user_id', user.user_id)
        .eq('role', 'proveedor')
      if (error) throw new Error('QR subido pero no se pudo guardar en perfil')
      return url
    } finally {
      setSaving(false)
    }
  }

  async function getSignedQrUrl(providerUserId: string): Promise<string | null> {
    // Genera una URL firmada válida por 60 minutos para que el constructor pueda descargar
    const { data, error } = await supabase
      .from('user_roles')
      .select('payment_qr_url')
      .eq('user_id', providerUserId)
      .eq('role', 'proveedor')
      .maybeSingle()
    if (error || !data?.payment_qr_url) return null

    // Extraer el path relativo del bucket de la URL completa
    const url = data.payment_qr_url
    const bucketPath = url.split('/payment-qrs/')[1]
    if (!bucketPath) return null

    const { data: signed } = await supabase.storage
      .from('payment-qrs')
      .createSignedUrl(bucketPath, 3600) // 1 hora
    return signed?.signedUrl ?? null
  }

  async function confirmPayment(orderId: string): Promise<void> {
    if (!user) throw new Error('No autenticado')
    const { error } = await supabase
      .from('orders')
      .update({
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: user.user_id,
        status: 'confirmed',
      })
      .eq('id', orderId)
    if (error) throw error
  }

  return { uploadQr, getSignedQrUrl, confirmPayment, uploading: uploading || saving }
}
