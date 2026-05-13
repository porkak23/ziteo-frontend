import { useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { SummaryCard } from '@/shared/design/shell/SummaryCard'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { FilterBar } from '@/shared/design/shell/FilterBar'

type Period = 'Hoy' | 'Semana' | 'Mes'

interface PeriodData {
  total: number
  trips: number
  km: number
  avg: number
}

const DATA: Record<Period, PeriodData> = {
  Hoy:    { total: 125, trips: 2, km: 6.3, avg: 62.5 },
  Semana: { total: 1240, trips: 18, km: 142, avg: 68.9 },
  Mes:    { total: 4850, trips: 71, km: 562, avg: 68.3 },
}

const WEEK_BARS = [45, 120, 180, 90, 210, 155, 125]
const WEEK_DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const MAX_BAR = 210

function TruckIcon({ color = Z.textMuted, size = 17 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="5" width="14" height="12" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      <path d="M15 9h4l3 4v4h-7V9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <circle cx="6" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none" />
      <circle cx="19" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none" />
    </svg>
  )
}

export function GananciasScreen() {
  const [period, setPeriod] = useState<Period>('Semana')
  const d = DATA[period]

  return (
    <div style={{ padding: '16px 20px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
        Mis Ganancias
      </h2>

      <FilterBar
        options={['Hoy', 'Semana', 'Mes']}
        active={period}
        onChange={(v) => setPeriod(v as Period)}
      />

      <div style={{
        padding: '24px', borderRadius: Z.r.lg,
        background: `linear-gradient(135deg, ${Z.orangeDark} 0%, ${Z.orange} 100%)`,
        boxShadow: '0 4px 20px rgba(164,55,0,0.2)',
      }}>
        <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          Ganancias · {period === 'Hoy' ? 'hoy' : `esta ${period.toLowerCase()}`}
        </div>
        <div style={{ fontFamily: Z.font, fontSize: 40, fontWeight: 800, color: '#fff', margin: '6px 0 4px' }}>
          Bs {d.total.toLocaleString('es-BO')}
        </div>
        <div style={{ fontFamily: Z.font, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          Promedio por viaje:{' '}
          <strong style={{ color: '#fff' }}>Bs {d.avg}</strong>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <SummaryCard
          icon={<TruckIcon color={Z.blue} size={17} />}
          label="Viajes"
          value={String(d.trips)}
          color={Z.blue}
        />
        <SummaryCard
          icon={
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path d="M3 12l2-2 4 4 4-4 4 4 4-4" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          }
          label="Km recorridos"
          value={String(d.km)}
          color={Z.orange}
        />
      </div>

      {period === 'Semana' && (
        <div>
          <SectionTitle title="Por día" />
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, marginTop: 14 }}>
            {WEEK_BARS.map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  height: `${(val / MAX_BAR) * 70}px`,
                  background: i === 4 ? Z.orangeDark : Z.orangeLight,
                  transition: 'height 0.5s',
                }} />
                <span style={{
                  fontFamily: Z.font, fontSize: 9, fontWeight: 600,
                  color: i === 4 ? Z.orangeDark : Z.textMuted,
                }}>
                  {WEEK_DAYS[i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        padding: '14px', borderRadius: Z.r.md,
        background: Z.blueLight, border: `1px solid ${Z.bluePastel}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 20 }}>🔧</span>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.blueDark }}>
            Mantenimiento del vehículo
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 2 }}>
            Próximo cambio de aceite en 2,000 km
          </div>
        </div>
      </div>
    </div>
  )
}
