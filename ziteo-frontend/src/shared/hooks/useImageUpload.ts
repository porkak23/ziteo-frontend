import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export interface UseImageUploadOptions {
  bucket: 'avatars' | 'project-photos' | 'product-images' | 'payment-qrs'
  folder?: string
}

export function useImageUpload({ bucket, folder }: UseImageUploadOptions) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = async (file: File): Promise<string> => {
    setUploading(true)
    setError(null)

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no debe superar los 5MB')
      }

      const fileName = `${Date.now()}_${file.name}`
      const filePath = folder ? `${folder}/${fileName}` : fileName

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
      return data.publicUrl
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al subir la imagen'
      setError(errMsg)
      throw new Error(errMsg)
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error }
}
