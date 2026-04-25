// src/features/proyectos/types/proyectosTypes.ts

export type ProjectStatus =
  | 'borrador'
  | 'activo'
  | 'en_progreso'
  | 'completado'
  | 'cancelado';

export type ProjectType =
  | 'casa'
  | 'edificio'
  | 'remodelacion'
  | 'comercial'
  | 'otro';

export interface Project {
  id: string;
  title: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  budget_min: number;
  budget_max: number;
  city: string;
  address?: string;
  constructor_id: string;
  start_date?: string;
  end_date?: string;
  needs_maestro: boolean;
  needs_materials: boolean;
  images: string[];
  created_at: string;
}

export interface ProjectApplication {
  id: string;
  project_id: string;
  applicant_id: string;
  role: 'maestro' | 'proveedor';
  message: string;
  status: 'pendiente' | 'aceptado' | 'rechazado';
  created_at: string;
}

export type ProjectCard = Project & {
  constructor_name: string;
  application_count: number;
};
