import { useState, useRef, useEffect } from 'react'
import { Z } from '../../shared/design/tokens'
import { FilterBar } from '../../shared/design/shell'
import { ZHeader } from '../../shared/design/components'
import { ZButton } from '../../shared/design/components'
import { CIUDADES_ACTIVAS } from '../../shared/constants/geography'

interface Request {
  id: number
  title: string
  client: string
  location: string
  budget: number
  time: string
  photos: number
  desc: string
  urgent: boolean
}

const W_REQUESTS: Request[] = [
  { id: 1, title: 'Albañilería segundo piso', client: 'Juan Mamani', location: 'Zona Norte, SC', budget: 3000, time: '15 días', photos: 2, desc: 'Necesito maestro albañil para levantar paredes del segundo piso. Material disponible. Empezar esta semana.', urgent: true },
  { id: 2, title: 'Reparación de techo filtraciones', client: 'María López', location: 'Zona Sur, SC', budget: 800, time: '3 días', photos: 1, desc: 'Techo de calamina con filtraciones en 3 puntos. Hay que revisar y sellar.', urgent: false },
  { id: 3, title: 'Instalación de pisos cerámicos', client: 'Pedro Quispe', location: 'Centro, SC', budget: 1500, time: '7 días', photos: 3, desc: 'Colocación de cerámica 60x60 en sala, comedor y pasillo. Aprox 80m².', urgent: false },
  { id: 4, title: 'Acabados interiores departamento', client: 'Arq. Torres', location: 'Norte, SC', budget: 5500, time: '30 días', photos: 4, desc: 'Enlucido, empastado y pintura de departamento completo. 3 ambientes.', urgent: true },
]

const CITIES = ['Todas', ...CIUDADES_ACTIVAS]
const SPECIALTIES = ['Todas', 'Albañilería', 'Electricidad', 'Plomería', 'Pintura', 'Carpintería', 'Acabados']

function DropdownButton({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  options: string[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (v: string) => void
}) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listId = `dropdown-list-${label.toLowerCase().replace(/\s/g, '-')}`
  const isActive = value !== 'Todas'

  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onToggle()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onToggle])

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listId}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 10px',
          borderRadius: 20,
          border: `1.5px solid ${isActive ? Z.orange : Z.border}`,
          background: isActive ? Z.orangeLight : Z.surface,
          cursor: 'pointer',
          fontFamily: Z.font,
          fontSize: 12,
          fontWeight: isActive ? 700 : 500,
          color: isActive ? Z.orangeDark : Z.textSec,
          whiteSpace: 'nowrap' as const,
          outline: 'none',
          transition: 'all 0.15s',
        }}
      >
        {isActive ? value : label}
        <span aria-hidden="true" style={{ fontSize: 9, opacity: 0.6, marginLeft: 1 }}>▾</span>
      </button>

      {isOpen && (
        <div
          id={listId}
          role="listbox"
          aria-label={label}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 50,
            background: Z.surface,
            borderRadius: 12,
            border: `1px solid ${Z.border}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            padding: '6px',
            minWidth: 140,
          }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              role="option"
              aria-selected={value === opt}
              onClick={() => {
                onSelect(opt)
                onToggle()
              }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: value === opt ? Z.orangeLight : 'transparent',
                fontFamily: Z.font,
                fontSize: 13,
                fontWeight: value === opt ? 700 : 400,
                color: value === opt ? Z.orangeDark : Z.text,
                transition: 'background 0.1s',
                outline: 'none',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function RequestDetail({ request, onBack }: { request: Request; onBack: () => void }) {
  const [offerAmt, setOfferAmt] = useState('')

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: Z.bg,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'zFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <ZHeader title="Solicitud de Trabajo" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {request.photos > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: Math.min(request.photos, 3) }, (_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 90,
                  borderRadius: Z.r.sm,
                  background: `linear-gradient(135deg, ${Z.divider}, ${i % 2 ? Z.orangeLight : Z.blueLight})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontSize: 9,
                  color: Z.textMuted,
                }}
              >
                foto {i + 1}
              </div>
            ))}
          </div>
        )}

        <div>
          <h3 style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>
            {request.title}
          </h3>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '8px 0 0', lineHeight: 1.5 }}>
            {request.desc}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { icon: '👤', val: request.client },
            { icon: '📍', val: request.location },
            { icon: '💰', val: `Bs ${request.budget.toLocaleString()}` },
            { icon: '📅', val: request.time },
          ].map((d) => (
            <div
              key={d.val}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: Z.r.sm,
                background: Z.surface,
                border: `1px solid ${Z.border}`,
                fontFamily: Z.font,
                fontSize: 12,
                fontWeight: 600,
                color: Z.text,
              }}
            >
              {d.icon} {d.val}
            </div>
          ))}
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: Z.r.md,
            background: Z.orangeLight,
            border: `1px solid ${Z.orangePastel}`,
          }}
        >
          <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.orangeDark, marginBottom: 12 }}>
            Tu oferta económica (Bs)
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                borderRadius: Z.r.sm,
                background: Z.surface,
                border: `1.5px solid ${Z.orange}`,
              }}
            >
              <span style={{ fontFamily: Z.font, fontWeight: 700, color: Z.textSec }}>Bs</span>
              <input
                type="number"
                value={offerAmt}
                onChange={(e) => setOfferAmt(e.target.value)}
                placeholder="0.00"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontFamily: Z.font,
                  fontSize: 18,
                  fontWeight: 800,
                  color: Z.orangeDark,
                  background: 'transparent',
                }}
              />
            </div>
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 8 }}>
            El cliente propone: <strong>Bs {request.budget.toLocaleString()}</strong>
          </div>
        </div>

        <ZButton disabled={!offerAmt} onClick={onBack}>
          Enviar Oferta
        </ZButton>
        <ZButton variant="secondary" onClick={onBack}>
          No me interesa
        </ZButton>
      </div>
    </div>
  )
}

export function LicitacionesTabTrabajador() {
  const [filter, setFilter] = useState('Nuevas')
  const [selected, setSelected] = useState<Request | null>(null)
  const [cityFilter, setCityFilter] = useState('Todas')
  const [specFilter, setSpecFilter] = useState('Todas')
  const [openDropdown, setOpenDropdown] = useState<'city' | 'spec' | null>(null)

  if (selected) {
    return <RequestDetail request={selected} onBack={() => setSelected(null)} />
  }

  const filteredRequests = W_REQUESTS.filter((r) => {
    if (cityFilter !== 'Todas' && !r.location.includes(cityFilter)) return false
    if (specFilter !== 'Todas' && !r.title.toLowerCase().includes(specFilter.toLowerCase()) && !r.desc.toLowerCase().includes(specFilter.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
        Trabajos
      </h2>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FilterBar options={['Nuevas', 'Enviadas', 'Historial']} active={filter} onChange={setFilter} />
        </div>
        <DropdownButton
          label="Ciudad"
          value={cityFilter}
          options={CITIES}
          isOpen={openDropdown === 'city'}
          onToggle={() => setOpenDropdown(openDropdown === 'city' ? null : 'city')}
          onSelect={setCityFilter}
        />
        <DropdownButton
          label="Especialidad"
          value={specFilter}
          options={SPECIALTIES}
          isOpen={openDropdown === 'spec'}
          onToggle={() => setOpenDropdown(openDropdown === 'spec' ? null : 'spec')}
          onSelect={setSpecFilter}
        />
      </div>

      {filter === 'Nuevas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredRequests.length === 0 && (
            <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted, textAlign: 'center', padding: '24px 0' }}>
              Sin trabajos para estos filtros
            </p>
          )}
          {filteredRequests.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '16px',
                borderRadius: Z.r.md,
                background: Z.surface,
                border: `1.5px solid ${r.urgent ? Z.orange : Z.border}`,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                outline: 'none',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>
                      {r.title}
                    </span>
                    {r.urgent && (
                      <span
                        style={{
                          fontFamily: Z.font,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 20,
                          background: Z.orangeLight,
                          color: Z.orangeDark,
                        }}
                      >
                        URGENTE
                      </span>
                    )}
                  </div>
                  <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2, display: 'block' }}>
                    {r.client}
                  </span>
                </div>
                {r.photos > 0 && (
                  <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.blue, fontWeight: 600, flexShrink: 0 }}>
                    📸 {r.photos}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec }}>📍 {r.location}</span>
                <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.orangeDark }}>
                  Bs {r.budget.toLocaleString()}
                </span>
                <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>⏱ {r.time}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {filter === 'Enviadas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { title: 'Casa Norte — Oferta aceptada', subtitle: 'Bs 3,000 · Juan Mamani', time: 'Hace 3d', color: Z.success },
            { title: 'Techo López — Oferta enviada', subtitle: 'Bs 850 · Esperando respuesta', time: 'Hoy', color: Z.blue },
          ].map((item) => (
            <div
              key={item.title}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${Z.divider}` }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>{item.title}</div>
                <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, marginTop: 2 }}>{item.subtitle}</div>
              </div>
              <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.time}</span>
            </div>
          ))}
        </div>
      )}

      {filter === 'Historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { title: 'Casa Norte — Oferta aceptada', subtitle: 'Bs 3,000 · Juan Mamani', time: 'Hace 3d', color: Z.success },
            { title: 'Techo López — Oferta enviada', subtitle: 'Bs 850 · Esperando respuesta', time: 'Hoy', color: Z.blue },
            { title: 'Empresa Salinas — Rechazada', subtitle: 'Bs 4,500 · Eligieron otra persona', time: 'Hace 1 sem', color: Z.error },
          ].map((item) => (
            <div
              key={item.title}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${Z.divider}` }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>{item.title}</div>
                <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, marginTop: 2 }}>{item.subtitle}</div>
              </div>
              <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{item.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
