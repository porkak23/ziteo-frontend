interface AdBannerProps {
  variant?: 'banner' | 'card'
  className?: string
}

export function AdBanner({ variant = 'banner', className = '' }: AdBannerProps) {
  if (variant === 'card') {
    return (
      <div
        aria-label="Espacio publicitario"
        className={`relative w-full h-64 rounded-2xl border border-outline-variant bg-gradient-to-b from-primary/5 to-surface flex flex-col items-center justify-center gap-3 overflow-hidden ${className}`}
      >
        <span className="absolute top-2.5 right-3 text-[10px] font-label font-semibold tracking-widest text-on-surface-variant opacity-60 uppercase">
          Publicidad
        </span>
        <span
          className="material-symbols-outlined text-6xl text-on-surface-variant opacity-40"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          campaign
        </span>
        <div className="flex flex-col items-center gap-1">
          <span className="font-label font-semibold text-base text-on-surface-variant">Tu anuncio aquí</span>
          <span className="text-[11px] text-on-surface-variant opacity-60 uppercase tracking-wider">
            Espacio Publicitario
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      aria-label="Espacio publicitario"
      className={`relative w-full min-h-32 rounded-2xl border border-outline-variant bg-gradient-to-r from-primary/5 via-surface-container to-surface flex items-center justify-center gap-4 px-6 py-5 overflow-hidden ${className}`}
    >
      {/* Shimmer overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
        <div
          className="absolute inset-y-0 w-1/3 -translate-x-full bg-white/10 blur-sm"
          style={{ animation: 'adShimmer 2.8s ease-in-out infinite' }}
        />
      </div>
      {/* PUBLICIDAD label */}
      <span className="absolute top-2.5 right-3 text-[10px] font-label font-semibold tracking-widest text-on-surface-variant opacity-60 uppercase">
        Publicidad
      </span>
      <span
        className="material-symbols-outlined text-4xl text-primary opacity-70"
        style={{ fontVariationSettings: "'FILL' 0" }}
      >
        campaign
      </span>
      <div className="flex flex-col gap-0.5">
        <span className="font-label font-semibold text-base text-on-surface">Tu anuncio aquí</span>
        <span className="text-[11px] text-on-surface-variant opacity-60 uppercase tracking-wider">
          Espacio Publicitario
        </span>
      </div>
    </div>
  )
}
