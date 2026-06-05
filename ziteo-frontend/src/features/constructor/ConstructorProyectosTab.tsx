import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Z } from '@/shared/design/tokens'
import { ZIcon } from '@/shared/design/components/ZIcon'
import { ZButton } from '@/shared/design/components/ZButton'
import { ZInput } from '@/shared/design/components/ZInput'
import { ZSelect } from '@/shared/design/components/ZSelect'
import { ZHeader } from '@/shared/design/components/ZHeader'
import { SummaryCard } from '@/shared/design/shell/SummaryCard'
import { SectionTitle } from '@/shared/design/shell/SectionTitle'
import { CIUDADES_ACTIVAS } from '@/shared/constants/geography'
import { Toast } from '@/shared/components/Toast'
import { useToast } from '@/shared/hooks/useToast'
import { MapPicker, type MapPickerValue } from '@/shared/components/MapPicker'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '../auth/store/authStore'
import { useProyectos, useCreateProyecto } from '../proyectos/hooks/useProyectos'
import type { ProjectCard as ProjectRow, ProjectStatus } from '../proyectos/types/proyectosTypes'
import { AdBanner } from '@/shared/components/AdBanner'

// ── Status label helpers ──────────────────────────────────────────────────────
const STATUS_LABEL: Record<ProjectStatus, string> = {
  planning:  'Planificación',
  active:    'Activo',
  completed: 'Completo',
  paused:    'Pausado',
}
const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  planning:  { bg: Z.blueLight,   text: Z.blueDark   },
  active:    { bg: '#DCFCE7',     text: '#16A34A'    },
  completed: { bg: Z.divider,     text: Z.textMuted  },
  paused:    { bg: Z.orangeLight, text: Z.orangeDark },
}
const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning',  label: 'Planificación' },
  { value: 'active',    label: 'Activo'        },
  { value: 'completed', label: 'Completo'      },
]

function formatShortDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' }).replace('.', '')
  } catch {
    return ''
  }
}
function formatBudget(n: number | null): string {
  if (n == null) return '—'
  return n.toLocaleString('es-BO')
}

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
function ProjectCard({ project, onTap }: { project: ProjectRow; onTap: () => void }) {
  const sc = STATUS_COLORS[project.status] ?? STATUS_COLORS.planning
  return (
    <button
      onClick={onTap}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
        borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`,
        width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.name}</span>
        <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.text, flexShrink: 0 }}>
          {STATUS_LABEL[project.status]}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, fontWeight: 500 }}>Presupuesto</div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>Bs {formatBudget(project.estimated_budget)}</div>
        </div>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, fontWeight: 500 }}>Postulaciones</div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>{project.application_count}</div>
        </div>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, fontWeight: 500 }}>Fecha</div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>{formatShortDate(project.created_at)}</div>
        </div>
      </div>
    </button>
  )
}

// ── Project history hook (orders + contracts) ────────────────────────────────
interface OrderHist {
  id: string
  total: number
  status: string | null
  created_at: string | null
  provider: { name: string } | null
}
interface ContractHist {
  id: string
  status: string
  budget: number | null
  description: string | null
  maestro: { name: string } | null
}

function useProjectHistory(projectId: string) {
  return useQuery<{ orders: OrderHist[]; contracts: ContractHist[] }>({
    queryKey: ['proyecto-historial', projectId],
    enabled: !!projectId,
    queryFn: async () => {
      const [ordersRes, contractsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total, status, created_at, provider:profiles!orders_provider_id_fkey(name)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('contracts')
          .select('id, status, budget, description, maestro:profiles!contracts_maestro_id_fkey(name)')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(10),
      ])
      if (ordersRes.error) throw ordersRes.error
      if (contractsRes.error) throw contractsRes.error
      return {
        orders: (ordersRes.data ?? []) as unknown as OrderHist[],
        contracts: (contractsRes.data ?? []) as unknown as ContractHist[],
      }
    },
  })
}

// ── Status menu (dropdown) ────────────────────────────────────────────────────
function StatusMenu({ current, onPick, onClose }: { current: ProjectStatus; onPick: (s: ProjectStatus) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [onClose])
  return (
    <div
      ref={ref}
      style={{
        position: 'absolute', top: '110%', right: 0, zIndex: 30,
        background: Z.surface, border: `1px solid ${Z.border}`,
        borderRadius: Z.r.md, boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        minWidth: 160, overflow: 'hidden',
      }}
    >
      {STATUS_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onPick(opt.value)}
          style={{
            width: '100%', textAlign: 'left', padding: '10px 14px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontFamily: Z.font, fontSize: 13,
            fontWeight: opt.value === current ? 700 : 500,
            color: opt.value === current ? Z.orangeDark : Z.text,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── ProjectDetail ─────────────────────────────────────────────────────────────
function ProjectDetail({
  project,
  onBack,
  onNavigate,
  showToast,
}: {
  project: ProjectRow
  onBack: () => void
  onNavigate?: (dest: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}) {
  const queryClient = useQueryClient()
  const [menuOpen, setMenuOpen] = useState(false)
  const [statusLocal, setStatusLocal] = useState<ProjectStatus>(project.status)
  const isCompleted = statusLocal === 'completed'
  const sc = STATUS_COLORS[statusLocal] ?? STATUS_COLORS.planning

  const { data: history, isLoading: historyLoading } = useProjectHistory(project.id)

  async function handlePickStatus(newStatus: ProjectStatus) {
    setMenuOpen(false)
    if (newStatus === statusLocal) return
    const prev = statusLocal
    setStatusLocal(newStatus)
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', project.id)
    if (error) {
      setStatusLocal(prev)
      showToast('Error al actualizar estado', 'error')
      return
    }
    queryClient.invalidateQueries({ queryKey: ['proyectos'] })
    queryClient.invalidateQueries({ queryKey: ['proyecto', project.id] })
    showToast('Estado actualizado', 'success')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <ZHeader title={project.name} onBack={onBack} />
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Hero */}
        {project.photo_url ? (
          <img src={project.photo_url} alt={project.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: Z.r.lg }} />
        ) : (
          <div style={{ height: 130, borderRadius: Z.r.lg, background: `linear-gradient(135deg, ${Z.divider}, ${Z.orangeLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>
            Sitio del proyecto
          </div>
        )}

        {/* Status chip (clickable unless completed) */}
        <div style={{ position: 'relative', alignSelf: 'flex-start' }}>
          <button
            onClick={() => { if (!isCompleted) setMenuOpen(v => !v) }}
            disabled={isCompleted}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 20,
              background: sc.bg, color: sc.text,
              fontFamily: Z.font, fontSize: 12, fontWeight: 700,
              border: 'none', cursor: isCompleted ? 'default' : 'pointer', outline: 'none',
            }}
            aria-label="Cambiar estado del proyecto"
          >
            {STATUS_LABEL[statusLocal]}
            {!isCompleted && (
              <svg width="10" height="6" viewBox="0 0 12 7" style={{ display: 'inline-block' }}>
                <path d="M1 1l5 5 5-5" stroke={sc.text} strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            )}
          </button>
          {menuOpen && (
            <StatusMenu current={statusLocal} onPick={handlePickStatus} onClose={() => setMenuOpen(false)} />
          )}
        </div>

        {/* Summary cards */}
        <div style={{ display: 'flex', gap: 10 }}>
          <SummaryCard icon={<IconClock color={Z.orange} size={16} />} label="Estado" value={STATUS_LABEL[statusLocal]} color={Z.orange} />
          <SummaryCard icon={<IconCart color={Z.blue} size={16} />} label="Pedidos" value={history?.orders.length ?? 0} color={Z.blue} />
          <SummaryCard icon={<IconMoney color={Z.orange} size={16} />} label="Presupuesto" value={`${formatBudget(project.estimated_budget)}`} color={Z.orange} />
        </div>

        {/* Description */}
        {(project.description || project.location_address || project.city) && (
          <div style={{ padding: '14px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}` }}>
            {project.description && (
              <>
                <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textMuted, marginBottom: 6 }}>Descripción</div>
                <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.text, lineHeight: 1.5 }}>{project.description}</div>
              </>
            )}
            {(project.city || project.location_address) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: project.description ? 10 : 0, fontFamily: Z.font, fontSize: 12, color: Z.textMuted }}>
                <ZIcon name="map-pin" size={14} color={Z.textMuted} />
                <span>{[project.city, project.location_address].filter(Boolean).join(' · ')}</span>
              </div>
            )}
          </div>
        )}

        {/* Equipo contratado */}
        <div>
          <SectionTitle title="Equipo Contratado" />
          <div style={{ marginTop: 10 }}>
            {historyLoading ? (
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, padding: '12px 0' }}>Cargando…</div>
            ) : !history?.contracts.length ? (
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, padding: '12px 0' }}>Aún no hay contratos vinculados.</div>
            ) : (
              history.contracts.map(c => (
                <ActivityItem
                  key={c.id}
                  title={c.maestro?.name ?? 'Maestro'}
                  subtitle={`${c.status}${c.budget != null ? ` · Bs ${formatBudget(c.budget)}` : ''}${c.description ? ` · ${c.description}` : ''}`}
                  time=""
                  color={c.status === 'active' ? Z.orange : Z.blue}
                />
              ))
            )}
          </div>
        </div>

        {/* Historial de compras */}
        <div>
          <SectionTitle title="Historial de Compras" />
          <div style={{ marginTop: 10 }}>
            {historyLoading ? (
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, padding: '12px 0' }}>Cargando…</div>
            ) : !history?.orders.length ? (
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, padding: '12px 0' }}>Aún no hay pedidos en este proyecto.</div>
            ) : (
              history.orders.map(o => (
                <ActivityItem
                  key={o.id}
                  title={`Pedido #${o.id.slice(0, 6).toUpperCase()}`}
                  subtitle={`Bs ${formatBudget(o.total)} · ${o.provider?.name ?? 'Proveedor'}${o.status ? ` · ${o.status}` : ''}`}
                  time={o.created_at ? formatShortDate(o.created_at) : ''}
                  color={Z.orange}
                />
              ))
            )}
          </div>
        </div>

        {/* CTAs only when not completed */}
        {!isCompleted && onNavigate && (
          <div style={{ display: 'flex', gap: 10 }}>
            <ZButton style={{ flex: 1 }} onClick={() => onNavigate('tienda')}>Comprar Materiales</ZButton>
            <ZButton variant="secondary" style={{ flex: 1 }} onClick={() => onNavigate('contratar')}>Contratar</ZButton>
          </div>
        )}
      </div>
    </div>
  )
}

// ── NewProjectForm ────────────────────────────────────────────────────────────
function NewProjectForm({ onBack, onCreated }: { onBack: () => void; onCreated: () => void }) {
  const user = useAuthStore(s => s.user)
  const { mutate: createProyecto, isPending } = useCreateProyecto()
  const { toasts, showToast, removeToast } = useToast()

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [city, setCity] = useState(user?.city ?? '')
  const [budget, setBudget] = useState('')
  const [loc, setLoc] = useState<MapPickerValue | null>(null)
  const [needsMaestro, setNeedsMaestro] = useState(false)
  const [needsMaterials, setNeedsMaterials] = useState(false)

  function handleCreate() {
    if (!user?.user_id) return
    if (name.trim().length < 3) {
      showToast('El nombre debe tener al menos 3 caracteres', 'error')
      return
    }
    if (!city) {
      showToast('Selecciona una ciudad', 'error')
      return
    }
    createProyecto(
      {
        constructor_id: user.user_id,
        name: name.trim(),
        description: desc.trim() || null,
        location_address: loc?.address || null,
        location_lat: loc?.lat || null,
        location_lng: loc?.lng || null,
        estimated_budget: budget ? Number(budget) : null,
        status: 'planning',
        photo_url: null,
        start_date: null,
        needs_maestro: needsMaestro,
        needs_materials: needsMaterials,
        city,
      },
      {
        onSuccess: () => {
          showToast('Proyecto creado', 'success')
          setTimeout(onCreated, 700)
        },
        onError: err => {
          const msg = err instanceof Error ? err.message : 'Error al crear el proyecto'
          showToast(msg, 'error')
        },
      }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Toast toasts={toasts} onRemove={removeToast} />
      <ZHeader title="Nuevo Proyecto" onBack={onBack} />
      <div style={{ padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <ZInput label="Nombre del proyecto" placeholder="Ej: Casa Norte" value={name} onChange={setName} />

        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 6 }}>Descripción</label>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Describe brevemente el proyecto..."
            style={{ width: '100%', height: 90, borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`, padding: 14, fontFamily: Z.font, fontSize: 14, color: Z.text, background: Z.surface, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <ZSelect label="Ciudad" value={city} onChange={setCity} placeholder="Selecciona ciudad" options={[...CIUDADES_ACTIVAS]} />

        <MapPicker
          label="Ubicación de la obra (GPS o pin en el mapa)"
          value={loc}
          onChange={setLoc}
          placeholder="Ej: Av. Las Américas #456"
          height={240}
        />

        <ZInput label="Presupuesto estimado (Bs)" type="number" placeholder="Ej: 50000" value={budget} onChange={setBudget} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'maestro',  label: '¿Necesita contratar personal?', value: needsMaestro,   toggle: () => setNeedsMaestro(p => !p) },
            { key: 'material', label: '¿Necesita comprar material?',   value: needsMaterials, toggle: () => setNeedsMaterials(p => !p) },
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

        <ZButton disabled={isPending} onClick={handleCreate}>
          {isPending ? 'Creando…' : 'Crear Proyecto'}
        </ZButton>
      </div>
    </div>
  )
}

// ── City filter bottom sheet ──────────────────────────────────────────────────
function CitySheet({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', background: Z.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: '20px 20px 24px' }}
      >
        <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text, marginBottom: 12 }}>Filtrar por ciudad</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => { onChange(''); onClose() }}
            style={{
              padding: '12px 16px', borderRadius: 12, textAlign: 'left',
              background: value === '' ? Z.orangeLight : Z.surface,
              color: value === '' ? Z.orangeDark : Z.text,
              border: `1px solid ${value === '' ? Z.orangeDark : Z.border}`,
              fontFamily: Z.font, fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Todas
          </button>
          {CIUDADES_ACTIVAS.map(c => (
            <button
              key={c}
              onClick={() => { onChange(c); onClose() }}
              style={{
                padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                background: value === c ? Z.orangeLight : Z.surface,
                color: value === c ? Z.orangeDark : Z.text,
                border: `1px solid ${value === c ? Z.orangeDark : Z.border}`,
                fontFamily: Z.font, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Tab ──────────────────────────────────────────────────────────────────
type ProjScreen = 'list' | 'detail' | 'form'
type StatusFilter = 'Todos' | 'Planificación' | 'Activos' | 'Completos'
const FILTER_TO_STATUS: Record<Exclude<StatusFilter, 'Todos'>, ProjectStatus> = {
  'Planificación': 'planning',
  'Activos':       'active',
  'Completos':     'completed',
}

interface ConstructorProyectosTabProps {
  openForm?: boolean
  onFormOpened?: () => void
  onNavigate?: (dest: string) => void
}

export function ConstructorProyectosTab({ openForm = false, onFormOpened, onNavigate }: ConstructorProyectosTabProps) {
  const user = useAuthStore(s => s.user)
  const [filter, setFilter] = useState<StatusFilter>('Todos')
  const [cityFilter, setCityFilter] = useState<string>('')
  const [showCitySheet, setShowCitySheet] = useState(false)
  const [screen, setScreen] = useState<ProjScreen>(openForm ? 'form' : 'list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    if (openForm) onFormOpened?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const statusFilter = filter === 'Todos' ? undefined : FILTER_TO_STATUS[filter]
  const { data: projects = [], isLoading } = useProyectos({
    constructor_id: user?.user_id,
    status: statusFilter,
    city: cityFilter || undefined,
  })

  const selected = selectedId ? projects.find(p => p.id === selectedId) ?? null : null

  if (screen === 'detail' && selected) {
    return (
      <>
        <Toast toasts={toasts} onRemove={removeToast} />
        <ProjectDetail
          project={selected}
          onBack={() => { setScreen('list'); setSelectedId(null) }}
          onNavigate={onNavigate}
          showToast={showToast}
        />
      </>
    )
  }
  if (screen === 'form') {
    return (
      <NewProjectForm
        onBack={() => setScreen('list')}
        onCreated={() => setScreen('list')}
      />
    )
  }

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Toast toasts={toasts} onRemove={removeToast} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Proyectos</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowCitySheet(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '11px 14px',
              borderRadius: 20, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
              background: Z.surface, color: Z.text, outline: 'none',
              fontFamily: Z.font, fontSize: 12, fontWeight: 700,
            }}
            aria-label="Filtrar por ciudad"
          >
            <ZIcon name="map-pin" size={14} color={Z.text} />
            {cityFilter || 'Ciudad'}
          </button>
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
      </div>

      {/* Status chips */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['Todos', 'Planificación', 'Activos', 'Completos'] as StatusFilter[]).map(f => {
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

      <AdBanner variant="banner" />

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          <>
            <div style={{ height: 88, borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`, opacity: 0.5 }} />
            <div style={{ height: 88, borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`, opacity: 0.5 }} />
          </>
        ) : projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <ZIcon name="search" size={40} color={Z.textMuted} />
            <p style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.textMuted, marginTop: 12 }}>
              {filter === 'Todos' && !cityFilter ? 'Aún no tienes proyectos' : 'No hay proyectos en esta categoría'}
            </p>
            {filter === 'Todos' && !cityFilter && (
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                <ZButton fullWidth={false} onClick={() => setScreen('form')}>Crear primer proyecto</ZButton>
              </div>
            )}
          </div>
        ) : (
          projects.map(p => (
            <ProjectCard key={p.id} project={p} onTap={() => { setSelectedId(p.id); setScreen('detail') }} />
          ))
        )}
      </div>

      {showCitySheet && (
        <CitySheet value={cityFilter} onChange={setCityFilter} onClose={() => setShowCitySheet(false)} />
      )}
    </div>
  )
}
