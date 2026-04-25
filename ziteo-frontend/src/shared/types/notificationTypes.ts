export interface Notification {
  id: string
  user_id: string
  type: 'contract' | 'project_application' | 'order' | 'general'
  title: string
  /** Column is named `message` in DB (not `body`) */
  body: string
  is_read: boolean
  related_entity_type: string | null
  related_entity_id: string | null
  created_at: string
}
