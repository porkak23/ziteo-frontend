import { useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { ZHeader } from '@/shared/design/components/ZHeader'
import { ZButton } from '@/shared/design/components/ZButton'
import { ZInput } from '@/shared/design/components/ZInput'
import { ZSelect } from '@/shared/design/components/ZSelect'
import { ZIcon } from '@/shared/design/components/ZIcon'
import { CIUDADES_ACTIVAS } from '@/shared/constants/geography'

interface Props {
  onBack: () => void
}

const CITIES = [...CIUDADES_ACTIVAS]

export function NuevoProyectoSubScreen({ onBack }: Props) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [budget, setBudget] = useState('')
  const [city, setCity] = useState('')
  const [needPersonnel, setNeedPersonnel] = useState(false)
  const [needMaterials, setNeedMaterials] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleCreate() {
    if (!name.trim()) return
    setSubmitted(true)
    setTimeout(onBack, 1800)
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      animation: 'zFadeSlideIn 0.25s ease',
    }}>
      <ZHeader title="Nuevo Proyecto" onBack={onBack} />
      <div style={{
        flex: 1, padding: '8px 20px 24px',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Photo upload placeholder */}
        <div style={{
          height: 120, borderRadius: Z.r.lg, border: `2px dashed ${Z.border}`,
          background: Z.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8, cursor: 'pointer',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke={Z.textMuted} strokeWidth="1.8" fill="none" />
            <circle cx="8.5" cy="8.5" r="1.5" fill={Z.textMuted} />
            <path d="M21 15l-5-5L5 21" stroke={Z.textMuted} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          </svg>
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textMuted }}>
            Toca para agregar foto del sitio
          </span>
        </div>

        <ZInput
          label="Nombre del proyecto"
          placeholder="Ej: Casa Norte"
          value={name}
          onChange={setName}
        />

        <div>
          <label style={{
            fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec,
            display: 'block', marginBottom: 6,
          }}>
            Descripción
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Describe brevemente el proyecto..."
            style={{
              width: '100%', height: 80, borderRadius: Z.r.sm,
              border: `1.5px solid ${Z.border}`, background: Z.surface,
              padding: 14, fontFamily: Z.font, fontSize: 14, color: Z.text,
              resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <ZInput
          label="Presupuesto estimado (Bs)"
          type="number"
          placeholder="Ej: 50000"
          value={budget}
          onChange={setBudget}
        />

        <ZSelect
          label="Ciudad"
          value={city}
          onChange={setCity}
          placeholder="Selecciona ciudad"
          options={CITIES}
        />

        {/* Location placeholder */}
        <div>
          <label style={{
            fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec,
            display: 'block', marginBottom: 8,
          }}>
            Ubicación del sitio
          </label>
          <div style={{
            height: 110, borderRadius: Z.r.md, border: `1.5px dashed ${Z.border}`,
            background: `linear-gradient(135deg, ${Z.blueLight} 0%, ${Z.divider} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 6,
          }}>
            <ZIcon name="map-pin" size={24} color={Z.blue} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: Z.textMuted }}>
              seleccionar ubicación
            </span>
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'personnel', label: '¿Necesita contratar personal?', value: needPersonnel, toggle: () => setNeedPersonnel((p) => !p) },
            { key: 'materials', label: '¿Necesita comprar material?',   value: needMaterials, toggle: () => setNeedMaterials((p) => !p) },
          ].map((sw) => (
            <div key={sw.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.text }}>
                {sw.label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={sw.value}
                onClick={sw.toggle}
                style={{
                  width: 44, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer',
                  background: sw.value ? Z.orange : Z.border, transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center', border: 'none', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'transform 0.2s',
                  transform: sw.value ? 'translateX(18px)' : 'translateX(0)',
                }} />
              </button>
            </div>
          ))}
        </div>

        {submitted && (
          <div
            role="status"
            style={{
              padding: '14px', borderRadius: Z.r.sm, background: '#DCFCE7',
              color: '#166534', fontFamily: Z.font, fontSize: 13, fontWeight: 700, textAlign: 'center',
            }}
          >
            ¡Proyecto creado exitosamente!
          </div>
        )}

        <ZButton disabled={!name.trim() || submitted} onClick={handleCreate}>
          Crear Proyecto
        </ZButton>
      </div>
    </div>
  )
}
