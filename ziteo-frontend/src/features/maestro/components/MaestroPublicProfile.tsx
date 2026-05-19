import { useEffect, useRef, useState } from 'react'
import { useMaestroProfile, useUpdateMaestroProfile, useBootstrapMaestroRole } from '../hooks/useMaestroProfile'
import { supabase } from '../../../lib/supabaseClient'
import { useHabilidades } from '../hooks/useHabilidades'
import { useProfileReviews } from '../../../shared/hooks/useReviews'
import { useUploadPhoto } from '../../../shared/hooks/useUploadPhoto'
import { useAuthStore } from '../../auth/store/authStore'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { StarRating } from '../../../shared/components/StarRating'
import { ReviewCard } from '../../../shared/components/ReviewCard'
import { ReviewForm } from '../../../shared/components/ReviewForm'

// ── Types ──────────────────────────────────────────────────────────────────────

// Portfolio is local-state only in Phase A. Phase B will persist to DB.
interface PortfolioItem {
  id: string
  title: string
  description: string
  city: string
  year: number
}

export interface MaestroPublicProfileProps {
  maestroId: string
  isOwn: boolean
  onBack?: () => void
  onHire?: () => void
  onChat?: (maestroId: string, name: string) => void
  /** Auth store user used as display fallback when DB query fails (isOwn only) */
  authUser?: { user_id: string; name: string; city?: string | null; avatar_url?: string } | null
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">
      {children}
    </span>
  )
}

function SaveCancelRow({
  onSave,
  onCancel,
  saving,
}: {
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  return (
    <div className="flex gap-2 mt-1">
      <button
        onClick={onCancel}
        className="flex-1 rounded-xl py-2.5 text-sm font-label border border-outline-variant text-on-surface-variant active:opacity-70"
      >
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="flex-1 bg-primary text-on-primary rounded-xl py-2.5 text-sm font-label font-semibold disabled:opacity-50 active:opacity-80"
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </div>
  )
}

// Card gradient backgrounds used as photo placeholders until Phase B
const CARD_GRADIENTS = [
  'from-orange-400 to-amber-600',
  'from-stone-500 to-stone-700',
  'from-amber-500 to-orange-700',
  'from-zinc-500 to-zinc-700',
]

// ── Skeleton ───────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4 pt-0">
      <div className="h-56 bg-surface-container animate-pulse rounded-b-[2.5rem]" />
      <div className="h-20 bg-surface-container animate-pulse rounded-2xl" />
      <div className="h-40 bg-surface-container animate-pulse rounded-2xl" />
      <div className="h-28 bg-surface-container animate-pulse rounded-2xl" />
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function MaestroPublicProfile({
  maestroId,
  isOwn,
  onBack,
  onHire,
  onChat,
  authUser,
}: MaestroPublicProfileProps) {
  const { data: profile, isLoading, isError, refetch } = useMaestroProfile(maestroId)
  const { data: habilidades = [] } = useHabilidades(maestroId)
  const { data: reviewsData } = useProfileReviews(maestroId)
  const { mutateAsync: updateProfile } = useUpdateMaestroProfile()
  const { mutateAsync: bootstrapRole } = useBootstrapMaestroRole()
  const { upload, isUploading } = useUploadPhoto()
  const { toasts, showToast, removeToast } = useToast()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const currentUser = useAuthStore((s) => s.user)

  // Auto-create user_roles row on first open if missing (isOwn only)
  useEffect(() => {
    if (isOwn && profile && profile.specialty === null && profile.years_experience === null) {
      // Profile loaded but has no role row — bootstrap silently
      bootstrapRole(maestroId).catch(() => {/* non-fatal */})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwn, !!profile])

  // Inline edit state
  const [editBio, setEditBio] = useState<string | null>(null)
  const [editSpecialty, setEditSpecialty] = useState<string | null>(null)
  const [editYears, setEditYears] = useState<number | null | undefined>(undefined)
  const [editRate, setEditRate] = useState<number | null | undefined>(undefined)
  const [savingField, setSavingField] = useState<string | null>(null)

  // Reviews
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [showReviewsList, setShowReviewsList] = useState(false)

  // Portfolio (local state — Phase B will persist to DB)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([])
  const [showPortfolioForm, setShowPortfolioForm] = useState(false)
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    description: '',
    city: '',
    year: new Date().getFullYear(),
  })

  if (isLoading) return <ProfileSkeleton />

  // When own profile fails, build a partial profile from authStore so the
  // page is still functional. The user can still edit fields (saves via upsert).
  const fallbackProfile = (isError || !profile) && isOwn && authUser
    ? {
        user_id: authUser.user_id,
        name: authUser.name,
        city: authUser.city ?? '',
        avatar_url: authUser.avatar_url ?? null,
        bio: null,
        specialty: null,
        years_experience: null,
        hourly_rate: null,
        is_available: false,
        is_verified: false,
      }
    : null

  if ((isError || !profile) && !fallbackProfile) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
        <span className="font-headline font-bold text-base text-on-surface">
          {isOwn ? 'No se pudo cargar tu perfil' : 'No se pudo cargar el perfil'}
        </span>
        <p className="font-body text-sm text-on-surface-variant leading-relaxed">
          {isOwn
            ? 'Tu sesión puede haber expirado. Cierra sesión y vuelve a entrar.'
            : 'Verifica tu conexión e intenta de nuevo.'}
        </p>
        <div className="flex gap-3 w-full max-w-xs">
          <button
            onClick={() => refetch()}
            className="flex-1 border border-outline-variant text-on-surface rounded-xl px-4 py-3 font-label font-semibold text-sm active:opacity-80"
          >
            Reintentar
          </button>
          {isOwn && (
            <button
              onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
              className="flex-1 bg-primary text-on-primary rounded-xl px-4 py-3 font-label font-semibold text-sm active:opacity-80"
            >
              Cerrar sesión
            </button>
          )}
        </div>
      </div>
    )
  }

  const resolvedProfile = profile ?? fallbackProfile!

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await upload(file)
      showToast('Foto actualizada', 'success')
    } catch {
      showToast('No se pudo subir la foto', 'error')
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
      showToast('Guardado', 'success')
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

  function handleAddPortfolio() {
    if (!newPortfolio.title.trim()) {
      showToast('Agrega un título a la obra', 'error')
      return
    }
    setPortfolioItems((prev) => [...prev, { ...newPortfolio, id: Date.now().toString() }])
    setNewPortfolio({ title: '', description: '', city: '', year: new Date().getFullYear() })
    setShowPortfolioForm(false)
    showToast('Obra agregada', 'success')
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const initial = resolvedProfile.name?.charAt(0)?.toUpperCase() ?? '?'
  const rating = reviewsData?.averageRating ?? 0
  const reviewCount = reviewsData?.totalCount ?? 0
  const alreadyReviewed =
    !!currentUser &&
    !!reviewsData?.reviews.some((r) => r.reviewer_id === currentUser.user_id)
  const expLabel =
    resolvedProfile.years_experience != null
      ? `${resolvedProfile.years_experience} año${resolvedProfile.years_experience !== 1 ? 's' : ''}`
      : null

  return (
    <div className="flex flex-col min-h-dvh bg-background pb-28">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-primary to-primary/75 pt-4 pb-14 px-5 flex flex-col gap-3 rounded-b-[2.5rem]">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="font-label text-sm text-on-primary/80 active:opacity-70 flex items-center gap-1"
            >
              ← Volver
            </button>
          ) : (
            <span className="font-label text-sm text-on-primary/60">Mi perfil público</span>
          )}

          {/* Availability toggle (owner only) */}
          {isOwn && (
            <button
              role="switch"
              aria-checked={resolvedProfile.is_available}
              onClick={() => handleSave('is_available', !resolvedProfile.is_available)}
              disabled={savingField === 'is_available'}
              className={`font-label text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                resolvedProfile.is_available
                  ? 'bg-white/20 border-white/30 text-on-primary'
                  : 'bg-black/15 border-white/10 text-on-primary/60'
              }`}
            >
              {resolvedProfile.is_available ? 'Disponible' : 'No disponible'}
            </button>
          )}
        </div>

        {/* Avatar + identity */}
        <div className="flex items-end gap-4 mt-2">
          <div className="relative w-24 h-24 flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center ring-4 ring-white/20">
              {resolvedProfile.avatar_url ? (
                <img
                  src={resolvedProfile.avatar_url}
                  alt={resolvedProfile.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : (
                <span className="font-headline text-4xl text-on-primary font-medium">{initial}</span>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                  <span className="font-label text-xs text-white">Subiendo...</span>
                </div>
              )}
            </div>
            {isOwn && (
              <>
                <button
                  onClick={() => !isUploading && photoInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 bg-background text-primary font-label text-[10px] font-semibold px-2 py-1 rounded-lg shadow active:opacity-80 disabled:opacity-50"
                  aria-label="Cambiar foto de perfil"
                >
                  Foto
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-0 pb-1">
            <span className="font-headline font-bold text-2xl text-on-primary leading-tight">
              {resolvedProfile.name}
            </span>
            {resolvedProfile.specialty && (
              <span className="font-body text-sm text-on-primary/80">{resolvedProfile.specialty}</span>
            )}
            <span className="font-body text-sm text-on-primary/60">{resolvedProfile.city || 'Bolivia'}</span>
            {resolvedProfile.is_verified && (
              <span className="self-start bg-white/20 text-on-primary font-label text-[10px] font-semibold px-2.5 py-1 rounded-full">
                Verificado
              </span>
            )}
          </div>
        </div>

        {/* Availability pill (public view) */}
        {!isOwn && (
          <span
            className={`self-start font-label text-xs px-3 py-1.5 rounded-full ${
              resolvedProfile.is_available
                ? 'bg-green-400/25 text-green-100 ring-1 ring-green-300/30'
                : 'bg-black/20 text-on-primary/50'
            }`}
          >
            {resolvedProfile.is_available ? 'Disponible para contratar' : 'No disponible'}
          </span>
        )}
      </div>

      {/* ── STATS STRIP (overlaps hero bottom) ─────────────────────────────── */}
      <div className="mx-4 -mt-7 bg-surface rounded-2xl border border-outline-variant shadow-sm flex divide-x divide-outline-variant/40 z-10 relative">
        <div className="flex flex-col items-center py-3.5 flex-1">
          <span className="font-headline font-bold text-lg text-primary">
            {reviewCount > 0 ? rating.toFixed(1) : '—'}
          </span>
          <span className="font-label text-[10px] text-on-surface-variant mt-0.5">
            {reviewCount > 0 ? `${reviewCount} reseña${reviewCount !== 1 ? 's' : ''}` : 'Sin reseñas'}
          </span>
        </div>
        <div className="flex flex-col items-center py-3.5 flex-1">
          <span className="font-headline font-bold text-lg text-primary">{expLabel ?? '—'}</span>
          <span className="font-label text-[10px] text-on-surface-variant mt-0.5">Experiencia</span>
        </div>
        <div className="flex flex-col items-center py-3.5 flex-1">
          <span className="font-headline font-bold text-lg text-primary">
            {resolvedProfile.hourly_rate != null ? `Bs.${resolvedProfile.hourly_rate}` : '—'}
          </span>
          <span className="font-label text-[10px] text-on-surface-variant mt-0.5">por hora</span>
        </div>
        <div className="flex flex-col items-center py-3.5 flex-1">
          <span className="font-headline font-bold text-lg text-primary">{portfolioItems.length}</span>
          <span className="font-label text-[10px] text-on-surface-variant mt-0.5">obras</span>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 px-4 mt-4">

        {/* ── PORTAFOLIO DE OBRAS ──────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Portafolio de obras</SectionLabel>
            {isOwn && !showPortfolioForm && (
              <button
                onClick={() => setShowPortfolioForm(true)}
                className="font-label text-xs text-primary font-semibold active:opacity-70"
              >
                + Agregar obra
              </button>
            )}
          </div>

          {/* Add form */}
          {isOwn && showPortfolioForm && (
            <div className="flex flex-col gap-2.5 bg-surface-container rounded-2xl p-3">
              <input
                value={newPortfolio.title}
                onChange={(e) => setNewPortfolio((p) => ({ ...p, title: e.target.value }))}
                placeholder="Nombre de la obra (ej. Casa unifamiliar en Sucre)"
                className="rounded-xl border border-outline-variant bg-background px-3 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
              <textarea
                value={newPortfolio.description}
                onChange={(e) => setNewPortfolio((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe brevemente el trabajo realizado…"
                rows={2}
                className="rounded-xl border border-outline-variant bg-background px-3 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
              />
              <div className="flex gap-2">
                <input
                  value={newPortfolio.city}
                  onChange={(e) => setNewPortfolio((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Ciudad"
                  className="flex-1 rounded-xl border border-outline-variant bg-background px-3 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
                <input
                  type="number"
                  value={newPortfolio.year}
                  onChange={(e) => setNewPortfolio((p) => ({ ...p, year: Number(e.target.value) }))}
                  placeholder="Año"
                  min={1990}
                  max={new Date().getFullYear()}
                  className="w-24 rounded-xl border border-outline-variant bg-background px-3 py-2.5 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPortfolioForm(false)}
                  className="flex-1 rounded-xl py-2.5 text-sm font-label border border-outline-variant text-on-surface-variant active:opacity-70"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddPortfolio}
                  className="flex-1 bg-primary text-on-primary rounded-xl py-2.5 text-sm font-label font-semibold active:opacity-80"
                >
                  Agregar
                </button>
              </div>
            </div>
          )}

          {/* Portfolio grid */}
          {portfolioItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-2.5">
              {portfolioItems.map((item, idx) => (
                <div key={item.id} className="relative rounded-2xl overflow-hidden aspect-square">
                  {/* Gradient placeholder — Phase B replaces with real photos */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${CARD_GRADIENTS[idx % CARD_GRADIENTS.length]}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                    <span className="font-label font-semibold text-white text-sm leading-tight">
                      {item.title}
                    </span>
                    {item.city && (
                      <span className="font-body text-white/70 text-xs mt-0.5">
                        {item.city} · {item.year}
                      </span>
                    )}
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => setPortfolioItems((prev) => prev.filter((p) => p.id !== item.id))}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 font-label text-white text-xs flex items-center justify-center active:opacity-70"
                      aria-label="Eliminar obra"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {/* Add-more tile */}
              {isOwn && !showPortfolioForm && (
                <button
                  onClick={() => setShowPortfolioForm(true)}
                  className="aspect-square rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-1.5 active:opacity-70"
                >
                  <span className="font-label text-xs text-on-surface-variant">+ Agregar</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-7 text-center">
              <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                <span className="font-headline text-xl text-on-surface-variant">?</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-label text-sm font-semibold text-on-surface">
                  {isOwn ? 'Tu portafolio está vacío' : 'Sin portafolio aún'}
                </span>
                <span className="font-body text-xs text-on-surface-variant max-w-[220px] leading-relaxed">
                  {isOwn
                    ? 'Las fotos de tus obras son lo primero que miran los constructores. Agrega tu mejor trabajo.'
                    : 'Este maestro aún no ha compartido fotos de sus obras.'}
                </span>
              </div>
              {isOwn && !showPortfolioForm && (
                <button
                  onClick={() => setShowPortfolioForm(true)}
                  className="bg-primary/10 text-primary border border-primary/25 rounded-xl px-5 py-2.5 font-label text-sm font-semibold active:opacity-70"
                >
                  + Agregar primera obra
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── ESPECIALIDADES (habilidades como chips) ─────────────────────── */}
        {(habilidades.length > 0 || isOwn) && (
          <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-3">
            <SectionLabel>Especialidades</SectionLabel>
            {habilidades.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {habilidades.map((h) => (
                  <span
                    key={h.id}
                    className="bg-primary/10 text-primary border border-primary/25 font-label text-xs px-3 py-1.5 rounded-full"
                  >
                    {h.skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="font-body text-sm text-on-surface-variant">
                Agrega tus especialidades desde la pestaña Habilidades.
              </p>
            )}
          </div>
        )}

        {/* ── TARIFA + EXPERIENCIA ─────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-3">
          <SectionLabel>Tarifa y experiencia</SectionLabel>
          <div className="flex gap-4">
            {/* Tarifa */}
            <div className="flex-1 flex flex-col gap-1.5">
              <span className="font-label text-xs text-on-surface-variant">Por hora</span>
              {isOwn && editRate !== undefined ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    value={editRate ?? ''}
                    onChange={(e) =>
                      setEditRate(e.target.value === '' ? null : Number(e.target.value))
                    }
                    placeholder="Bs."
                    min={0}
                    className="rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditRate(undefined)}
                      className="flex-1 rounded-xl py-2 text-xs font-label border border-outline-variant text-on-surface-variant active:opacity-70"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSave('hourly_rate', editRate)}
                      disabled={savingField === 'hourly_rate'}
                      className="flex-1 bg-primary text-on-primary rounded-xl py-2 text-xs font-label font-semibold disabled:opacity-50"
                    >
                      {savingField === 'hourly_rate' ? '...' : 'OK'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-headline font-bold text-xl ${
                      resolvedProfile.hourly_rate != null ? 'text-primary' : 'text-on-surface-variant/40'
                    }`}
                  >
                    {resolvedProfile.hourly_rate != null ? `Bs. ${resolvedProfile.hourly_rate}` : '—'}
                  </span>
                  {isOwn && (
                    <button
                      onClick={() => setEditRate(resolvedProfile.hourly_rate)}
                      className="font-label text-[11px] text-primary active:opacity-70"
                    >
                      Editar
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="w-px bg-outline-variant/40" />

            {/* Experiencia */}
            <div className="flex-1 flex flex-col gap-1.5">
              <span className="font-label text-xs text-on-surface-variant">Experiencia</span>
              {isOwn && editYears !== undefined ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    value={editYears ?? ''}
                    onChange={(e) =>
                      setEditYears(e.target.value === '' ? null : Number(e.target.value))
                    }
                    placeholder="Años"
                    min={0}
                    className="rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditYears(undefined)}
                      className="flex-1 rounded-xl py-2 text-xs font-label border border-outline-variant text-on-surface-variant active:opacity-70"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleSave('years_experience', editYears)}
                      disabled={savingField === 'years_experience'}
                      className="flex-1 bg-primary text-on-primary rounded-xl py-2 text-xs font-label font-semibold disabled:opacity-50"
                    >
                      {savingField === 'years_experience' ? '...' : 'OK'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`font-headline font-bold text-xl ${
                      expLabel ? 'text-on-surface' : 'text-on-surface-variant/40'
                    }`}
                  >
                    {expLabel ?? '—'}
                  </span>
                  {isOwn && (
                    <button
                      onClick={() => setEditYears(resolvedProfile.years_experience)}
                      className="font-label text-[11px] text-primary active:opacity-70"
                    >
                      Editar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── ESPECIALIDAD PRINCIPAL (solo para dueño) ─────────────────────── */}
        {isOwn && (
          <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <SectionLabel>Especialidad principal</SectionLabel>
              {editSpecialty === null && (
                <button
                  onClick={() => setEditSpecialty(resolvedProfile.specialty ?? '')}
                  className="font-label text-xs text-primary active:opacity-70"
                >
                  Editar
                </button>
              )}
            </div>
            {editSpecialty !== null ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  placeholder="Ej. Albañilería, Electricidad…"
                  className="rounded-xl border border-outline-variant bg-surface-container px-3 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
                <SaveCancelRow
                  onSave={() => handleSave('specialty', editSpecialty)}
                  onCancel={() => setEditSpecialty(null)}
                  saving={savingField === 'specialty'}
                />
              </div>
            ) : (
              <span
                className={`font-body text-sm ${
                  resolvedProfile.specialty ? 'text-on-surface' : 'text-on-surface-variant/50 italic'
                }`}
              >
                {resolvedProfile.specialty ||
                  'Sin especificar — aparece en el encabezado de tu perfil'}
              </span>
            )}
          </div>
        )}

        {/* ── SOBRE MÍ ─────────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Sobre mí</SectionLabel>
            {isOwn && editBio === null && (
              <button
                onClick={() => setEditBio(resolvedProfile.bio ?? '')}
                className="font-label text-xs text-primary active:opacity-70"
              >
                Editar
              </button>
            )}
          </div>
          {isOwn && editBio !== null ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Cuéntales a los constructores quién eres, qué obras has hecho y en qué te especializas…"
                rows={4}
                className="rounded-xl border border-outline-variant bg-surface-container px-3 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
              />
              <SaveCancelRow
                onSave={() => handleSave('bio', editBio)}
                onCancel={() => setEditBio(null)}
                saving={savingField === 'bio'}
              />
            </div>
          ) : (
            <p
              className={`font-body text-sm leading-relaxed ${
                resolvedProfile.bio ? 'text-on-surface-variant' : 'text-on-surface-variant/40 italic'
              }`}
            >
              {resolvedProfile.bio ||
                (isOwn
                  ? 'Una buena descripción te consigue más trabajo. Cuéntanos sobre ti.'
                  : 'Sin descripción')}
            </p>
          )}
        </div>

        {/* ── ZONA DE TRABAJO ──────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl px-4 py-3.5 border border-outline-variant flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-label text-[11px] uppercase tracking-[0.12em] font-semibold text-on-surface-variant/50">
              Zona de trabajo
            </span>
            <span className="font-body text-sm text-on-surface">
              {resolvedProfile.city || 'Bolivia'} y alrededores
            </span>
          </div>
        </div>

        {/* ── RESEÑAS ──────────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Reseñas de constructores</SectionLabel>
            {reviewsData && reviewsData.totalCount > 0 && (
              <button
                onClick={() => setShowReviewsList((v) => !v)}
                className="text-xs font-label text-primary font-semibold active:opacity-70"
              >
                {showReviewsList ? 'Ocultar' : `Ver ${reviewsData.totalCount}`}
              </button>
            )}
          </div>

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

          {!isOwn && currentUser?.active_role === 'constructor' && (
            alreadyReviewed ? (
              <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2.5 text-on-surface-variant">
                <span className="font-label text-xs">Ya calificaste a este maestro</span>
              </div>
            ) : (
              <button
                onClick={() => setShowReviewForm(true)}
                className="border border-primary/40 bg-primary/5 text-primary rounded-xl py-2.5 font-label font-semibold text-sm active:opacity-75"
              >
                Calificar maestro
              </button>
            )
          )}

          {showReviewsList && reviewsData && reviewsData.reviews.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              {reviewsData.reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── FIXED BOTTOM CTA — constructor view only ────────────────────────── */}
      {!isOwn && (onHire || onChat) && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-outline-variant px-4 py-4 flex gap-3 z-30">
          {onChat && (
            <button
              onClick={() => onChat(resolvedProfile.user_id, resolvedProfile.name)}
              className="flex-1 bg-surface border border-outline-variant text-on-surface rounded-2xl py-3.5 font-label font-semibold text-sm active:opacity-75"
            >
              Chatear
            </button>
          )}
          {onHire && (
            <button
              onClick={onHire}
              className="flex-1 bg-primary text-on-primary rounded-2xl py-3.5 font-label font-semibold text-sm active:opacity-75"
            >
              Contratar
            </button>
          )}
        </div>
      )}

      {/* Review form sheet */}
      {showReviewForm && (
        <ReviewForm
          reviewedId={maestroId}
          reviewedName={resolvedProfile.name}
          onClose={() => setShowReviewForm(false)}
        />
      )}
    </div>
  )
}
