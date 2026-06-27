interface RadarActiveProps {
  jobCount: number
  hasLocation: boolean
}

export function RadarActive({ jobCount, hasLocation }: RadarActiveProps) {
  const dots = [
    { x: 124, y: 56 }, { x: 156, y: 116 }, { x: 110, y: 144 },
    { x: 60,  y: 110 }, { x: 76,  y: 60  }, { x: 140, y: 160 },
    { x: 40,  y: 140 },
  ].slice(0, Math.max(1, Math.min(jobCount, 7)))

  return (
    <div className="relative w-full" style={{ height: 200 }}
      role="img" aria-label={`Radar: ${jobCount} trabajo${jobCount !== 1 ? 's' : ''} cerca`}>
      <div className="absolute inset-0 bg-[--color-driver-bg] rounded-b-3xl overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 200 200" preserveAspectRatio="none">
          {[25, 50, 75, 100, 125, 150, 175].map((v) => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="200" stroke="white" strokeWidth="0.4" />
              <line x1="0" y1={v} x2="200" y2={v} stroke="white" strokeWidth="0.4" />
            </g>
          ))}
        </svg>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet">
          {[40, 70, 100, 130].map((r, i) => (
            <circle key={r} cx="100" cy="200" r={r} fill="none"
              stroke="var(--color-primary)" strokeWidth="0.5" opacity={0.2 - i * 0.03} />
          ))}
          <circle cx="100" cy="200" r="25" fill="none" stroke="var(--color-primary)" strokeWidth="1.2"
            style={{ transformOrigin: '100px 200px', animation: 'radarRingScale1 2.4s ease-out infinite' }} />
          <circle cx="100" cy="200" r="25" fill="none" stroke="var(--color-primary)" strokeWidth="0.8"
            style={{ transformOrigin: '100px 200px', animation: 'radarRingScale2 2.4s ease-out infinite 0.8s' }} />
          <circle cx="100" cy="200" r="25" fill="none" stroke="var(--color-primary)" strokeWidth="0.5"
            style={{ transformOrigin: '100px 200px', animation: 'radarRingScale3 2.4s ease-out infinite 1.6s' }} />
          {dots.map((dot, i) => (
            <g key={i}>
              <circle cx={dot.x} cy={dot.y} r="5" fill="var(--color-primary)" opacity="0.9" />
              <circle cx={dot.x} cy={dot.y} r="8" fill="none" stroke="var(--color-primary)" strokeWidth="0.6" opacity="0.35" />
            </g>
          ))}
          <circle cx="100" cy="200" r="7" fill="var(--color-primary)" />
          <circle cx="100" cy="200" r="4" fill="white" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[--color-driver-bg] to-transparent" />
        <div className="absolute top-3 right-3 bg-primary rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-label font-bold text-on-primary text-xs">
            {jobCount} {jobCount === 1 ? 'trabajo' : 'trabajos'} cerca
          </span>
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className={`material-symbols-outlined text-sm ${hasLocation ? 'text-primary' : 'text-white/70'}`}
            style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
            {hasLocation ? 'gps_fixed' : 'gps_off'}
          </span>
          <span className="font-body text-white/70 text-xs">{hasLocation ? 'GPS activo' : 'Sin GPS'}</span>
        </div>
      </div>
    </div>
  )
}
