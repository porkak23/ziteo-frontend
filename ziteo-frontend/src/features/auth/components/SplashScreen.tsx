import { useEffect, useState } from 'react'
import { Z } from '@/shared/design/tokens'

// SplashScreen is always-dark by design — onboarding identity moment, brand-locked.

interface SplashScreenProps {
  onComplete: () => void
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 3000
    let rafId: number
    const tick = () => {
      const elapsed = Date.now() - start
      const p = Math.min(elapsed / duration, 1)
      setProgress(p)
      if (p < 1) {
        rafId = requestAnimationFrame(tick)
      } else {
        setTimeout(onComplete, 300)
      }
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: '#0D1020' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px),
            linear-gradient(135deg, rgba(232,115,58,0.12) 0%, transparent 45%),
            linear-gradient(315deg, rgba(58,123,213,0.1) 0%, transparent 45%),
            linear-gradient(180deg, #0D1020 0%, #141930 50%, #0D1020 100%)
          `,
        }}
      />

      <div
        className="absolute"
        style={{ top: 20, left: 20, width: 40, height: 40, borderTop: '2px solid rgba(232,115,58,0.3)', borderLeft: '2px solid rgba(232,115,58,0.3)', borderRadius: '4px 0 0 0' }}
      />
      <div
        className="absolute"
        style={{ top: 20, right: 20, width: 40, height: 40, borderTop: '2px solid rgba(58,123,213,0.3)', borderRight: '2px solid rgba(58,123,213,0.3)', borderRadius: '0 4px 0 0' }}
      />
      <div
        className="absolute"
        style={{ bottom: 100, left: 20, width: 40, height: 40, borderBottom: '2px solid rgba(58,123,213,0.3)', borderLeft: '2px solid rgba(58,123,213,0.3)', borderRadius: '0 0 0 4px' }}
      />
      <div
        className="absolute"
        style={{ bottom: 100, right: 20, width: 40, height: 40, borderBottom: '2px solid rgba(232,115,58,0.3)', borderRight: '2px solid rgba(232,115,58,0.3)', borderRadius: '0 0 4px 0' }}
      />

      <div
        className="flex-1 flex flex-col items-center justify-center relative z-10"
        style={{ gap: 16, paddingBottom: 60 }}
      >
        <div
          style={{
            width: 80, height: 80, borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: Z.gradMixed,
            boxShadow: '0 8px 32px rgba(232,115,58,0.3)',
            animation: 'zPulseGlow 2s ease-in-out infinite',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <path d="M8 40V20l16-12 16 12v20" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
            <rect x="14" y="24" width="6" height="6" rx="1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
            <rect x="28" y="24" width="6" height="6" rx="1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
            <rect x="19" y="32" width="10" height="8" rx="1.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none"/>
            <path d="M24 8V4M24 4h8M24 4h-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h1
          style={{
            fontFamily: Z.font, fontWeight: 800, fontSize: 64, color: '#FFFFFF',
            letterSpacing: 6, margin: 0,
            textShadow: '0 2px 20px rgba(232,115,58,0.3)',
          }}
        >
          ZITEO
        </h1>

        <p
          style={{
            fontFamily: Z.font, fontWeight: 500, fontSize: 14,
            color: 'rgba(255,255,255,0.55)',
            margin: 0, letterSpacing: 1, textAlign: 'center', lineHeight: 1.5,
          }}
        >
          La plataforma que construye Bolivia
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-10"
        style={{ padding: '0 40px 50px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
      >
        <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%', borderRadius: 2, transition: 'width 0.1s linear',
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #E8733A, #3A7BD5)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex', gap: 16, alignItems: 'center',
            fontFamily: Z.font, fontSize: 10, fontWeight: 700, letterSpacing: 2.5,
            color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
          }}
        >
          <span>Conecta</span>
          <span style={{ color: Z.orange, fontSize: 6 }}>◆</span>
          <span>Construye</span>
          <span style={{ color: Z.blue, fontSize: 6 }}>◆</span>
          <span>Crece</span>
        </div>
      </div>
    </div>
  )
}
