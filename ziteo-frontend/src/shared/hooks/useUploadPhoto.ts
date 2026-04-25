import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../features/auth/store/authStore'

export function useUploadPhoto() {
  const [isUploading, setIsUploading] = useState(false)

  const upload = async (file: File): Promise<string> => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Usuario no autenticado')

    setIsUploading(true)
    try {
      const path = `${user.user_id}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        throw new Error(
          'No se pudo subir la foto. El servicio de almacenamiento puede no estar configurado aún.'
        )
      }

      const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.user_id)

      if (dbError) {
        throw new Error('La foto se subió pero no se pudo guardar en el perfil.')
      }

      useAuthStore.getState().setUser({ ...user, avatar_url: publicUrl })

      return publicUrl
    } finally {
      setIsUploading(false)
    }
  }

  return { upload, isUploading }
}
