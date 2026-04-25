import { useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { useProyectos } from '../hooks/useProyectos'
import { ProjectCard } from './ProjectCard'
import { ProjectDetailScreen } from './ProjectDetailScreen'
import { NuevoProyectoForm } from './NuevoProyectoForm'
import { BOLIVIAN_CITIES } from '../../auth/constants/authConstants'
import type { ProjectStatus, ProjectCard as ProjectCardType } from '../types/proyectosTypes'
import { AdBanner } from '../../../shared/components/AdBanner'

// -- ALTER TABLE projects ADD COLUMN IF NOT EXISTS city varchar;

const FILTER_OPTIONS: { value: ProjectStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'planning', label: 'Planificación' },
  { value: 'active', label: 'Activos' },
  { value: 'completed', label: 'Completados' },
]

export function ProyectosScreen() {
  const user = useAuthStore((s) => s.user)
  const [selectedCity, setSelectedCity] = useState<string>(user?.city ?? '')
  const [showCitySheet, setShowCitySheet] = useState(false)

  const [activeTab, setActiveTab] = useState<'todos' | 'mis_proyectos'>('todos')
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | 'todos'>('todos')
  const [showForm, setShowForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectCardType | null>(null)
  
  const active_role = user?.active_role

  const constructor_id = activeTab === 'mis_proyectos' && active_role === 'constructor' ? user?.user_id : undefined
  const { data: projects = [], isLoading } = useProyectos({
    status: activeFilter !== 'todos' ? activeFilter : undefined,
    constructor_id,
    city: selectedCity !== '' ? selectedCity : undefined,
  })

  const handleFormSuccess = () => {
    setShowForm(false)
  }

  if (selectedProject) {
    return (
      <ProjectDetailScreen
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    )
  }

  return (
    <>
      <div className="flex flex-col gap-3 py-3">
        {active_role === 'constructor' && (
          <div className="flex border-b border-outline-variant px-4">
            <button
              onClick={() => setActiveTab('todos')}
              className={`flex-1 pb-2 text-sm font-label font-medium border-b-2 transition-colors ${
                activeTab === 'todos'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab('mis_proyectos')}
              className={`flex-1 pb-2 text-sm font-label font-medium border-b-2 transition-colors ${
                activeTab === 'mis_proyectos'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-on-surface-variant'
              }`}
            >
              Mis proyectos
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 mt-2 px-4">
          {/* City filter button */}
          <button
            onClick={() => setShowCitySheet(true)}
            className="flex items-center gap-2 self-start rounded-full px-4 py-2 border border-outline-variant bg-surface-container text-on-surface text-sm font-label"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            {selectedCity !== '' ? selectedCity : 'Filtrar ciudad'}
          </button>

          {/* Status tabs grid */}
          <div className="grid grid-cols-4 gap-1 bg-surface-container rounded-2xl p-1">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className={`rounded-xl py-2 text-xs font-label transition-colors ${
                  activeFilter === f.value
                    ? 'bg-surface text-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* City bottom sheet */}
        {showCitySheet && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowCitySheet(false)}>
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative bg-background rounded-t-3xl px-4 pt-4 pb-6 max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-label font-semibold text-on-surface mb-3">Selecciona una ciudad</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setSelectedCity(''); setShowCitySheet(false) }}
                  className={`rounded-full px-4 py-2 text-sm font-label border transition-colors ${
                    selectedCity === ''
                      ? 'bg-primary text-on-primary border-primary'
                      : 'bg-surface-container text-on-surface border-outline-variant'
                  }`}
                >
                  Todas
                </button>
                {BOLIVIAN_CITIES.map((city) => (
                  <button
                    key={city}
                    onClick={() => { setSelectedCity(city); setShowCitySheet(false) }}
                    className={`rounded-full px-4 py-2 text-sm font-label border transition-colors ${
                      selectedCity === city
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container text-on-surface border-outline-variant'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCitySheet(false)}
                className="mt-4 w-full py-2.5 rounded-full bg-surface-container text-on-surface text-sm font-label font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3 px-4">
          {isLoading ? (
            <>
              <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
              <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
              <div className="bg-surface-container animate-pulse rounded-2xl h-32" />
            </>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-8">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20">engineering</span>
              <p className="font-headline font-bold text-[18px] text-on-surface/70 text-center">
                {activeTab === 'mis_proyectos' ? 'Aún no tienes proyectos' : 'Sin proyectos por aquí'}
              </p>
              <p className="font-body text-sm text-on-surface-variant/50 text-center">
                {activeTab === 'mis_proyectos'
                  ? 'Crea el primero y empieza a recibir propuestas'
                  : 'Prueba con otro filtro o vuelve más tarde'}
              </p>
              {activeTab === 'mis_proyectos' && active_role === 'constructor' && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-1 bg-primary text-on-primary font-label font-semibold text-sm rounded-2xl px-6 py-3 transition-opacity active:opacity-80"
                >
                  Crear proyecto
                </button>
              )}
            </div>
          ) : (
            <>
              <AdBanner variant="banner" />
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPress={() => setSelectedProject(project)}
                />
              ))}
            </>
          )}
        </div>
      </div>
      {showForm && (
        <NuevoProyectoForm
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      )}
      
      {active_role === 'constructor' && !selectedProject && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center z-10"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      )}
    </>
  )
}
