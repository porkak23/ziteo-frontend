import { useEffect, useState } from 'react'
import { Z } from '@/shared/design/tokens'
import imagotipoVertical from '@/assets/brand/imagotipo-vertical-mono-blanco.svg'

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
            linear-gradient(135deg, rgba(46,49,146,0.14) 0%, transparent 45%),
            linear-gradient(315deg, rgba(241,120,36,0.1) 0%, transparent 45%),
            linear-gradient(180deg, #0D1020 0%, #141930 50%, #0D1020 100%)
          `,
        }}
      />

      <div
        className="absolute"
        style={{ top: 20, left: 20, width: 40, height: 40, borderTop: '2px solid rgba(46,49,146,0.35)', borderLeft: '2px solid rgba(46,49,146,0.35)', borderRadius: '4px 0 0 0' }}
      />
      <div
        className="absolute"
        style={{ top: 20, right: 20, width: 40, height: 40, borderTop: '2px solid rgba(241,120,36,0.3)', borderRight: '2px solid rgba(241,120,36,0.3)', borderRadius: '0 4px 0 0' }}
      />
      <div
        className="absolute"
        style={{ bottom: 100, left: 20, width: 40, height: 40, borderBottom: '2px solid rgba(241,120,36,0.3)', borderLeft: '2px solid rgba(241,120,36,0.3)', borderRadius: '0 0 0 4px' }}
      />
      <div
        className="absolute"
        style={{ bottom: 100, right: 20, width: 40, height: 40, borderBottom: '2px solid rgba(46,49,146,0.35)', borderRight: '2px solid rgba(46,49,146,0.35)', borderRadius: '0 0 4px 0' }}
      />

      <div
        className="flex-1 flex flex-col items-center justify-center relative z-10"
        style={{ gap: 16, paddingBottom: 60 }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '-20%',
              background: 'radial-gradient(closest-side, rgba(46,49,146,0.35), transparent 70%)',
              animation: 'zGlowPulse 2.4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          <img
            src={imagotipoVertical}
            alt="Ziteoo"
            style={{ width: 260, height: 'auto', position: 'relative' }}
          />
        </div>

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
              background: 'linear-gradient(90deg, #2e3192, #f17824)',
            }}
          />
        </div>

        <div
          style={{
            display: 'flex', gap: 10, alignItems: 'center',
            fontFamily: Z.font, fontSize: 15, fontWeight: 800, letterSpacing: 1.5,
            color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase',
          }}
        >
          <span>Conecta</span>
          <span style={{ color: Z.orange, fontSize: 9 }}>◆</span>
          <span>Construye</span>
          <span style={{ color: Z.blue, fontSize: 9 }}>◆</span>
          <span>Crece</span>
        </div>
      </div>
    </div>
  )
}
