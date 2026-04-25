import { useEffect } from 'react'

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 2500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Accent glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-80 h-80 rounded-full bg-primary/20 blur-[80px]" />
      </div>

      {/* Logo block */}
      <div className="relative z-10 flex flex-col items-center gap-5 animate-[zoomIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30">
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: '3rem', fontVariationSettings: "'FILL' 1" }}
          >
            architecture
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <h1 className="font-headline font-black text-[4.5rem] text-white tracking-[-0.04em] leading-none">
            ZITEO
          </h1>
          <p className="font-body text-on-surface-variant text-sm font-medium tracking-widest uppercase">
            Construcción Conectada
          </p>
        </div>
      </div>

      {/* Bottom loader */}
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-dot { animation: none !important; opacity: 0.6; }
        }
      `}</style>
      <div className="absolute bottom-14 flex flex-col items-center gap-3 animate-[fadeIn_0.4s_ease-out_0.9s_both]">
        <div className="flex gap-1.5">
          <div className="pulse-dot w-1.5 h-1.5 rounded-full bg-primary" style={{ animation: 'pulseDot 1.2s ease-in-out infinite', animationDelay: '0ms' }} />
          <div className="pulse-dot w-1.5 h-1.5 rounded-full bg-primary/60" style={{ animation: 'pulseDot 1.2s ease-in-out infinite', animationDelay: '150ms' }} />
          <div className="pulse-dot w-1.5 h-1.5 rounded-full bg-primary/30" style={{ animation: 'pulseDot 1.2s ease-in-out infinite', animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}
