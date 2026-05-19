import { useAuthStore } from '../auth/store/authStore'
import { MaestroPublicProfile } from '../maestro/components/MaestroPublicProfile'

export function PerfilTabTrabajador() {
  const user = useAuthStore((s) => s.user)
  const maestroId = user?.user_id ?? ''

  if (!maestroId) return null

  return (
    <MaestroPublicProfile
      maestroId={maestroId}
      isOwn={true}
      authUser={user}
    />
  )
}
