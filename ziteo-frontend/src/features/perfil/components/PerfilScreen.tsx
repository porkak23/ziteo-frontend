import { useRef, useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import type { UserRole } from '../../auth/store/authStore'
import { supabase } from '../../../lib/supabaseClient'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { useUploadPhoto } from '../../../shared/hooks/useUploadPhoto'
import { UserAvatar } from '../../../shared/components/UserAvatar'

function persistActiveRole(userId: string, role: UserRole) {
  supabase.from('profiles').update({ active_role: role }).eq('user_id', userId).then(({ error }) => {
    if (error) console.error('Error persisting active_role:', error.message)
  })
}

const USER_ROLES: Record<UserRole, string> = {
  constructor: 'Constructor',
  proveedor: 'Vendedor',
  maestro: 'Trabajador',
  chofer: 'Delivery',
}

const CITIES = [
  'La Paz',
  'Santa Cruz de la Sierra',
  'Cochabamba',
  'Sucre',
  'Oruro',
  'Potosí',
  'Tarija',
  'Trinidad',
  'Cobija',
  'El Alto',
  'Sacaba',
]

const PROFILE_OPTIONS = [
  { icon: 'notifications', label: 'Notificaciones' },
  { icon: 'help', label: 'Ayuda y soporte' },
  { icon: 'info', label: 'Acerca de ZITEO' },
]

export function PerfilScreen() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const setActiveRole = useAuthStore((s) => s.setActiveRole)
  const logout = useAuthStore((s) => s.logout)

  const { toasts, showToast, removeToast } = useToast()
  const { upload, isUploading } = useUploadPhoto()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    city: '',
    active_role: 'constructor' as UserRole
  })

  if (!user) return null

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await upload(file)
      showToast('Foto de perfil actualizada', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo subir la foto', 'error')
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function handleOpenEdit() {
    setEditForm({ name: user!.name, city: '', active_role: user!.active_role })
    setIsEditing(true)

    try {
      const { data } = await supabase.from('profiles').select('city').eq('user_id', user!.user_id).single()
      if (data) {
        setEditForm(prev => ({ ...prev, city: data.city || '' }))
      }
    } catch (err) {
      console.error('Error fetching city:', err)
    }
  }

  async function handleSave() {
    if (!editForm.name.trim()) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          city: editForm.city,
          active_role: editForm.active_role
        })
        .eq('user_id', user!.user_id)

      if (error) throw error

      setUser({ ...user!, name: editForm.name, city: editForm.city || user!.city, active_role: editForm.active_role })
      showToast('Perfil actualizado correctamente', 'success')
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      showToast('Error al actualizar el perfil', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-6 min-h-dvh relative">
      <Toast toasts={toasts} onRemove={removeToast} />

      <div className="flex flex-col items-center gap-4 bg-gradient-to-b from-primary to-primary-container px-4 py-10 text-on-primary">
        <div className="relative w-20 h-20">
          <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="xl" showRing={true} />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-white text-2xl">progress_activity</span>
            </div>
          )}
          <button
            onClick={() => !isUploading && photoInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-md active:opacity-80 transition-opacity disabled:opacity-50"
            aria-label="Cambiar foto de perfil"
          >
            <span className="material-symbols-outlined text-sm">photo_camera</span>
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <span className="font-headline font-extrabold text-2xl">{user.name}</span>
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1 px-2 py-1 rounded-full border border-white/40 text-xs font-label opacity-90 transition-opacity active:opacity-60"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              <span>Editar</span>
            </button>
          </div>
          <div className="flex items-center gap-1 opacity-80">
            <span className="material-symbols-outlined text-base leading-none">phone</span>
            <span className="font-body text-sm">{user.phone}</span>
          </div>
          <span className="mt-1 bg-white/20 rounded-full px-4 py-1.5 text-sm font-label font-semibold">
            {USER_ROLES[user.active_role]}
          </span>
        </div>
      </div>

      {user.roles.length > 1 && (
        <div className="flex flex-col gap-2 px-4">
          <span className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">Mis roles</span>
          <div className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <button
                key={role}
                onClick={() => { setActiveRole(role); persistActiveRole(user!.user_id, role) }}
                className={`rounded-full px-4 py-1.5 text-sm font-label transition-colors ${
                  role === user.active_role
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface border border-outline-variant'
                }`}
              >
                {USER_ROLES[role]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 px-4">
        {PROFILE_OPTIONS.map((opt) => (
          <button
            key={opt.icon}
            onClick={() => {}}
            className="flex items-center gap-3 px-4 py-3.5 bg-surface rounded-2xl text-left w-full border border-outline-variant active:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">{opt.icon}</span>
            </div>
            <span className="flex-1 font-body text-sm font-medium text-on-surface">{opt.label}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
          </button>
        ))}
      </div>

      <div className="px-4 mt-auto">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3 bg-error-container text-on-error-container font-label"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => !isSaving && setIsEditing(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-6 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mt-2">
              <h2 className="font-headline text-xl text-on-surface font-semibold">Editar perfil</h2>
              <button
                onClick={() => !isSaving && setIsEditing(false)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container active:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-on-surface">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5 mt-2">
              <label className="font-label text-sm text-on-surface-variant px-1">
                Nombre completo <span className="text-primary">*</span>
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={e => setEditForm({...editForm, name: e.target.value})}
                placeholder="Ingresa tu nombre completo"
                className="rounded-2xl py-3.5 px-4 bg-transparent border border-outline-variant text-on-surface font-body outline-none focus:border-primary transition-colors"
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label text-sm text-on-surface-variant px-1">Ciudad</label>
              <div className="relative">
                <select
                  value={editForm.city}
                  onChange={e => setEditForm({...editForm, city: e.target.value})}
                  className="w-full appearance-none rounded-2xl py-3.5 pl-4 pr-10 bg-transparent border border-outline-variant text-on-surface font-body outline-none focus:border-primary transition-colors"
                  disabled={isSaving}
                >
                  <option value="" disabled>Selecciona tu ciudad</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-label text-sm text-on-surface-variant px-1">Rol activo</label>
              {user.roles.length > 1 ? (
                <div className="relative">
                  <select
                    value={editForm.active_role}
                    onChange={e => setEditForm({...editForm, active_role: e.target.value as UserRole})}
                    className="w-full appearance-none rounded-2xl py-3.5 pl-4 pr-10 bg-transparent border border-outline-variant text-on-surface font-body outline-none focus:border-primary transition-colors"
                    disabled={isSaving}
                  >
                    {user.roles.map(r => <option key={r} value={r}>{USER_ROLES[r]}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">arrow_drop_down</span>
                </div>
              ) : (
                <div className="rounded-2xl py-3.5 px-4 bg-surface-container border border-transparent text-on-surface font-body opacity-80 cursor-not-allowed">
                  {USER_ROLES[user.active_role]}
                </div>
              )}
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving || !editForm.name.trim()}
              className="mt-6 mb-2 w-full bg-primary text-on-primary font-label font-semibold rounded-2xl py-4 transition-opacity active:opacity-80 disabled:opacity-50 flex items-center justify-center min-h-[56px]"
            >
              {isSaving ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                'Guardar cambios'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
