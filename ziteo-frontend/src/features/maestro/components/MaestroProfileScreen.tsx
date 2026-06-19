import { useRef, useState } from 'react'
import { useMaestroProfile, useUpdateMaestroProfile } from '../hooks/useMaestroProfile'
import { useHabilidades } from '../hooks/useHabilidades'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { useUploadPhoto } from '../../../shared/hooks/useUploadPhoto'
import { useAuthStore } from '../../auth/store/authStore'
import { useProfileReviews } from '../../../shared/hooks/useReviews'
import { StarRating } from '../../../shared/components/StarRating'
import { ReviewCard } from '../../../shared/components/ReviewCard'
import { ReviewForm } from '../../../shared/components/ReviewForm'

interface MaestroProfileScreenProps {
  maestroId: string
  isOwn: boolean
  onBack?: () => void
  onChat?: (maestroId: string, name: string) => void
  onHire?: (maestroId: string) => void
}

export function MaestroProfileScreen({ maestroId, isOwn, onBack, onChat, onHire }: MaestroProfileScreenProps) {
  const { data: profile, isLoading, isError } = useMaestroProfile(maestroId)
  const { data: habilidades } = useHabilidades(maestroId)
  const { mutateAsync: updateProfile } = useUpdateMaestroProfile()
  const { toasts, showToast, removeToast } = useToast()
  const { upload, isUploading } = useUploadPhoto()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [editBio, setEditBio] = useState<string | null>(null)
  const [editSpecialty, setEditSpecialty] = useState<string | null>(null)
  const [editYears, setEditYears] = useState<number | null | undefined>(undefined)
  const [editRate, setEditRate] = useState<number | null | undefined>(undefined)
  const [savingField, setSavingField] = useState<string | null>(null)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showReviewsList, setShowReviewsList] = useState(false)

  const currentUser = useAuthStore((s) => s.user)
  const { data: reviewsData } = useProfileReviews(maestroId)
  const alreadyReviewed =
    !!currentUser &&
    !!reviewsData?.reviews.some((r) => r.reviewer_id === currentUser.user_id)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <div className="h-48 bg-surface-container animate-pulse rounded-2xl" />
        <div className="h-24 bg-surface-container animate-pulse rounded-2xl" />
        <div className="h-32 bg-surface-container animate-pulse rounded-2xl" />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl">person_off</span>
        <span className="font-body text-sm">No se pudo cargar el perfil</span>
      </div>
    )
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await upload(file)
      showToast('Foto actualizada', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo subir la foto'
      showToast(msg, 'error')
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  async function handleSave(field: string, value: unknown) {
    setSavingField(field)
    try {
      const vars: Parameters<typeof updateProfile>[0] = { maestroId }
      if (field === 'bio') vars.bio = value as string
      if (field === 'specialty') vars.specialty = value as string
      if (field === 'years_experience') vars.years_experience = value as number | null
      if (field === 'hourly_rate') vars.hourly_rate = value as number | null
      if (field === 'is_available') vars.is_available = value as boolean

      await updateProfile(vars)
      showToast('Guardado correctamente', 'success')

      if (field === 'bio') setEditBio(null)
      if (field === 'specialty') setEditSpecialty(null)
      if (field === 'years_experience') setEditYears(undefined)
      if (field === 'hourly_rate') setEditRate(undefined)
    } catch {
      showToast('Error al guardar', 'error')
    } finally {
      setSavingField(null)
    }
  }

  const initial = profile.name?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <div className="flex flex-col min-h-dvh bg-background pb-6">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Header gradient */}
      <div className="relative bg-gradient-to-br from-primary to-primary/70 rounded-b-[2rem] pt-4 pb-10 px-4 flex flex-col gap-3">
        {/* Back button */}
        {onBack && (
          <button
            onClick={onBack}
            className="self-start flex items-center gap-1 text-on-primary/80 active:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="font-label text-sm">Volver</span>
          </button>
        )}

        <div className="flex items-center gap-4 mt-2">
          {/* Avatar */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-background bg-white/20 flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" loading="eager" />
              ) : (
                <span className="font-headline text-3xl text-on-primary font-medium">{initial}</span>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined animate-spin text-white text-2xl">progress_activity</span>
                </div>
              )}
            </div>
            {isOwn && (
              <>
                <button
                  onClick={() => !isUploading && photoInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-background text-primary flex items-center justify-center shadow-md active:opacity-80 transition-opacity disabled:opacity-50"
                  aria-label="Cambiar foto"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </>
            )}
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="font-headline font-bold text-xl text-on-primary truncate">{profile.name}</span>
            <div className="flex items-center gap-1 text-on-primary/80">
              <span className="material-symbols-outlined text-sm leading-none">location_on</span>
              <span className="font-body text-sm">{profile.city}</span>
            </div>
            {profile.is_verified && (
              <div className="flex items-center gap-1 text-on-primary/90">
                <span className="material-symbols-outlined text-sm leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span className="font-label text-xs">Verificado</span>
              </div>
            )}
            <span
              className={`mt-1 self-start text-xs rounded-full px-3 py-1 font-label ${
                profile.is_available
                  ? 'bg-white/20 text-on-primary'
                  : 'bg-black/20 text-on-primary/70'
              }`}
            >
              {profile.is_available ? 'Disponible' : 'No disponible'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 mt-4">
        {/* Stats cards */}
        <div className="flex gap-2">
          <div className="bg-surface rounded-2xl p-3 flex-1 text-center border border-outline-variant">
            <span className="font-headline font-bold text-lg text-primary">
              {profile.years_experience != null ? profile.years_experience : '—'}
            </span>
            <p className="font-label text-xs text-on-surface-variant mt-0.5">años</p>
            <p className="font-label text-xs text-on-surface-variant">Experiencia</p>
          </div>
          <div className="bg-surface rounded-2xl p-3 flex-1 text-center border border-outline-variant">
            <span className="font-headline font-bold text-lg text-primary">
              {profile.hourly_rate != null ? `Bs.${profile.hourly_rate}` : '—'}
            </span>
            <p className="font-label text-xs text-on-surface-variant mt-0.5">por hora</p>
            <p className="font-label text-xs text-on-surface-variant">Tarifa</p>
          </div>
          <div className="bg-surface rounded-2xl p-3 flex-1 text-center border border-outline-variant">
            <span className="font-headline font-bold text-lg text-primary">
              {habilidades?.length ?? 0}
            </span>
            <p className="font-label text-xs text-on-surface-variant mt-0.5">registradas</p>
            <p className="font-label text-xs text-on-surface-variant">Habilidades</p>
          </div>
        </div>

        {/* is_available toggle (isOwn) */}
        {isOwn && (
          <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex items-center justify-between">
            <span className="font-label text-sm text-on-surface">Disponible para trabajar</span>
            <button
              onClick={() => handleSave('is_available', !profile.is_available)}
              disabled={savingField === 'is_available'}
              className={`relative w-12 h-6 rounded-full transition-colors ${profile.is_available ? 'bg-primary' : 'bg-surface-container-low border border-outline-variant'} disabled:opacity-50`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${profile.is_available ? 'translate-x-6' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        )}

        {/* Bio section */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">Sobre mí</span>
            {isOwn && editBio === null && (
              <button
                onClick={() => setEditBio(profile.bio ?? '')}
                className="text-primary font-label text-xs flex items-center gap-1 active:opacity-70"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                Editar
              </button>
            )}
          </div>
          {isOwn && editBio !== null ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Cuéntanos sobre ti y tu experiencia..."
                className="min-h-24 bg-surface-container rounded-2xl p-3 font-body text-sm text-on-surface placeholder:text-on-surface-variant resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditBio(null)}
                  className="flex-1 rounded-2xl py-2 text-sm font-label border border-outline-variant text-on-surface-variant active:opacity-70"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleSave('bio', editBio)}
                  disabled={savingField === 'bio'}
                  className="flex-1 bg-primary text-on-primary rounded-2xl py-2 text-sm font-label font-semibold disabled:opacity-50"
                >
                  {savingField === 'bio' ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <p className="font-body text-sm text-on-surface-variant">
              {profile.bio || 'Sin descripción'}
            </p>
          )}
        </div>

        {/* Specialty + Experience + Rate */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-3">
          {/* Specialty */}
          <div className="flex flex-col gap-1">
            <span className="font-label text-xs text-on-surface-variant">Especialidad</span>
            {isOwn && editSpecialty !== null ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editSpecialty}
                  onChange={e => setEditSpecialty(e.target.value)}
                  placeholder="Ej. Albañilería"
                  className="flex-1 rounded-2xl py-2 px-3 bg-transparent border border-outline-variant text-on-surface font-body text-sm focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => setEditSpecialty(null)}
                  className="text-on-surface-variant active:opacity-70 px-2" aria-label="Cerrar"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <button
                  onClick={() => handleSave('specialty', editSpecialty)}
                  disabled={savingField === 'specialty'}
                  className="bg-primary text-on-primary rounded-2xl px-3 py-2 text-xs font-label font-semibold disabled:opacity-50"
                >
                  {savingField === 'specialty' ? '...' : 'OK'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-on-surface">{profile.specialty || '—'}</span>
                {isOwn && (
                  <button onClick={() => setEditSpecialty(profile.specialty ?? '')} className="text-primary font-label text-xs flex items-center gap-1 active:opacity-70">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant/40" />

          {/* Years experience */}
          <div className="flex flex-col gap-1">
            <span className="font-label text-xs text-on-surface-variant">Años de experiencia</span>
            {isOwn && editYears !== undefined ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editYears ?? ''}
                  onChange={e => setEditYears(e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Ej. 5"
                  min={0}
                  className="flex-1 rounded-2xl py-2 px-3 bg-transparent border border-outline-variant text-on-surface font-body text-sm focus:outline-none focus:border-primary"
                />
                <button onClick={() => setEditYears(undefined)} className="text-on-surface-variant active:opacity-70 px-2" aria-label="Cerrar">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <button
                  onClick={() => handleSave('years_experience', editYears)}
                  disabled={savingField === 'years_experience'}
                  className="bg-primary text-on-primary rounded-2xl px-3 py-2 text-xs font-label font-semibold disabled:opacity-50"
                >
                  {savingField === 'years_experience' ? '...' : 'OK'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-on-surface">
                  {profile.years_experience != null ? `${profile.years_experience} años` : '—'}
                </span>
                {isOwn && (
                  <button onClick={() => setEditYears(profile.years_experience)} className="text-primary font-label text-xs flex items-center gap-1 active:opacity-70">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-outline-variant/40" />

          {/* Hourly rate */}
          <div className="flex flex-col gap-1">
            <span className="font-label text-xs text-on-surface-variant">Tarifa</span>
            {isOwn && editRate !== undefined ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editRate ?? ''}
                  onChange={e => setEditRate(e.target.value === '' ? null : Number(e.target.value))}
                  placeholder="Bs. por hora"
                  min={0}
                  className="flex-1 rounded-2xl py-2 px-3 bg-transparent border border-outline-variant text-on-surface font-body text-sm focus:outline-none focus:border-primary"
                />
                <button onClick={() => setEditRate(undefined)} className="text-on-surface-variant active:opacity-70 px-2" aria-label="Cerrar">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <button
                  onClick={() => handleSave('hourly_rate', editRate)}
                  disabled={savingField === 'hourly_rate'}
                  className="bg-primary text-on-primary rounded-2xl px-3 py-2 text-xs font-label font-semibold disabled:opacity-50"
                >
                  {savingField === 'hourly_rate' ? '...' : 'OK'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-body text-sm text-on-surface">
                  {profile.hourly_rate != null ? `Bs. ${profile.hourly_rate}/hora` : '—'}
                </span>
                {isOwn && (
                  <button onClick={() => setEditRate(profile.hourly_rate)} className="text-primary font-label text-xs flex items-center gap-1 active:opacity-70">
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Habilidades */}
        {habilidades && habilidades.length > 0 && (
          <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-3">
            <span className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">
              Habilidades ({habilidades.length})
            </span>
            {habilidades.map(h => (
              <div key={h.id} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-body text-on-surface">
                  <span>{h.skill}</span>
                  <span className="font-semibold text-primary">{h.porcentaje}%</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${h.porcentaje}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Location */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-2">
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-base leading-none text-primary">location_on</span>
            <span className="font-body text-sm">Ciudad: {profile.city || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-base leading-none">assignment</span>
            <span className="font-body text-sm">Zonas de trabajo: {profile.city || '—'} y alrededores</span>
          </div>
        </div>

        {/* Reviews section */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">Reseñas</span>
            {reviewsData && reviewsData.totalCount > 0 && (
              <button
                id="toggle-reviews-list-btn"
                type="button"
                onClick={() => setShowReviewsList((v) => !v)}
                className="text-xs font-label text-primary font-semibold active:opacity-70"
              >
                {showReviewsList ? 'Ocultar' : `Ver ${reviewsData.totalCount}`}
              </button>
            )}
          </div>

          {/* Rating summary */}
          {reviewsData && reviewsData.totalCount > 0 ? (
            <div className="flex items-center gap-3">
              <span className="font-headline font-bold text-3xl text-primary">
                {reviewsData.averageRating.toFixed(1)}
              </span>
              <div className="flex flex-col gap-0.5">
                <StarRating value={reviewsData.averageRating} readonly size="md" />
                <span className="text-xs font-body text-on-surface-variant">
                  {reviewsData.totalCount} reseña{reviewsData.totalCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-on-surface-variant">
              <StarRating value={0} readonly size="sm" />
              <span className="text-xs font-body">Sin reseñas aún</span>
            </div>
          )}

          {/* Calificar button — only for constructors viewing someone else's profile */}
          {!isOwn && currentUser?.active_role === 'constructor' && (
            alreadyReviewed ? (
              <div className="flex items-center gap-2 bg-surface-container rounded-2xl px-3 py-2.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-base leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <span className="font-label text-xs">Ya calificaste a este maestro</span>
              </div>
            ) : (
              <button
                id="open-review-form-btn"
                type="button"
                onClick={() => setShowReviewForm(true)}
                className="flex items-center justify-center gap-2 border border-primary/40 bg-primary/8 text-primary rounded-2xl py-2.5 font-label font-semibold text-sm active:opacity-75 transition-opacity"
              >
                <span className="material-symbols-outlined text-base leading-none">star</span>
                Calificar
              </button>
            )
          )}

          {/* Expanded reviews list */}
          {showReviewsList && reviewsData && reviewsData.reviews.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {reviewsData.reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </div>

        {/* Action buttons (public view) */}
        {!isOwn && (
          <div className="flex gap-3 mt-2">
            {onChat && (
              <button
                onClick={() => onChat(profile.user_id, profile.name)}
                className="flex-1 bg-surface-container text-on-surface rounded-2xl py-3 font-label font-semibold text-sm border border-outline-variant active:opacity-75 transition-opacity flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base leading-none">chat</span>
                Chatear
              </button>
            )}
            {onHire && (
              <button
                onClick={() => onHire(profile.user_id)}
                className="flex-1 bg-primary text-on-primary rounded-2xl py-3 font-label font-semibold text-sm active:opacity-75 transition-opacity flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base leading-none">handshake</span>
                Contratar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ReviewForm modal sheet */}
      {showReviewForm && (
        <ReviewForm
          reviewedId={maestroId}
          reviewedName={profile.name}
          onClose={() => setShowReviewForm(false)}
        />
      )}
    </div>
  )
}
