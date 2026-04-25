interface WelcomeScreenProps {
  onNavigate: (dest: string) => void
}

const ROLE_CARDS = [
  {
    icon: 'engineering',
    label: 'Constructor',
    benefit: 'Proyectos y personal',
    dimmed: false,
  },
  {
    icon: 'storefront',
    label: 'Vendedor',
    benefit: 'Materiales y alquiler',
    dimmed: false,
  },
  {
    icon: 'construction',
    label: 'Trabajador',
    benefit: 'Obras y contratos',
    dimmed: false,
  },
  {
    icon: 'local_shipping',
    label: 'Transportista',
    benefit: 'Transporte de materiales',
    dimmed: false,
  },
]

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
  return (
    <main className="relative min-h-dvh w-full flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-background-dark)' }}>
      {/* Geometric orange corner accent */}
      <div className="absolute top-0 right-0 w-px h-28 bg-primary/80" />
      <div className="absolute top-0 right-0 w-28 h-px bg-primary/80" />

      <div className="relative z-10 flex flex-col h-full px-5">
        {/* ── TOP: Brand ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-14 pb-12">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-white"
                style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1" }}
              >
                architecture
              </span>
            </div>
            <span className="font-headline font-black text-[24px] text-white tracking-[-0.04em] leading-none">
              ZITEO
            </span>
          </div>
          <span className="font-body text-[10px] text-white/25 font-semibold tracking-[0.2em] uppercase">
            Bolivia
          </span>
        </div>

        {/* ── HEADLINE ───────────────────────────────────────────────── */}
        <div className="mb-10 animate-[fadeSlideUp_0.45s_cubic-bezier(0.16,1,0.3,1)]">
          <p className="font-body text-[11px] text-white/30 font-medium tracking-[0.18em] uppercase mb-5">
            Marketplace de construcción
          </p>
          <h1 className="font-headline font-black leading-[0.93] tracking-[-0.04em]">
            <span className="text-[64px] text-white block">Conecta.</span>
            <span className="text-[64px] text-primary block">Construye.</span>
            <span className="text-[64px] text-white block">Crece.</span>
          </h1>
        </div>

        {/* ── ROLE LIST ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center animate-[fadeSlideUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.1s_both]">
          <p className="font-body text-[10px] text-white/20 font-semibold tracking-[0.16em] uppercase mb-4">
            ¿Cómo participas?
          </p>
          <div className="flex flex-col gap-1">
            {ROLE_CARDS.map((card, i) => (
              <div
                key={card.label}
                className={`flex items-center gap-4 py-3.5 ${
                  i < ROLE_CARDS.length - 1 ? 'border-b border-white/[0.06]' : ''
                } ${card.dimmed ? 'opacity-30' : ''}`}
              >
                <span
                  className={`material-symbols-outlined flex-shrink-0 ${card.dimmed ? 'text-white/40' : 'text-primary'}`}
                  style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}
                >
                  {card.icon}
                </span>
                <div className="flex-1">
                  <span className="font-label font-bold text-[14px] text-white leading-tight block">
                    {card.label}
                  </span>
                  <span className="font-body text-[11px] text-white/35 leading-snug block">
                    {card.benefit}
                  </span>
                </div>
                {card.dimmed && (
                  <span className="text-[9px] font-label font-bold bg-white/8 text-white/30 rounded-full px-2 py-0.5 leading-none uppercase tracking-wider">
                    Próximo
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM: CTAs ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-1 pb-10 pt-8 animate-[fadeSlideUp_0.45s_cubic-bezier(0.16,1,0.3,1)_0.2s_both]">
          <button
            className="w-full py-[18px] bg-primary text-white font-label font-bold rounded-xl text-[15px] tracking-[-0.01em] transition-[transform,opacity] active:scale-[0.98] active:opacity-90 cursor-pointer"
            onClick={() => onNavigate('register')}
          >
            Crear cuenta
          </button>
          <button
            className="w-full py-4 text-white/40 font-label font-medium text-[14px] transition-[color,opacity] hover:text-white/65 active:opacity-60 cursor-pointer"
            onClick={() => onNavigate('login')}
          >
            Ya tengo cuenta
          </button>
        </div>
      </div>
    </main>
  )
}
