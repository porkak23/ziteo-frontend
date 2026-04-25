export type ProjectStatus = 'planning' | 'active' | 'completed' | 'paused'

export interface Project {
  id: string
  name: string                    // era "title"
  description: string | null
  location_address: string | null // era "city" + "address"
  estimated_budget: number | null // era "budget_min"/"budget_max"
  status: ProjectStatus
  photo_url: string | null        // era "images: string[]"
  start_date: string | null
  needs_maestro: boolean
  needs_materials: boolean
  constructor_id: string
  city: string | null
  created_at: string
}

export interface ProjectApplication {
  id: string
  project_id: string
  applicant_id: string
  role: 'maestro' | 'proveedor'
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
}

export type ProjectCard = Project & {
  constructor_name: string
  application_count: number
}
