import { useState } from 'react'
import { Z } from '../../shared/design/tokens'
import { ZIcon } from '../../shared/design/components'
import { NavIconMsg } from '../../shared/design/shell'


function ChevronDown({ size = 16, color = Z.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronUp({ size = 16, color = Z.textMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M18 15l-6-6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface ChecklistItem {
  label: string
  done: boolean
}

interface Project {
  id: number
  name: string
  client: string
  progress: number
  checklist: ChecklistItem[]
  budget: number
  start: string
  dueDate: string
  status: 'en_curso' | 'pausado' | 'completado'
  nextMilestone: string
}

const W_PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Casa Norte',
    client: 'Juan Mamani',
    progress: 60,
    status: 'en_curso',
    dueDate: '15 Abr',
    nextMilestone: 'Paredes 2do piso',
    budget: 3000,
    start: '01 Mar',
    checklist: [
      { label: 'Excavación y nivelación', done: true },
      { label: 'Columnas y vigas', done: true },
      { label: 'Paredes primer piso', done: true },
      { label: 'Paredes segundo piso', done: false },
      { label: 'Enlucido interior', done: false },
      { label: 'Acabados finales', done: false },
    ],
  },
  {
    id: 2,
    name: 'Reparación Techo',
    client: 'María López',
    progress: 30,
    status: 'pausado',
    dueDate: '28 Mar',
    nextMilestone: 'Retiro material',
    budget: 800,
    start: '12 Mar',
    checklist: [
      { label: 'Inspección y diagnóstico', done: true },
      { label: 'Retiro material dañado', done: false },
      { label: 'Sellado y colocación', done: false },
    ],
  },
  {
    id: 3,
    name: 'Pisos Quispe',
    client: 'Pedro Quispe',
    progress: 100,
    status: 'completado',
    dueDate: '01 Mar',
    nextMilestone: '—',
    budget: 1500,
    start: '15 Feb',
    checklist: [
      { label: 'Medición', done: true },
      { label: 'Colocación', done: true },
      { label: 'Sellado', done: true },
    ],
  },
]

type StatusFilter = 'en_curso' | 'pausado' | 'completado' | 'todos'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'en_curso', label: 'En curso' },
  { key: 'pausado', label: 'Pausados' },
  { key: 'completado', label: 'Completados' },
  { key: 'todos', label: 'Todos' },
]

function getStatusBadge(status: Project['status']): { bg: string; color: string; label: string } {
  switch (status) {
    case 'en_curso':
      return { bg: Z.orangeLight, color: Z.orangeDark, label: 'En Curso' }
    case 'pausado':
      return { bg: 'var(--color-status-warning-bg)', color: 'var(--color-status-warning-text)', label: 'Pausado' }
    case 'completado':
      return { bg: 'var(--color-status-success-bg)', color: 'var(--color-status-success-text)', label: 'Completado' }
  }
}

export function ProyectosTabTrabajador() {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('en_curso')
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [checklists, setChecklists] = useState<ChecklistItem[][]>(
    W_PROJECTS.map((p) => p.checklist)
  )

  const toggleItem = (projIdx: number, itemIdx: number) => {
    setChecklists((prev) =>
      prev.map((cl, pi) =>
        pi === projIdx
          ? cl.map((item, ii) => (ii === itemIdx ? { ...item, done: !item.done } : item))
          : cl
      )
    )
  }

  const filteredProjects = activeFilter === 'todos'
    ? W_PROJECTS
    : W_PROJECTS.filter((p) => p.status === activeFilter)

  const enCursoCount = W_PROJECTS.filter((p) => p.status === 'en_curso').length
  const completadoCount = W_PROJECTS.filter((p) => p.status === 'completado').length

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
            Mis Proyectos
          </h2>
          <p style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, margin: '4px 0 0' }}>
            {enCursoCount} en curso · {completadoCount} completado{completadoCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          style={{
            fontFamily: Z.font,
            fontSize: 13,
            fontWeight: 700,
            color: Z.textSec,
            background: Z.surface,
            border: `1.5px solid ${Z.border}`,
            borderRadius: Z.r.sm,
            padding: '8px 14px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          Ordenar
        </button>
      </div>

      {/* Status Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: '0 20px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {STATUS_TABS.map((tab) => {
          const active = activeFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                flexShrink: 0,
                fontFamily: Z.font,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                padding: '7px 16px',
                borderRadius: Z.r.full,
                border: 'none',
                background: active ? Z.orange : Z.surface,
                color: active ? '#fff' : Z.textSec,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: active ? `0 2px 8px rgba(232,115,58,0.3)` : `0 1px 3px rgba(0,0,0,0.06)`,
                transition: 'all 0.18s ease',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Project Cards */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {filteredProjects.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: Z.textMuted,
              fontFamily: Z.font,
              fontSize: 14,
            }}
          >
            No hay proyectos en este estado.
          </div>
        )}

        {filteredProjects.map((project) => {
          const pIdx = W_PROJECTS.findIndex((p) => p.id === project.id)
          const cl = checklists[pIdx]
          const pct = project.status === 'completado'
            ? 100
            : Math.round((cl.filter((i) => i.done).length / cl.length) * 100)
          const isOpen = selectedProject === project.id
          const badge = getStatusBadge(project.status)

          return (
            <div
              key={project.id}
              style={{
                borderRadius: Z.r.md,
                background: Z.surface,
                border: `1.5px solid ${Z.border}`,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setSelectedProject(isOpen ? null : project.id)}
                style={{
                  width: '100%',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  outline: 'none',
                  textAlign: 'left',
                }}
              >
                {/* Name + Badge */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 800, color: Z.text }}>
                        {project.name}
                      </span>
                      <span
                        style={{
                          fontFamily: Z.font,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: Z.r.full,
                          background: badge.bg,
                          color: badge.color,
                          flexShrink: 0,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    {/* Client + Dates */}
                    <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 4 }}>
                      {project.client} · {project.start} → {project.dueDate}
                    </div>
                  </div>
                  {isOpen ? <ChevronUp /> : <ChevronDown />}
                </div>

                {/* Progress Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec }}>
                      {cl.filter((i) => i.done).length}/{cl.length} hitos
                    </span>
                    <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 800, color: Z.orangeDark }}>
                      {pct}%
                    </span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: Z.divider, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 4,
                        width: `${pct}%`,
                        background: project.status === 'completado'
                          ? '#4CAF50'
                          : project.status === 'pausado'
                          ? '#FBC02D'
                          : `linear-gradient(90deg, ${Z.orange}, ${Z.orangeDark})`,
                        transition: 'width 0.5s',
                      }}
                    />
                  </div>
                </div>

                {/* Next Milestone + Budget */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {project.status !== 'completado' ? (
                    <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec }}>
                      Próximo: <strong style={{ color: Z.text }}>{project.nextMilestone}</strong>
                    </span>
                  ) : (
                    <span style={{ fontFamily: Z.font, fontSize: 11, color: '#2E7D32', fontWeight: 600 }}>
                      Proyecto terminado
                    </span>
                  )}
                  <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark }}>
                    Bs {project.budget.toLocaleString()}
                  </span>
                </div>
              </button>

              {/* Expanded Checklist */}
              {isOpen && (
                <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${Z.divider}` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, marginBottom: 14 }}>
                    {cl.map((item, iIdx) => (
                      <button
                        key={iIdx}
                        onClick={() => toggleItem(pIdx, iIdx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 12px',
                          borderRadius: Z.r.sm,
                          border: 'none',
                          background: item.done ? Z.orangeLight : Z.divider,
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                          outline: 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            flexShrink: 0,
                            background: item.done ? Z.orange : Z.surface,
                            border: `2px solid ${item.done ? Z.orange : Z.border}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {item.done && <ZIcon name="check" size={13} color="#fff" />}
                        </div>
                        <span
                          style={{
                            fontFamily: Z.font,
                            fontSize: 13,
                            fontWeight: 500,
                            color: item.done ? Z.textSec : Z.text,
                            textDecoration: item.done ? 'line-through' : 'none',
                          }}
                        >
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '10px',
                        borderRadius: Z.r.sm,
                        border: `1.5px solid ${Z.border}`,
                        background: Z.surface,
                        cursor: 'pointer',
                        outline: 'none',
                        fontFamily: Z.font,
                        fontSize: 12,
                        fontWeight: 600,
                        color: Z.textSec,
                      }}
                    >
                      <NavIconMsg color={Z.textSec} size={16} /> Chat
                    </button>
                    <button
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        padding: '10px',
                        borderRadius: Z.r.sm,
                        border: 'none',
                        background: Z.orangeDark,
                        cursor: 'pointer',
                        outline: 'none',
                        fontFamily: Z.font,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#fff',
                      }}
                    >
                      Actualizar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
