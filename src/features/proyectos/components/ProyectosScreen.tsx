// src/features/proyectos/components/ProyectosScreen.tsx

import React, { useState } from 'react';
import type { ProjectCard as ProjectCardType, ProjectStatus } from '../types/proyectosTypes';
import { ProjectCard } from './ProjectCard';
import { NuevoProyectoForm } from './NuevoProyectoForm';

type FilterValue = ProjectStatus | 'todos';

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'activo', label: 'Activos' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completado', label: 'Completados' },
];

const MOCK_PROJECTS: ProjectCardType[] = [
  {
    id: '1',
    title: 'Casa familiar 3 dormitorios',
    description:
      'Construcción de casa familiar de dos plantas con 3 dormitorios, sala, comedor y jardín en zona residencial.',
    type: 'casa',
    status: 'activo',
    budget_min: 45000,
    budget_max: 80000,
    city: 'La Paz',
    constructor_id: 'c1',
    needs_maestro: true,
    needs_materials: true,
    images: [],
    created_at: '2026-03-15T10:00:00Z',
    constructor_name: 'Carlos Mamani',
    application_count: 3,
  },
  {
    id: '2',
    title: 'Remodelación de oficinas corporativas',
    description:
      'Remodelación integral de planta de oficinas: pintura, cielos falsos, instalaciones eléctricas y pisos.',
    type: 'remodelacion',
    status: 'activo',
    budget_min: 20000,
    budget_max: 35000,
    city: 'Santa Cruz de la Sierra',
    constructor_id: 'c2',
    needs_maestro: false,
    needs_materials: true,
    images: [],
    created_at: '2026-03-20T08:30:00Z',
    constructor_name: 'Inversiones Del Sol S.R.L.',
    application_count: 1,
  },
  {
    id: '3',
    title: 'Edificio residencial de 4 pisos',
    description:
      'Edificio de 4 pisos con 8 departamentos de 2 dormitorios cada uno, estacionamiento subterráneo y área común.',
    type: 'edificio',
    status: 'en_progreso',
    budget_min: 800000,
    budget_max: 1200000,
    city: 'Cochabamba',
    constructor_id: 'c3',
    needs_maestro: true,
    needs_materials: false,
    images: [],
    created_at: '2026-02-01T09:00:00Z',
    constructor_name: 'Constructora Andina',
    application_count: 8,
  },
  {
    id: '4',
    title: 'Ampliación tienda comercial',
    description:
      'Ampliación de local comercial existente: demolición de muro, extensión de 40 m² y adecuación de fachada.',
    type: 'comercial',
    status: 'borrador',
    budget_min: 15000,
    budget_max: 25000,
    city: 'Oruro',
    constructor_id: 'c4',
    needs_maestro: true,
    needs_materials: true,
    images: [],
    created_at: '2026-04-01T14:00:00Z',
    constructor_name: 'Pedro Quispe',
    application_count: 0,
  },
  {
    id: '5',
    title: 'Construcción de galpón industrial',
    description:
      'Galpón metálico de 600 m² para almacenaje, con plataforma de carga, oficina administrativa y baños.',
    type: 'otro',
    status: 'activo',
    budget_min: 120000,
    budget_max: 200000,
    city: 'Santa Cruz de la Sierra',
    constructor_id: 'c5',
    needs_maestro: false,
    needs_materials: true,
    images: [],
    created_at: '2026-03-28T11:00:00Z',
    constructor_name: 'Grupo Industrial Oriente',
    application_count: 5,
  },
];

export function ProyectosScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterValue>('todos');
  const [showForm, setShowForm] = useState(false);

  const filtered =
    activeFilter === 'todos'
      ? MOCK_PROJECTS
      : MOCK_PROJECTS.filter((p) => p.status === activeFilter);

  function handleCardPress(id: string) {
    console.log('Proyecto seleccionado:', id);
  }

  function handleFormSuccess() {
    setShowForm(false);
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <h1 className="font-headline text-2xl text-on-surface">Proyectos</h1>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          aria-label="Nuevo proyecto"
          className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-on-primary shadow-md active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </div>

      <div className="flex gap-2 px-4 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map(({ value, label }) => {
          const active = activeFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setActiveFilter(value)}
              className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-label border transition-colors ${
                active
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container text-on-surface-variant border-outline-variant'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-4 pb-24 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 pt-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl">inbox</span>
            <p className="text-sm font-label">No hay proyectos en esta categoría.</p>
          </div>
        ) : (
          filtered.map((project) => (
            <ProjectCard key={project.id} project={project} onPress={handleCardPress} />
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-background z-50 flex flex-col">
          <NuevoProyectoForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  );
}
