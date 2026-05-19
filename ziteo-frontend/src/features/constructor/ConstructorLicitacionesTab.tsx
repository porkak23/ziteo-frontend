import { useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { ZButton } from '@/shared/design/components/ZButton'
import { ZInput } from '@/shared/design/components/ZInput'
import { FilterBar } from '@/shared/design/shell/FilterBar'
import { ZHeader } from '@/shared/design/components/ZHeader'
import { ZIcon } from '@/shared/design/components/ZIcon'
import { CIUDADES_ACTIVAS } from '@/shared/constants/geography'

// ── Data ──────────────────────────────────────────────────────────────────────
interface Bid {
  id: number; title: string; specialty: string; budget: string; city: string; offers: number; status: string; time: string
}

const BIDS: Bid[] = [
  { id: 1, title: 'Electricista para obra',       specialty: 'Electricidad industrial', budget: '5,000', city: 'Santa Cruz', offers: 5, status: 'Activa',  time: '15 días' },
  { id: 2, title: 'Plomería baño principal',      specialty: 'Instalación sanitaria',  budget: '2,500', city: 'Santa Cruz', offers: 3, status: 'Activa',  time: '7 días' },
  { id: 3, title: 'Carpintería puertas',          specialty: 'Carpintería fina',       budget: '8,000', city: 'Sucre',      offers: 7, status: 'Cerrada', time: '30 días' },
  { id: 4, title: 'Pintura interior 3 ambientes', specialty: 'Pintura y acabados',     budget: '3,200', city: 'Santa Cruz', offers: 4, status: 'Cerrada', time: '10 días' },
]

// ── Sub-icons ─────────────────────────────────────────────────────────────────
function IconPlus({ color = '#fff', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ── BidCard ───────────────────────────────────────────────────────────────────
function BidCard({ bid }: { bid: Bid }) {
  const isActive = bid.status === 'Activa'
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
      borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{bid.title}</span>
        <span style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: isActive ? Z.orangeLight : Z.divider, color: isActive ? Z.orangeDark : Z.textMuted }}>
          {bid.status}
        </span>
      </div>
      <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec }}>{bid.specialty}</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.text }}>Bs {bid.budget}</span>
        <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>{bid.city}</span>
        <span style={{ marginLeft: 'auto', fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: isActive ? Z.orange : Z.textMuted }}>{bid.offers} ofertas</span>
      </div>
    </div>
  )
}

// ── NewBidForm ────────────────────────────────────────────────────────────────
const SPECIALTIES = ['Albañilería', 'Electricidad', 'Plomería', 'Carpintería', 'Soldadura', 'Pintura', 'Otro']
const CITIES = [...CIUDADES_ACTIVAS]
const DURATIONS = ['1-3 días', '1 semana', '2 semanas', '1 mes', 'Más de 1 mes']

function ZSelect({ label, value, onChange, placeholder, options }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; options: string[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>{label}</label>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '14px', borderRadius: Z.r.sm,
          border: `1.5px solid ${Z.border}`, background: Z.surface,
          fontFamily: Z.font, fontSize: 14, color: value ? Z.text : Z.textMuted,
          outline: 'none', appearance: 'none', cursor: 'pointer',
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function NewBidForm({ onBack }: { onBack: () => void }) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [budget, setBudget] = useState('')
  const [city, setCity] = useState('')
  const [time, setTime] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handlePublish() {
    setSubmitted(true)
    setTimeout(onBack, 1800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ZHeader title="Nueva Licitación" onBack={onBack} />
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <ZInput label="Título del trabajo" placeholder="Ej: Electricista para instalación" value={title} onChange={setTitle} />

        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 6 }}>Descripción detallada</label>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Describe el trabajo requerido, alcance y detalles..."
            style={{ width: '100%', height: 90, borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`, padding: 14, fontFamily: Z.font, fontSize: 14, color: Z.text, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <ZSelect label="Especialidad necesaria" value={specialty} onChange={setSpecialty} placeholder="Selecciona especialidad" options={SPECIALTIES} />
        <ZInput label="Presupuesto máximo (Bs)" type="number" placeholder="Ej: 5000" value={budget} onChange={setBudget} />
        <ZSelect label="Ciudad" value={city} onChange={setCity} placeholder="Selecciona ciudad" options={CITIES} />
        <ZSelect label="Tiempo estimado" value={time} onChange={setTime} placeholder="Duración del trabajo" options={DURATIONS} />

        {submitted && (
          <div role="status" style={{ padding: '14px', borderRadius: Z.r.sm, background: '#DCFCE7', color: '#166534', fontFamily: Z.font, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
            ¡Licitación publicada exitosamente!
          </div>
        )}
        <ZButton disabled={!title || !specialty || !city || submitted} onClick={handlePublish}>
          Publicar Licitación
        </ZButton>
      </div>
    </div>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
type LicitScreen = 'list' | 'form'

export function ConstructorLicitacionesTab() {
  const [filter, setFilter] = useState('Activas')
  const [screen, setScreen] = useState<LicitScreen>('list')

  const filtered = filter === 'Activas' ? BIDS.filter(b => b.status === 'Activa') : BIDS.filter(b => b.status === 'Cerrada')

  if (screen === 'form') {
    return <NewBidForm onBack={() => setScreen('list')} />
  }

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Licitaciones</h2>
        <button
          onClick={() => setScreen('form')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px',
            borderRadius: 20, border: 'none', cursor: 'pointer',
            background: Z.orangeDark, color: '#fff', outline: 'none',
            fontFamily: Z.font, fontSize: 12, fontWeight: 700,
          }}
        >
          <IconPlus color="#fff" size={14} /> Nueva
        </button>
      </div>

      <FilterBar options={['Activas', 'Historial']} active={filter} onChange={setFilter} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(b => <BidCard key={b.id} bid={b} />)}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <ZIcon name="search" size={40} color={Z.textMuted} />
            <p style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.textMuted, marginTop: 12 }}>No hay licitaciones aquí</p>
          </div>
        )}
      </div>
    </div>
  )
}
