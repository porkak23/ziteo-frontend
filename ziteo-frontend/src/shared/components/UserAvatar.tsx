interface UserAvatarProps {
  name?: string | null
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showRing?: boolean
}

const SIZE_MAP = {
  sm: { container: 'w-8 h-8', text: 'text-sm' },
  md: { container: 'w-10 h-10', text: 'text-base' },
  lg: { container: 'w-14 h-14', text: 'text-xl' },
  xl: { container: 'w-20 h-20', text: 'text-3xl' },
}

export function UserAvatar({ name, avatarUrl, size = 'md', showRing = false }: UserAvatarProps) {
  const { container, text } = SIZE_MAP[size]
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  const ringClass = showRing
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
    : ''

  if (avatarUrl) {
    return (
      <div className={`${container} rounded-full overflow-hidden ${ringClass} shrink-0`}>
        <img src={avatarUrl} alt={name ?? 'Avatar de usuario'} className="w-full h-full object-cover" />
      </div>
    )
  }

  return (
    <div
      className={`${container} rounded-full flex items-center justify-center shrink-0 ${ringClass}`}
      style={{
        background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)',
      }}
    >
      <span className={`font-headline font-bold text-on-primary ${text} leading-none select-none`}>
        {initial}
      </span>
    </div>
  )
}
