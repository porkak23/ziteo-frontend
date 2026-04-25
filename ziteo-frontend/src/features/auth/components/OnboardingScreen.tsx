import { useRef, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { updateProfile, AuthServiceError } from '../services/authService'
import { AUTH_ERRORS } from '../constants/authConstants'
import type { UserRole } from '../store/authStore'
import { useUploadPhoto } from '../../../shared/hooks/useUploadPhoto'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'

interface OnboardingScreenProps {
  onComplete: () => void
}

const CITIES = [
  'La Paz',
  'Cochabamba',
  'Santa Cruz',
  'Oruro',
  'Potosí',
  'Sucre',
  'Tarija',
  'Trinidad',
  'Cobija',
]

const ROLE_LABELS: Record<UserRole, string> = {
  constructor: 'Constructor',
  proveedor: 'Proveedor',
  maestro: 'Maestro',
  chofer: 'Chofer',
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { user, setUser } = useAuthStore()
  const { upload, isUploading } = useUploadPhoto()
  const { toasts, showToast, removeToast } = useToast()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [nameTouched, setNameTouched] = useState(false)
  const [city, setCity] = useState('')
  const [activeRole, setActiveRole] = useState<UserRole>(user?.active_role ?? 'constructor')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '')
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const roles = user?.roles ?? []
  const hasMultipleRoles = roles.length > 1

  const nameError = nameTouched && name.trim().length > 0 && name.trim().length < 3
    ? 'Mínimo 3 caracteres'
    : null

  const cityError = !city ? 'Selecciona una ciudad' : null

  const hasErrors = !!nameError || !!cityError || name.trim().length < 3

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const publicUrl = await upload(file)
      setAvatarUrl(publicUrl)
      showToast('Foto de perfil cargada', 'success')
    } catch (err: any) {
      showToast(err.message ?? 'No se pudo subir la foto', 'error')
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setNameTouched(true)
    if (hasErrors) return

    setApiError(null)
    setLoading(true)
    try {
      await updateProfile(user!.user_id, {
        name: name.trim(),
        city,
        active_role: activeRole,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      })

      // Update the Zustand store with the new profile data
      if (user) {
        setUser({
          ...user,
          name: name.trim(),
          city,
          active_role: activeRole,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
      }
      onComplete()
    } catch (err) {
      const errorCode = err instanceof AuthServiceError ? err.code : 'UNKNOWN'
      setApiError(AUTH_ERRORS[errorCode] ?? 'Ocurrió un error al guardar tu perfil, intenta de nuevo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh w-full flex flex-col bg-background overflow-y-auto">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="flex flex-col items-center pt-14 pb-6 px-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
          <span
            className="material-symbols-outlined text-4xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            construction
          </span>
        </div>
        <h1 className="font-headline font-extrabold text-3xl text-on-surface text-center leading-tight">
          Completa tu perfil
        </h1>
        <p className="font-body text-sm text-on-surface-variant mt-2 text-center">
          Solo toma un momento
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 px-6 pb-10 max-w-sm mx-auto w-full animate-[fadeSlideUp_0.4s_ease-out]"
      >
        {/* Foto de perfil opcional */}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="onboarding-photo" className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Foto de perfil (opcional)
          </label>
          <div className="relative w-20 h-20">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-container flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="font-headline text-3xl text-on-surface-variant font-medium">
                  {name.trim().charAt(0).toUpperCase() || 'Z'}
                </span>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined animate-spin text-white text-2xl">progress_activity</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => !isUploading && photoInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md active:opacity-80 transition-opacity disabled:opacity-50"
              aria-label="Seleccionar foto de perfil"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span>
            </button>
            <input
              ref={photoInputRef}
              id="onboarding-photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* Nombre completo */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-name" className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Nombre completo
          </label>
          <input
            id="onboarding-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            placeholder="Ej. Alejandro Mendoza"
            className={`px-4 py-3.5 rounded-2xl border bg-surface text-on-surface font-body text-sm focus:outline-none transition-colors ${
              nameError ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
            }`}
          />
          {nameError && (
            <span className="text-error text-xs">{nameError}</span>
          )}
        </div>

        {/* Ciudad */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-city" className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Ciudad
          </label>
          <select
            id="onboarding-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={`px-4 py-3.5 rounded-2xl border bg-surface text-on-surface font-body text-sm focus:outline-none appearance-none transition-colors ${
              nameTouched && cityError ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
            }`}
          >
            <option value="">Selecciona tu ciudad</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {nameTouched && cityError && (
            <span className="text-error text-xs">{cityError}</span>
          )}
        </div>

        {/* Rol activo */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="onboarding-role" className="font-label text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            Rol activo
          </label>

          {hasMultipleRoles ? (
            /* Multiple roles — let the user choose */
            <div className="flex flex-col gap-2">
              {roles.map((r) => {
                const isSelected = activeRole === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setActiveRole(r)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-outline-variant bg-surface'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                        isSelected ? 'border-primary bg-primary' : 'border-outline-variant bg-transparent'
                      }`}
                    />
                    <span
                      className={`font-label text-sm font-semibold ${
                        isSelected ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {ROLE_LABELS[r]}
                    </span>
                  </button>
                )
              })}
            </div>
          ) : (
            /* Single role — informative, non-editable */
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-outline-variant bg-surface-container text-on-surface-variant font-body text-sm">
              <span
                className="material-symbols-outlined text-base text-on-surface-variant"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                badge
              </span>
              <span className="font-label text-sm font-semibold text-on-surface">
                {ROLE_LABELS[activeRole]}
              </span>
            </div>
          )}
        </div>

        {/* Error API */}
        {apiError && (
          <div className="flex items-center gap-2 bg-error-container text-on-error-container rounded-2xl px-4 py-3 text-sm">
            <span className="material-symbols-outlined text-base flex-shrink-0">error</span>
            <span>{apiError}</span>
          </div>
        )}

        {/* CTA */}
        <button
          type="submit"
          disabled={loading || (nameTouched && hasErrors)}
          className="w-full px-4 py-4 bg-primary text-on-primary font-label font-semibold rounded-2xl text-base transition-opacity active:opacity-80 disabled:opacity-60 mt-2"
        >
          {loading ? 'Guardando...' : 'Empezar'}
        </button>
      </form>
    </main>
  )
}
