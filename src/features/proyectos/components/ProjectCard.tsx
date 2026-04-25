// src/features/proyectos/components/ProjectCard.tsx

import React from 'react';
import type { ProjectCard as ProjectCardType, ProjectType } from '../types/proyectosTypes';
import { ProjectStatusChip } from './ProjectStatusChip';

interface ProjectCardProps {
  project: ProjectCardType;
  onPress: (id: string) => void;
}

const TYPE_CONFIG: Record<ProjectType, { icon: string; label: string }> = {
  casa: { icon: 'home', label: 'Casa' },
  edificio: { icon: 'apartment', label: 'Edificio' },
  remodelacion: { icon: 'home_repair_service', label: 'Remodelación' },
  comercial: { icon: 'store', label: 'Comercial' },
  otro: { icon: 'construction', label: 'Otro' },
};

function formatBudget(amount: number): string {
  return amount.toLocaleString('es-BO').replace(/,/g, '.');
}

export function ProjectCard({ project, onPress }: ProjectCardProps) {
  const typeConfig = TYPE_CONFIG[project.type];

  return (
    <button
      type="button"
      onClick={() => onPress(project.id)}
      className="w-full text-left bg-surface-container-low rounded-xl p-4 border border-outline-variant flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-on-surface-variant">
          <span className="material-symbols-outlined text-base leading-none">
            {typeConfig.icon}
          </span>
          <span className="text-xs font-label">{typeConfig.label}</span>
        </div>
        <ProjectStatusChip status={project.status} />
      </div>

      <p className="font-label font-semibold text-on-surface text-sm line-clamp-2 leading-snug">
        {project.title}
      </p>

      <div className="flex items-center gap-1 text-on-surface-variant">
        <span className="material-symbols-outlined text-sm leading-none">location_on</span>
        <span className="text-xs">{project.city}</span>
      </div>

      <p className="text-sm font-semibold text-primary">
        Bs {formatBudget(project.budget_min)} – {formatBudget(project.budget_max)}
      </p>

      <div className="flex items-center gap-2 flex-wrap">
        {project.needs_maestro && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-label text-on-surface-variant border border-outline-variant">
            <span className="material-symbols-outlined text-sm leading-none">engineering</span>
            Busca maestro
          </span>
        )}
        {project.needs_materials && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-label text-on-surface-variant border border-outline-variant">
            <span className="material-symbols-outlined text-sm leading-none">inventory_2</span>
            Busca materiales
          </span>
        )}
        <div className="ml-auto flex items-center gap-1 text-on-surface-variant">
          <span className="material-symbols-outlined text-sm leading-none">groups</span>
          <span className="text-xs">{project.application_count} interesados</span>
        </div>
      </div>
    </button>
  );
}
