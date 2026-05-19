import { useState, useEffect } from 'react'
import { Z } from '@/shared/design/tokens'
import { ZIcon } from '@/shared/design/components/ZIcon'
import { ZButton } from '@/shared/design/components/ZButton'
import { ZInput } from '@/shared/design/components/ZInput'
import { SummaryCard } from '@/shared/design/shell/SummaryCard'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { ZHeader } from '@/shared/design/components/ZHeader'

// ── Data ──────────────────────────────────────────────────────────────────────
interface Project {
  id: number; name: string; status: string; date: string; budget: string; pedidos: number; desc: string
}

const PROJECTS: Project[] = [
  { id: 1, name: 'Casa Norte',             status: 'Activo',        date: '15 Mar', budget: '45,000',  pedidos: 8, desc: 'Construcción de vivienda unifamiliar en zona Norte, 2 plantas.' },
  { id: 2, name: 'Edificio Comercial Sur', status: 'Planificación', date: '02 May', budget: '280,000', pedidos: 0, desc: 'Edificio de oficinas, 6 pisos. Fase de diseño.' },
  { id: 3, name: 'Remodelación Oficina',   status: 'Completo',      date: '10 Ene', budget: '12,500',  pedidos: 5, desc: 'Remodelación interior de oficina corporativa.' },
  { id: 4, name: 'Vivienda Familiar',      status: 'Activo',        date: '28 Abr', budget: '38,000',  pedidos: 3, desc: 'Ampliación y acabados de vivienda en zona Este.' },
]

// ── Sub-icons ─────────────────────────────────────────────────────────────────
function IconPlus({ color = '#fff', size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

function IconCart({ color = Z.blue, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="21" r="1" fill={color} />
      <circle cx="20" cy="21" r="1" fill={color} />
      <path d="M1 1h4l2.7 13.4a1 1 0 001 .8h9.7a1 1 0 001-.8L21 7H6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMoney({ color = Z.orange, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function IconClock({ color = Z.orange, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" fill="none" />
      <path d="M12 8v4l3 2" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function ActivityItem({ title, subtitle, time, color = Z.orange }: { title: string; subtitle: string; time: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${Z.divider}` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>{title}</div>
        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textMuted, marginTop: 2 }}>{subtitle}</div>
      </div>
      <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</span>
    </div>
  )
}

// ── ProjectCard ───────────────────────────────────────────────────────────────
function ProjectCard({ project, onTap }: { project: Project; onTap: () => void }) {
  const statusColors: Record<string, { bg: string; text: string }> = {
    'Activo':        { bg: '#DCFCE7', text: '#16A34A' },
    'Planificación': { bg: Z.blueLight, text: Z.blueDark },
    'Completo':      { bg: Z.divider, text: Z.textMuted },
  }
  const sc = statusColors[project.status] ?? statusColors['Activo']

  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
        borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`,
        width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{project.name}</span>
        <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text }}>
          {project.status}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, fontWeight: 500 }}>Presupuesto</div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>Bs {project.budget}</div>
        </div>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, fontWeight: 500 }}>Pedidos</div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>{project.pedidos}</div>
        </div>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, fontWeight: 500 }}>Fecha</div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>{project.date}</div>
        </div>
      </div>
    </button>
  )
}

// ── ProjectDetail ─────────────────────────────────────────────────────────────
function ProjectDetail({ project, onBack }: { project: Project; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ZHeader title={project.name} onBack={onBack} />
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ height: 130, borderRadius: Z.r.lg, background: `linear-gradient(135deg, ${Z.divider}, ${Z.orangeLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 11, color: Z.textMuted }}>
          sitio de construcción
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <SummaryCard icon={<IconClock color={Z.orange} size={16} />} label="Estado" value={project.status} color={Z.orange} />
          <SummaryCard icon={<IconCart color={Z.blue} size={16} />} label="Pedidos" value={project.pedidos} color={Z.blue} />
          <SummaryCard icon={<IconMoney color={Z.orange} size={16} />} label="Presupuesto" value={`${project.budget}`} color={Z.orange} />
        </div>

        <div style={{ padding: '14px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}` }}>
          <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textMuted, marginBottom: 6 }}>Descripción</div>
          <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.text, lineHeight: 1.5 }}>{project.desc}</div>
        </div>

        <div>
          <SectionTitle title="Historial de Compras" />
          <div style={{ marginTop: 10 }}>
            <ActivityItem title="50 bolsas Cemento IP-30"     subtitle="Bs 3,100 · Ferretería San José"    time="15 Mar" color={Z.orange} />
            <ActivityItem title="20 barras Fierro 12mm"       subtitle="Bs 1,700 · Distribuidora Central"  time="12 Mar" color={Z.blue} />
            <ActivityItem title="Arena Fina 2m³"              subtitle="Bs 700 · Cantera Sur"              time="10 Mar" color={Z.orange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <ZButton style={{ flex: 1 }}>Comprar Materiales</ZButton>
          <ZButton variant="secondary" style={{ flex: 1 }}>Contratar</ZButton>
        </div>
      </div>
    </div>
  )
}

// ── NewProjectForm ────────────────────────────────────────────────────────────
function NewProjectForm({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [budget, setBudget] = useState('')
  const [needPersonnel, setNeedPersonnel] = useState(false)
  const [needMaterials, setNeedMaterials] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleCreate() {
    setSubmitted(true)
    setTimeout(onBack, 1800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ZHeader title="Nuevo Proyecto" onBack={onBack} />
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{
          height: 120, borderRadius: Z.r.lg, border: `2px dashed ${Z.border}`,
          background: Z.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8, cursor: 'pointer',
        }}>
          <ZIcon name="map-pin" size={28} color={Z.textMuted} />
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textMuted }}>Toca para agregar foto del sitio</span>
        </div>

        <ZInput label="Nombre del proyecto" placeholder="Ej: Casa Norte" value={name} onChange={setName} />

        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 6 }}>Descripción</label>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Describe brevemente el proyecto..."
            style={{ width: '100%', height: 80, borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`, padding: 14, fontFamily: Z.font, fontSize: 14, color: Z.text, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <ZInput label="Presupuesto estimado (Bs)" type="number" placeholder="Ej: 50000" value={budget} onChange={setBudget} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'needPersonnel', label: '¿Necesita contratar personal?', value: needPersonnel, toggle: () => setNeedPersonnel(p => !p) },
            { key: 'needMaterials', label: '¿Necesita comprar material?',   value: needMaterials, toggle: () => setNeedMaterials(p => !p) },
          ].map(sw => (
            <div key={sw.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span id={`toggle-label-${sw.key}`} style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.text }}>{sw.label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={sw.value}
                aria-labelledby={`toggle-label-${sw.key}`}
                onClick={sw.toggle}
                style={{ width: 44, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer', background: sw.value ? Z.orange : Z.border, transition: 'background 0.2s', display: 'flex', alignItems: 'center', border: 'none', flexShrink: 0 }}
              >
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'transform 0.2s', transform: sw.value ? 'translateX(18px)' : 'translateX(0)' }} />
              </button>
            </div>
          ))}
        </div>

        {submitted && (
          <div role="status" style={{ padding: '14px', borderRadius: Z.r.sm, background: '#DCFCE7', color: '#166534', fontFamily: Z.font, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
            ¡Proyecto creado exitosamente!
          </div>
        )}
        <ZButton disabled={!name || submitted} onClick={handleCreate}>
          Crear Proyecto
        </ZButton>
      </div>
    </div>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
type ProjScreen = 'list' | 'detail' | 'form'

interface ConstructorProyectosTabProps {
  openForm?: boolean
  onFormOpened?: () => void
}

export function ConstructorProyectosTab({ openForm = false, onFormOpened }: ConstructorProyectosTabProps) {
  const [filter, setFilter] = useState('Todos')
  const [screen, setScreen] = useState<ProjScreen>(openForm ? 'form' : 'list')
  const [selected, setSelected] = useState<Project | null>(null)

  useEffect(() => {
    if (openForm) onFormOpened?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filters = ['Todos', 'Planificación', 'Activos', 'Completos']
  const filtered = filter === 'Todos'
    ? PROJECTS
    : PROJECTS.filter(p =>
        filter === 'Activos' ? p.status === 'Activo' :
        filter === 'Planificación' ? p.status === 'Planificación' :
        p.status === 'Completo'
      )

  if (screen === 'detail' && selected) {
    return <ProjectDetail project={selected} onBack={() => setScreen('list')} />
  }
  if (screen === 'form') {
    return <NewProjectForm onBack={() => setScreen('list')} />
  }

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Proyectos</h2>
        <button
          onClick={() => setScreen('form')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px',
            borderRadius: 20, border: 'none', cursor: 'pointer',
            background: Z.orangeDark, color: '#fff', outline: 'none',
            fontFamily: Z.font, fontSize: 12, fontWeight: 700,
          }}
        >
          <IconPlus color="#fff" size={14} /> Nuevo
        </button>
      </div>

      {/* ≤4 filters → visible chip buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {filters.map(f => {
          const isActive = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex: 1,
                padding: '9px 4px',
                borderRadius: 12,
                border: isActive ? 'none' : `1.5px solid ${Z.border}`,
                background: isActive ? Z.orangeDark : Z.surface,
                color: isActive ? '#fff' : Z.textSec,
                fontFamily: Z.font, fontSize: 11, fontWeight: 700,
                cursor: 'pointer', outline: 'none',
                transition: 'background 0.18s, transform 0.12s',
                transform: isActive ? 'scale(1.04)' : 'scale(1)',
                boxShadow: isActive ? '0 3px 10px rgba(164,55,0,0.25)' : 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(p => (
          <ProjectCard key={p.id} project={p} onTap={() => { setSelected(p); setScreen('detail') }} />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <ZIcon name="search" size={40} color={Z.textMuted} />
            <p style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.textMuted, marginTop: 12 }}>No hay proyectos en esta categoría</p>
          </div>
        )}
      </div>
    </div>
  )
}
