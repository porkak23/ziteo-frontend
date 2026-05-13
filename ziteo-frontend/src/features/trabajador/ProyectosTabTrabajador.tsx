import { useState } from 'react'
import { Z } from '../../shared/design/tokens'
import { ZIcon } from '../../shared/design/components'
import { NavIconMsg } from '../../shared/design/shell'

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
}

const W_PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Casa Norte',
    client: 'Juan Mamani',
    progress: 60,
    checklist: [
      { label: 'Excavación y nivelación', done: true },
      { label: 'Columnas y vigas', done: true },
      { label: 'Paredes primer piso', done: true },
      { label: 'Paredes segundo piso', done: false },
      { label: 'Enlucido interior', done: false },
      { label: 'Acabados finales', done: false },
    ],
    budget: 3000,
    start: '01 Mar',
  },
  {
    id: 2,
    name: 'Reparación Techo',
    client: 'María López',
    progress: 30,
    checklist: [
      { label: 'Inspección y diagnóstico', done: true },
      { label: 'Retiro material dañado', done: false },
      { label: 'Sellado y colocación', done: false },
    ],
    budget: 800,
    start: '12 Mar',
  },
]

function getProgress(cl: ChecklistItem[]): number {
  const done = cl.filter((i) => i.done).length
  return Math.round((done / cl.length) * 100)
}

export function ProyectosTabTrabajador() {
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

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
        Proyectos en Curso
      </h2>

      {W_PROJECTS.map((project, pIdx) => {
        const cl = checklists[pIdx]
        const pct = getProgress(cl)
        const isOpen = selectedProject === project.id

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 800, color: Z.text }}>
                    {project.name}
                  </span>
                  <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>
                    {project.client} · desde {project.start}
                  </div>
                </div>
                <span style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.orangeDark }}>
                  {pct}%
                </span>
              </div>

              <div style={{ height: 8, borderRadius: 4, background: Z.divider, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    borderRadius: 4,
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${Z.orange}, ${Z.orangeDark})`,
                    transition: 'width 0.5s',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec }}>
                  {cl.filter((i) => i.done).length}/{cl.length} hitos
                </span>
                <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.orangeDark }}>
                  Bs {project.budget.toLocaleString()}
                </span>
              </div>
            </button>

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
  )
}
