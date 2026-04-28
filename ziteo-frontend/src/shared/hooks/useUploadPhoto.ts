import { supabase } from '../../lib/supabaseClient'
import { useAuthStore } from '../../features/auth/store/authStore'
import { useImageUpload } from './useImageUpload'

export function useUploadPhoto() {
  const user = useAuthStore((s) => s.user)
  const { upload: uploadFile, uploading: isUploading } = useImageUpload({
    bucket: 'avatars',
    folder: user?.user_id,
  })

  const upload = async (file: File): Promise<string> => {
    if (!user) throw new Error('Usuario no autenticado')

    const publicUrl = await uploadFile(file)

    const { error: dbError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', user.user_id)

    if (dbError) throw new Error('La foto se subió pero no se pudo guardar en el perfil.')

    useAuthStore.getState().setUser({ ...user, avatar_url: publicUrl })

    return publicUrl
  }

  return { upload, isUploading }
}
