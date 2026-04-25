import { useState } from 'react'
import { useAuthStore } from '../../features/auth/store/authStore'
import AvatarMenu from './AvatarMenu'
import NotificationBell from './NotificationBell'
import { UserAvatar } from './UserAvatar'

interface AppHeaderProps {
  title?: string
}

export default function AppHeader({ title: _title }: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-surface border-b border-outline-variant px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span
              className="material-symbols-outlined text-on-primary"
              style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}
            >
              architecture
            </span>
          </div>
          <span className="font-headline font-black text-xl text-on-surface tracking-[-0.03em] leading-none">
            ZITEO
          </span>
        </div>
        <div className="flex items-center gap-2">
          {user && <NotificationBell userId={user.user_id} />}
          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="rounded-full flex items-center justify-center cursor-pointer"
            aria-label="Abrir menú de usuario"
          >
            <UserAvatar name={user?.name} avatarUrl={user?.avatar_url} size="md" showRing={true} />
          </button>
        </div>
      </header>

      <AvatarMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  )
}
