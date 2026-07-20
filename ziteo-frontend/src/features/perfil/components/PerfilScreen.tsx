import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { useNavStore } from '../../../shared/store/navStore'
import type { UserRole } from '../../auth/store/authStore'
import { supabase } from '../../../lib/supabaseClient'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { useUploadPhoto } from '../../../shared/hooks/useUploadPhoto'
import { UserAvatar } from '../../../shared/components/UserAvatar'
import { addRole as addRoleService } from '../../auth/services/authService'
import { CIUDADES_ACTIVAS } from '../../../shared/constants/geography'
import { SaveCancelRow } from '../../../shared/design/components/SaveCancelRow'
import { SectionLabel } from '../../../shared/design/components/SectionLabel'
import { usePaymentQr } from '../../proveedor/hooks/usePaymentQr'

const VendedorPublicProfile = lazy(() => import('../../proveedor/components/VendedorPublicProfile').then(m => ({ default: m.VendedorPublicProfile })))
const MaestroPublicProfile  = lazy(() => import('../../maestro/components/MaestroPublicProfile').then(m => ({ default: m.MaestroPublicProfile })))

async function persistActiveRole(userId: string, role: UserRole): Promise<boolean> {
  const { error } = await supabase
    .from('profiles')
    .update({ active_role: role })
    .eq('user_id', userId)
  if (error) {
    console.error('Error persisting active_role:', error.message)
    return false
  }
  return true
}

// Mapa de display (label/icon) para todos los roles, incluido admin —
// user.active_role puede ser cualquiera de estos. La restricción real de
// seguridad está en ASSIGNABLE_ROLES más abajo: admin nunca aparece como
// rol ofrecido para auto-agregar (se otorga solo por SQL manual, ver
// 20260719000001_admin_role_foundation.sql).
const USER_ROLES: Record<UserRole, { label: string; icon: string }> = {
  constructor: { label: 'Constructor', icon: 'engineering' },
  proveedor: { label: 'Vendedor', icon: 'storefront' },
  maestro: { label: 'Trabajador', icon: 'construction' },
  chofer: { label: 'Delivery', icon: 'local_shipping' },
  admin: { label: 'Admin', icon: 'shield_person' },
}

type AssignableUserRole = Exclude<UserRole, 'admin'>
const ASSIGNABLE_ROLES: AssignableUserRole[] = ['constructor', 'proveedor', 'maestro', 'chofer']

interface RoleRowData {
  store_name?: string | null
  specialty?: string | null
  vehicle_plate?: string | null
  vehicle_type?: string | null
}

type SubView = 'vendedor-edit' | 'vendedor-public' | 'maestro-edit' | 'maestro-public'

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 pt-0">
      <div className="h-56 bg-surface-container animate-pulse rounded-b-[2.5rem]" />
      <div className="h-20 bg-surface-container animate-pulse rounded-2xl" />
      <div className="h-40 bg-surface-container animate-pulse rounded-2xl" />
    </div>
  )
}

export function PerfilScreen() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const setActiveRole = useAuthStore((s) => s.setActiveRole)
  const logout = useAuthStore((s) => s.logout)

  const setTab = useNavStore((s) => s.setTab)

  const { toasts, showToast, removeToast } = useToast()
  const { upload, isUploading } = useUploadPhoto()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)

  const { uploadQr, getSignedQrUrl, uploading: qrUploading } = usePaymentQr()
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)

  const [roleData, setRoleData] = useState<Record<string, RoleRowData>>({})

  const [editName, setEditName] = useState<string | null>(null)
  const [editCity, setEditCity] = useState<string | null>(null)
  const [editAddress, setEditAddress] = useState<string | null>(null)
  const [editVehicle, setEditVehicle] = useState<{ plate: string; type: string } | null>(null)

  const [subView, setSubView] = useState<SubView | null>(null)

  const [savingName, setSavingName] = useState(false)
  const [savingCity, setSavingCity] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [savingVehicle, setSavingVehicle] = useState(false)

  const [profileBio, setProfileBio] = useState<string | null>(null)
  const [profileCity, setProfileCity] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('city, bio')
      .eq('user_id', user.user_id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfileCity(data.city ?? null)
          setProfileBio(data.bio ?? null)
        }
      })

    supabase
      .from('user_roles')
      .select('role, store_name, specialty, vehicle_plate, vehicle_type')
      .eq('user_id', user.user_id)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, RoleRowData> = {}
          for (const row of data) {
            map[row.role] = {
              store_name: row.store_name,
              specialty: row.specialty,
              vehicle_plate: row.vehicle_plate,
              vehicle_type: row.vehicle_type,
            }
          }
          setRoleData(map)
        }
      })
  }, [user?.user_id])

  useEffect(() => {
    if (!user) return
    const qrRoleData = roleData[user.active_role]
    if (qrRoleData?.store_name !== undefined || user.active_role === 'proveedor' || user.active_role === 'maestro') {
      getSignedQrUrl(user.user_id, user.active_role).then((url) => setQrUrl(url))
    }
  }, [user?.user_id, user?.active_role, roleData])

  if (!user) return null

  if (subView === 'vendedor-edit' || subView === 'vendedor-public') {
    return (
      <Suspense fallback={<ProfileSkeleton />}>
        <VendedorPublicProfile
          vendedorId={user.user_id}
          isOwn={subView === 'vendedor-edit'}
          onBack={() => setSubView(null)}
          authUser={user}
        />
      </Suspense>
    )
  }

  if (subView === 'maestro-edit' || subView === 'maestro-public') {
    return (
      <Suspense fallback={<ProfileSkeleton />}>
        <MaestroPublicProfile
          maestroId={user.user_id}
          isOwn={subView === 'maestro-edit'}
          onBack={() => setSubView(null)}
          authUser={user}
        />
      </Suspense>
    )
  }

  const completenessFields = [
    user.name,
    user.phone,
    user.email,
    profileBio,
    profileCity ?? user.city,
    user.avatar_url,
  ]
  const filledCount = completenessFields.filter(Boolean).length
  const completenessPercent = Math.round((filledCount / completenessFields.length) * 100)

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

  async function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user) return
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadQr(file)
      const url = await getSignedQrUrl(user.user_id, user.active_role)
      setQrUrl(url)
      showToast('QR de cobro actualizado', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo subir el QR', 'error')
    } finally {
      if (qrInputRef.current) qrInputRef.current.value = ''
    }
  }

  async function handleSaveName() {
    if (!user || !editName?.trim()) return
    setSavingName(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: editName })
        .eq('user_id', user.user_id)
      if (error) throw error
      setUser({ ...user, name: editName })
      setEditName(null)
      showToast('Nombre actualizado', 'success')
    } catch {
      showToast('Error al guardar nombre', 'error')
    } finally {
      setSavingName(false)
    }
  }

  async function handleSaveCity() {
    if (!user || editCity === null) return
    setSavingCity(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ city: editCity })
        .eq('user_id', user.user_id)
      if (error) throw error
      setUser({ ...user, city: editCity })
      setProfileCity(editCity)
      setEditCity(null)
      showToast('Ciudad actualizada', 'success')
    } catch {
      showToast('Error al guardar ciudad', 'error')
    } finally {
      setSavingCity(false)
    }
  }

  async function handleSaveAddress() {
    if (!user || editAddress === null) return
    setSavingAddress(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ bio: editAddress })
        .eq('user_id', user.user_id)
      if (error) throw error
      setProfileBio(editAddress)
      setEditAddress(null)
      showToast('Dirección actualizada', 'success')
    } catch {
      showToast('Error al guardar dirección', 'error')
    } finally {
      setSavingAddress(false)
    }
  }

  async function handleSaveVehicle() {
    if (!user || !editVehicle) return
    setSavingVehicle(true)
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ vehicle_type: editVehicle.type, vehicle_plate: editVehicle.plate })
        .eq('user_id', user.user_id)
        .eq('role', 'chofer')
      if (error) throw error
      setRoleData((prev) => ({
        ...prev,
        chofer: { ...prev.chofer, vehicle_type: editVehicle.type, vehicle_plate: editVehicle.plate },
      }))
      setEditVehicle(null)
      showToast('Vehículo actualizado', 'success')
    } catch {
      showToast('Error al guardar vehículo', 'error')
    } finally {
      setSavingVehicle(false)
    }
  }

  const displayCity = profileCity ?? user.city

  const ACCOUNT_ROWS = [
    { icon: 'notifications', label: 'Notificaciones', action: () => setTab('notificaciones') },
    { icon: 'security', label: 'Seguridad (PIN)', action: () => setTab('settings') },
    { icon: 'help', label: 'Ayuda y soporte', action: () => window.open('mailto:soporte@ziteo.app', '_blank') },
    { icon: 'gavel', label: 'Legal y privacidad', action: () => window.open('/privacidad', '_blank') },
    { icon: 'info', label: 'Acerca de ZITEO', action: () => {} },
  ]

  return (
    <div className="flex flex-col pb-8 min-h-dvh relative">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* SECCIÓN 1 — Hero de identidad */}
      <div className="bg-gradient-to-b from-primary to-primary/75 rounded-b-[2.5rem] px-5 pb-8 pt-10 flex flex-col items-center gap-3">
        <div className="relative w-[100px] h-[100px]">
          <UserAvatar name={user.name} avatarUrl={user.avatar_url} size="xl" showRing={true} />
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined animate-spin text-white text-2xl">progress_activity</span>
            </div>
          )}
          <button
            onClick={() => !isUploading && photoInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center shadow-md active:opacity-70 transition-opacity disabled:opacity-50"
            aria-label="Cambiar foto de perfil"
          >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>

        <div className="flex flex-col items-center gap-1 text-on-primary">
          <div className="flex items-center gap-2">
            <span className="font-headline font-extrabold text-2xl">{user.name}</span>
            <button
              onClick={() => setEditName(user.name)}
              className="flex items-center gap-1 px-2 py-1 rounded-full border border-white/40 text-xs font-label opacity-90 active:opacity-60"
            >
              <span className="material-symbols-outlined text-[13px]">edit</span>
              <span>Editar</span>
            </button>
          </div>

          <span className="font-body text-sm opacity-80">
            {USER_ROLES[user.active_role].label}
            {displayCity ? ` · ${displayCity}` : ''}
          </span>

          <div className="flex items-center gap-1 opacity-75 mt-0.5">
            <span className="material-symbols-outlined text-[16px] leading-none">phone</span>
            <span className="font-body text-sm">{user.phone}</span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="bg-white/20 rounded-full px-3 py-1 text-xs font-label font-semibold">
              {USER_ROLES[user.active_role].label}
            </span>
          </div>
        </div>

        {completenessPercent < 100 && (
          <div className="w-full max-w-xs mt-1 flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="font-label text-[11px] text-white/70">Perfil {completenessPercent}% completo</span>
              <span className="font-label text-[11px] text-white/70">{completenessPercent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full bg-white/80 transition-all"
                style={{ width: `${completenessPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Inline name edit */}
      {editName !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => !savingName && setEditName(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-headline text-lg font-semibold text-on-surface">Editar nombre</span>
              <button
                onClick={() => !savingName && setEditName(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container active:opacity-70"
              >
                <span className="material-symbols-outlined text-on-surface">close</span>
              </button>
            </div>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nombre completo"
              className="rounded-2xl py-3.5 px-4 bg-transparent border border-outline-variant text-on-surface font-body outline-none focus:border-primary transition-colors"
              disabled={savingName}
              autoFocus
            />
            <SaveCancelRow
              onSave={handleSaveName}
              onCancel={() => setEditName(null)}
              saving={savingName}
            />
          </div>
        </>
      )}

      <div className="flex flex-col gap-5 px-4 mt-5">

        {/* SECCIÓN 2 — Slot Premium */}
        <div className="bg-gradient-to-r from-primary/8 to-blue-500/8 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-2xl">workspace_premium</span>
            <span className="font-headline font-bold text-base text-on-surface">Ziteoo Pro</span>
            <span className="ml-auto bg-surface-container text-on-surface-variant rounded-full px-3 py-0.5 text-xs font-label">
              Plan: Gratis
            </span>
          </div>
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">
            Desbloquea funciones avanzadas para tu negocio
          </p>
          <button
            disabled
            className="self-start bg-primary text-on-primary rounded-xl px-4 py-2 text-sm font-label font-semibold opacity-50 cursor-not-allowed"
          >
            Próximamente
          </button>
        </div>

        {/* SECCIÓN 3 — Datos personales */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Información Personal</SectionLabel>
          <div className="bg-surface rounded-2xl border border-outline-variant flex flex-col divide-y divide-outline-variant/40">

            {/* Nombre */}
            <div className="px-4 py-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">person</span>
                <div className="flex-1 min-w-0">
                  <span className="font-label text-xs text-on-surface-variant">Nombre completo</span>
                  <p className="font-body text-sm text-on-surface truncate">{user.name}</p>
                </div>
                {editName === null && (
                  <button
                    onClick={() => setEditName(user.name)}
                    className="font-label text-xs text-primary px-2 py-1 rounded-lg border border-primary/30 active:opacity-70"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Teléfono — solo lectura */}
            <div className="px-4 py-3.5 flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">phone</span>
              <div className="flex-1 min-w-0">
                <span className="font-label text-xs text-on-surface-variant">Teléfono</span>
                <p className="font-body text-sm text-on-surface">{user.phone}</p>
              </div>
            </div>

            {/* Email — solo lectura */}
            <div className="px-4 py-3.5 flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">email</span>
              <div className="flex-1 min-w-0">
                <span className="font-label text-xs text-on-surface-variant">Email</span>
                {user.email ? (
                  <p className="font-body text-sm text-on-surface truncate">{user.email}</p>
                ) : (
                  <p className="font-body text-sm text-on-surface-variant/50 italic">Sin email</p>
                )}
              </div>
            </div>

            {/* Ciudad */}
            <div className="px-4 py-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">location_city</span>
                <div className="flex-1 min-w-0">
                  <span className="font-label text-xs text-on-surface-variant">Ciudad</span>
                  {displayCity ? (
                    <p className="font-body text-sm text-on-surface">{displayCity}</p>
                  ) : (
                    <p className="font-body text-sm text-on-surface-variant/50 italic">Sin especificar</p>
                  )}
                </div>
                {editCity === null && (
                  <button
                    onClick={() => setEditCity(displayCity ?? '')}
                    className="font-label text-xs text-primary px-2 py-1 rounded-lg border border-primary/30 active:opacity-70"
                  >
                    Editar
                  </button>
                )}
              </div>
              {editCity !== null && (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="relative">
                    <select
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full appearance-none rounded-xl py-2.5 pl-3 pr-8 bg-transparent border border-outline-variant text-on-surface font-body text-sm outline-none focus:border-primary"
                      disabled={savingCity}
                    >
                      <option value="" disabled>Selecciona ciudad</option>
                      {CIUDADES_ACTIVAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-sm">arrow_drop_down</span>
                  </div>
                  <SaveCancelRow onSave={handleSaveCity} onCancel={() => setEditCity(null)} saving={savingCity} />
                </div>
              )}
            </div>

            {/* Dirección */}
            <div className="px-4 py-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">home</span>
                <div className="flex-1 min-w-0">
                  <span className="font-label text-xs text-on-surface-variant">Dirección</span>
                  {profileBio ? (
                    <p className="font-body text-sm text-on-surface">{profileBio}</p>
                  ) : (
                    <p className="font-body text-sm text-on-surface-variant/50 italic">Sin especificar</p>
                  )}
                </div>
                {editAddress === null && (
                  <button
                    onClick={() => setEditAddress(profileBio ?? '')}
                    className="font-label text-xs text-primary px-2 py-1 rounded-lg border border-primary/30 active:opacity-70"
                  >
                    Editar
                  </button>
                )}
              </div>
              {editAddress !== null && (
                <div className="flex flex-col gap-2 mt-1">
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Tu dirección o zona (ej. Zona Norte, Calle Bolívar)"
                    className="rounded-xl py-2.5 px-3 bg-transparent border border-outline-variant text-on-surface font-body text-sm outline-none focus:border-primary"
                    disabled={savingAddress}
                  />
                  <SaveCancelRow onSave={handleSaveAddress} onCancel={() => setEditAddress(null)} saving={savingAddress} />
                </div>
              )}
            </div>

            {/* QR de cobro */}
            <div className="px-4 py-3.5 flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-xl">qr_code_2</span>
                <div className="flex-1 min-w-0">
                  <span className="font-label text-xs text-on-surface-variant">QR General de cobro</span>
                </div>
              </div>
              {qrUrl ? (
                <div className="flex items-center gap-3 mt-1">
                  <button onClick={() => setQrModalOpen(true)} className="shrink-0 active:opacity-70">
                    <img src={qrUrl} alt="QR de cobro" className="w-16 h-16 rounded-xl border border-outline-variant object-cover" />
                  </button>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setQrModalOpen(true)}
                      className="font-label text-xs text-primary px-3 py-1.5 rounded-lg border border-primary/30 active:opacity-70"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => qrInputRef.current?.click()}
                      disabled={qrUploading}
                      className="font-label text-xs text-on-surface-variant px-3 py-1.5 rounded-lg border border-outline-variant active:opacity-70 disabled:opacity-50"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => qrInputRef.current?.click()}
                  disabled={qrUploading}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant active:opacity-70 disabled:opacity-50"
                >
                  {qrUploading ? (
                    <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  )}
                  <span className="font-label text-xs">Cargar QR de cobro</span>
                </button>
              )}
              <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={handleQrChange} />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4 — Mis perfiles */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Mis Perfiles</SectionLabel>
          <div className="flex flex-col gap-3">
            {user.roles.map((role) => {
              const rd = roleData[role] ?? {}
              const isActive = role === user.active_role
              let subtitle = ''
              if (role === 'proveedor') {
                subtitle = rd.store_name ? `Tienda y productos · ${rd.store_name}` : 'Tienda y productos'
              } else if (role === 'maestro') {
                subtitle = rd.specialty ? `Maestro de obra · ${rd.specialty}` : 'Maestro de obra'
              } else if (role === 'constructor') {
                subtitle = 'Gestiona proyectos y licitaciones'
              } else if (role === 'chofer') {
                subtitle = rd.vehicle_type && rd.vehicle_plate
                  ? `${rd.vehicle_type} · ${rd.vehicle_plate}`
                  : 'Sin vehículo configurado'
              }

              const isPublic = role === 'proveedor' || role === 'maestro'

              return (
                <div key={role} className="bg-surface rounded-2xl border border-outline-variant p-4 flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-on-surface-variant text-xl">{USER_ROLES[role].icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-headline font-bold text-sm text-on-surface">{USER_ROLES[role].label}</span>
                        {isActive ? (
                          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-label font-semibold">
                            ACTIVO
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!user.roles.includes(role)) return
                              const ok = await persistActiveRole(user.user_id, role)
                              if (ok) setActiveRole(role)
                            }}
                            className="bg-surface-container text-on-surface-variant rounded-full px-2 py-0.5 text-[10px] font-label font-semibold border border-outline-variant active:opacity-70"
                          >
                            Activar
                          </button>
                        )}
                      </div>
                      <p className="font-body text-xs text-on-surface-variant mt-0.5">{subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60">
                      {isPublic ? 'public' : 'lock'}
                    </span>
                    <span className="font-label text-[11px] text-on-surface-variant/60">
                      {isPublic ? 'Perfil visible a constructores' : 'Perfil privado'}
                    </span>
                  </div>

                  <div className="h-px bg-outline-variant/40" />

                  <div className="flex flex-wrap gap-2">
                    {role === 'proveedor' && (
                      <>
                        <button
                          onClick={() => setSubView('vendedor-edit')}
                          className="font-label text-xs px-3 py-2 rounded-xl bg-surface-container text-on-surface border border-outline-variant active:opacity-70"
                        >
                          Editar perfil público
                        </button>
                        <button
                          onClick={() => setSubView('vendedor-public')}
                          className="font-label text-xs px-3 py-2 rounded-xl bg-transparent text-primary border border-primary/30 active:opacity-70"
                        >
                          Ver como público
                        </button>
                      </>
                    )}
                    {role === 'maestro' && (
                      <>
                        <button
                          onClick={() => setSubView('maestro-edit')}
                          className="font-label text-xs px-3 py-2 rounded-xl bg-surface-container text-on-surface border border-outline-variant active:opacity-70"
                        >
                          Editar perfil público
                        </button>
                        <button
                          onClick={() => setSubView('maestro-public')}
                          className="font-label text-xs px-3 py-2 rounded-xl bg-transparent text-primary border border-primary/30 active:opacity-70"
                        >
                          Ver como público
                        </button>
                      </>
                    )}
                    {role === 'constructor' && (
                      <button
                        onClick={async () => {
                          if (!user.roles.includes('constructor')) return
                          const ok = await persistActiveRole(user.user_id, 'constructor')
                          if (ok) setActiveRole('constructor')
                        }}
                        className="font-label text-xs px-3 py-2 rounded-xl bg-primary text-on-primary active:opacity-70"
                      >
                        Ir al dashboard
                      </button>
                    )}
                    {role === 'chofer' && (
                      <>
                        {editVehicle === null ? (
                          <button
                            onClick={() => setEditVehicle({ type: rd.vehicle_type ?? '', plate: rd.vehicle_plate ?? '' })}
                            className="font-label text-xs px-3 py-2 rounded-xl bg-surface-container text-on-surface border border-outline-variant active:opacity-70"
                          >
                            Tipo de vehículo
                          </button>
                        ) : (
                          <div className="flex flex-col gap-2 w-full">
                            <input
                              type="text"
                              value={editVehicle.type}
                              onChange={(e) => setEditVehicle({ ...editVehicle, type: e.target.value })}
                              placeholder="Tipo (ej. Camión, Furgón)"
                              className="rounded-xl py-2.5 px-3 bg-transparent border border-outline-variant text-on-surface font-body text-sm outline-none focus:border-primary"
                              disabled={savingVehicle}
                            />
                            <input
                              type="text"
                              value={editVehicle.plate}
                              onChange={(e) => setEditVehicle({ ...editVehicle, plate: e.target.value })}
                              placeholder="Placa (ej. ABC-123)"
                              className="rounded-xl py-2.5 px-3 bg-transparent border border-outline-variant text-on-surface font-body text-sm outline-none focus:border-primary"
                              disabled={savingVehicle}
                            />
                            <SaveCancelRow
                              onSave={handleSaveVehicle}
                              onCancel={() => setEditVehicle(null)}
                              saving={savingVehicle}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Agregar nuevos roles */}
            {ASSIGNABLE_ROLES.filter((r) => !user.roles.includes(r)).length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="font-label text-[11px] text-on-surface-variant/50">Agregar rol</span>
                <div className="flex flex-wrap gap-2">
                  {ASSIGNABLE_ROLES
                    .filter((r) => !user.roles.includes(r))
                    .map((role) => (
                      <button
                        key={role}
                        onClick={async () => {
                          try {
                            await addRoleService(user.access_token, role)
                            useAuthStore.getState().addRole(role)
                            showToast(`Rol "${USER_ROLES[role].label}" agregado`, 'success')
                          } catch {
                            showToast('No se pudo agregar el rol', 'error')
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl border border-dashed border-outline-variant text-primary font-label text-xs hover:bg-primary/5 active:opacity-70"
                      >
                        <span className="material-symbols-outlined text-[14px]">add</span>
                        {USER_ROLES[role].label}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 5 — Cuenta y ajustes */}
        <div className="flex flex-col gap-2">
          <SectionLabel>Cuenta</SectionLabel>
          <div className="bg-surface rounded-2xl border border-outline-variant flex flex-col divide-y divide-outline-variant/40">
            {ACCOUNT_ROWS.map((row) => (
              <button
                key={row.icon}
                onClick={row.action}
                className="flex items-center gap-3 px-4 py-3.5 text-left w-full active:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{row.icon}</span>
                </div>
                <span className="flex-1 font-body text-sm font-medium text-on-surface">{row.label}</span>
                <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cerrar sesión */}
        <button
          onClick={() => {
            if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
              logout()
            }
          }}
          className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 bg-error-container text-on-error-container font-label font-semibold active:opacity-80"
        >
          <span className="material-symbols-outlined">logout</span>
          Cerrar sesión
        </button>

        <button
          onClick={() => window.open('mailto:soporte@ziteo.app?subject=Reporte%20de%20problema', '_blank')}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-on-surface-variant font-label text-xs active:opacity-60"
        >
          <span className="material-symbols-outlined text-[14px]">flag</span>
          Reportar problema
        </button>
      </div>

      {/* QR Modal */}
      {qrModalOpen && qrUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setQrModalOpen(false)}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <img src={qrUrl} alt="QR de cobro" className="w-64 h-64 object-contain rounded-2xl" />
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute -top-3 -right-3 w-9 h-9 bg-surface rounded-full flex items-center justify-center shadow-lg active:opacity-70"
            >
              <span className="material-symbols-outlined text-on-surface">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
