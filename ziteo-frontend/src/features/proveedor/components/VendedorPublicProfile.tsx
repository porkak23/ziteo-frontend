import { useEffect, useRef, useState } from 'react'
import { useVendedorProfile, useUpdateVendedorProfile, useBootstrapVendedorRole } from '../hooks/useVendedorProfile'
import { supabase } from '../../../lib/supabaseClient'
import { usePaymentQr } from '../hooks/usePaymentQr'
import { useUploadPhoto } from '../../../shared/hooks/useUploadPhoto'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { SaveCancelRow } from '../../../shared/design/components/SaveCancelRow'
import { SectionLabel } from '../../../shared/design/components/SectionLabel'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface VendedorPublicProfileProps {
  vendedorId: string
  isOwn: boolean
  onBack?: () => void
  onContact?: (vendedorId: string, name: string) => void
  authUser?: { user_id: string; name: string; city?: string | null; avatar_url?: string } | null
}

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

export function VendedorPublicProfile({
  vendedorId,
  isOwn,
  onBack,
  onContact,
  authUser,
}: VendedorPublicProfileProps) {
  const { data: profile, isLoading, isError, refetch } = useVendedorProfile(vendedorId)
  const { mutateAsync: updateProfile } = useUpdateVendedorProfile()
  const { mutateAsync: bootstrapRole } = useBootstrapVendedorRole()
  const { upload, isUploading } = useUploadPhoto()
  const { toasts, showToast, removeToast } = useToast()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const qrInputRef = useRef<HTMLInputElement>(null)
  const { uploadQr, getSignedQrUrl, uploading: qrUploading } = usePaymentQr()
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  useEffect(() => {
    if (isOwn && profile && profile.store_name === null) {
      bootstrapRole(vendedorId).catch(() => {/* non-fatal */})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwn, !!profile])

  useEffect(() => {
    if (profile?.payment_qr_url) {
      getSignedQrUrl(vendedorId, 'proveedor').then((url) => setQrUrl(url))
    } else {
      setQrUrl(null)
    }
  }, [profile?.payment_qr_url, vendedorId, getSignedQrUrl])

  // Inline edit state
  const [editDesc, setEditDesc] = useState<string | null>(null)
  const [editBank, setEditBank] = useState<string | null>(null)
  const [editMinOrder, setEditMinOrder] = useState<number | null | undefined>(undefined)
  const [editCompany, setEditCompany] = useState<string | null>(null)
  const [editStoreName, setEditStoreName] = useState<string | null>(null)
  const [savingField, setSavingField] = useState<string | null>(null)

  if (isLoading) return <ProfileSkeleton />

  const fallbackProfile =
    (isError || !profile) && isOwn && authUser
      ? {
          user_id: authUser.user_id,
          name: authUser.name,
          city: authUser.city ?? '',
          avatar_url: authUser.avatar_url ?? null,
          store_name: null,
          company_name: null,
          store_logo_url: null,
          store_description: null,
          min_order_amount: null,
          payment_cash: null,
          payment_bank_transfer: null,
          payment_qr_url: null,
          is_available: null,
          is_verified: null,
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

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('El archivo debe ser una imagen', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('La imagen no debe superar los 5MB', 'error')
      return
    }
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const filePath = `${vendedorId}/logo.${ext}`
      await supabase.storage.from('avatars').remove([filePath])
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: false })
      if (uploadErr) throw uploadErr
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = urlData.publicUrl + `?t=${Date.now()}`
      await handleSave('store_logo_url', publicUrl)
      showToast('Logo actualizado', 'success')
    } catch {
      showToast('No se pudo subir el logo', 'error')
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  async function handleQrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const filePath = await uploadQr(file)
      showToast('QR de cobro cargado con éxito', 'success')
      await handleSave('payment_qr_url', filePath)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo subir el QR'
      showToast(msg, 'error')
    } finally {
      if (qrInputRef.current) qrInputRef.current.value = ''
    }
  }

  async function handleSave(field: string, value: unknown) {
    setSavingField(field)
    try {
      const vars: Parameters<typeof updateProfile>[0] = { vendedorId }
      if (field === 'store_description') vars.store_description = value as string | null
      if (field === 'payment_cash') vars.payment_cash = value as boolean
      if (field === 'payment_bank_transfer') vars.payment_bank_transfer = value as string | null
      if (field === 'payment_qr_url') vars.payment_qr_url = value as string | null
      if (field === 'min_order_amount') vars.min_order_amount = value as number | null
      if (field === 'company_name') vars.company_name = value as string | null
      if (field === 'store_name') vars.store_name = value as string | null
      if (field === 'store_logo_url') vars.store_logo_url = value as string | null
      if (field === 'is_available') vars.is_available = value as boolean
      await updateProfile(vars)
      if (field !== 'store_logo_url' && field !== 'payment_qr_url') {
        showToast('Guardado', 'success')
      }
      if (field === 'store_description') setEditDesc(null)
      if (field === 'payment_bank_transfer') setEditBank(null)
      if (field === 'min_order_amount') setEditMinOrder(undefined)
      if (field === 'company_name') setEditCompany(null)
      if (field === 'store_name') setEditStoreName(null)
    } catch {
      showToast('Error al guardar', 'error')
    } finally {
      setSavingField(null)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const displayName = resolvedProfile.store_name || resolvedProfile.name
  const initial = displayName?.charAt(0)?.toUpperCase() ?? '?'
  const isAvailable = resolvedProfile.is_available ?? false

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
            <span className="font-label text-sm text-on-primary/60">Mi tienda</span>
          )}

          {isOwn && (
            <button
              role="switch"
              aria-checked={isAvailable}
              onClick={() => handleSave('is_available', !isAvailable)}
              disabled={savingField === 'is_available'}
              className={`font-label text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                isAvailable
                  ? 'bg-white/20 border-white/30 text-on-primary'
                  : 'bg-black/15 border-white/10 text-on-primary/60'
              }`}
            >
              {isAvailable ? 'Disponible' : 'No disponible'}
            </button>
          )}
        </div>

        {/* Logo + identity */}
        <div className="flex items-end gap-4 mt-2">
          <div className="relative w-24 h-24 flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/20 flex items-center justify-center ring-4 ring-white/20">
              {resolvedProfile.store_logo_url ? (
                <img
                  src={resolvedProfile.store_logo_url}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              ) : resolvedProfile.avatar_url ? (
                <img
                  src={resolvedProfile.avatar_url}
                  alt={displayName}
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
                  onClick={() => !isUploading && logoInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute -bottom-1 -right-1 bg-background text-primary font-label text-[10px] font-semibold px-2 py-1 rounded-lg shadow active:opacity-80 disabled:opacity-50"
                  aria-label="Cambiar logo de tienda"
                >
                  Logo
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </>
            )}
          </div>

          <div className="flex flex-col gap-1.5 flex-1 min-w-0 pb-1">
            {isOwn && editStoreName !== null ? (
              <div className="flex flex-col gap-1.5">
                <input
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  placeholder="Nombre de tu tienda"
                  className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm font-body text-on-primary placeholder:text-on-primary/40 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditStoreName(null)}
                    className="flex-1 rounded-xl py-1.5 text-xs font-label border border-white/20 text-on-primary/70 active:opacity-70"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSave('store_name', editStoreName)}
                    disabled={savingField === 'store_name'}
                    className="flex-1 bg-white/20 text-on-primary rounded-xl py-1.5 text-xs font-label font-semibold disabled:opacity-50 active:opacity-80"
                  >
                    {savingField === 'store_name' ? '...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-2xl text-on-primary leading-tight">
                  {displayName}
                </span>
                {isOwn && (
                  <button
                    onClick={() => setEditStoreName(resolvedProfile.store_name ?? '')}
                    className="font-label text-[10px] text-on-primary/60 active:opacity-70 flex-shrink-0"
                  >
                    Editar
                  </button>
                )}
              </div>
            )}
            {resolvedProfile.company_name && !isOwn && (
              <span className="font-body text-sm text-on-primary/80">{resolvedProfile.company_name}</span>
            )}
            <span className="font-body text-sm text-on-primary/60">{resolvedProfile.city || 'Bolivia'}</span>
            {resolvedProfile.is_verified && (
              <span className="self-start bg-white/20 text-on-primary font-label text-[10px] font-semibold px-2.5 py-1 rounded-full">
                Verificado
              </span>
            )}
          </div>
        </div>

        {/* Avatar (owner only) */}
        {isOwn && (
          <div className="flex items-center gap-2 self-end -mt-2">
            <button
              onClick={() => !isUploading && photoInputRef.current?.click()}
              disabled={isUploading}
              className="font-label text-[10px] text-on-primary/60 active:opacity-70"
            >
              Cambiar foto de perfil
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        )}

        {/* Availability pill (public view) */}
        {!isOwn && (
          <span
            className={`self-start font-label text-xs px-3 py-1.5 rounded-full ${
              isAvailable
                ? 'bg-green-400/25 text-green-100 ring-1 ring-green-300/30'
                : 'bg-black/20 text-on-primary/50'
            }`}
          >
            {isAvailable ? 'Abierto para pedidos' : 'No disponible'}
          </span>
        )}
      </div>

      {/* ── STATS STRIP ─────────────────────────────────────────────────────── */}
      <div className="mx-4 -mt-7 bg-surface rounded-2xl border border-outline-variant shadow-sm flex divide-x divide-outline-variant/40 z-10 relative">
        <div className="flex flex-col items-center py-3.5 flex-1">
          <span className="font-headline font-bold text-lg text-primary">—</span>
          <span className="font-label text-[10px] text-on-surface-variant mt-0.5">Reseñas</span>
        </div>
        <div className="flex flex-col items-center py-3.5 flex-1">
          <span className="font-headline font-bold text-lg text-primary">
            {resolvedProfile.min_order_amount != null ? `Bs.${resolvedProfile.min_order_amount}` : '—'}
          </span>
          <span className="font-label text-[10px] text-on-surface-variant mt-0.5">Pedido mínimo</span>
        </div>
        <div className="flex flex-col items-center py-3.5 flex-1">
          <span className="font-headline font-bold text-lg text-on-surface truncate max-w-[70px] text-center px-1">
            {resolvedProfile.city || '—'}
          </span>
          <span className="font-label text-[10px] text-on-surface-variant mt-0.5">Ciudad</span>
        </div>
        <div className="flex flex-col items-center py-3.5 flex-1">
          <span
            className={`font-headline font-bold text-base ${
              isAvailable ? 'text-green-500' : 'text-on-surface-variant/40'
            }`}
          >
            {isAvailable ? 'Abierto' : 'Cerrado'}
          </span>
          <span className="font-label text-[10px] text-on-surface-variant mt-0.5">Estado</span>
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 px-4 mt-4">

        {/* ── SOBRE LA EMPRESA ────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Sobre la empresa</SectionLabel>
            {isOwn && editDesc === null && (
              <button
                onClick={() => setEditDesc(resolvedProfile.store_description ?? '')}
                className="font-label text-xs text-primary active:opacity-70"
              >
                Editar
              </button>
            )}
          </div>
          {isOwn && editDesc !== null ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Cuéntales a los constructores qué vendes, qué materiales tienes y en qué te especializas…"
                rows={4}
                maxLength={500}
                className="rounded-xl border border-outline-variant bg-surface-container px-3 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="font-label text-[10px] text-on-surface-variant/40">
                  {editDesc.length}/500
                </span>
              </div>
              <SaveCancelRow
                onSave={() => handleSave('store_description', editDesc)}
                onCancel={() => setEditDesc(null)}
                saving={savingField === 'store_description'}
              />
            </div>
          ) : (
            <p
              className={`font-body text-sm leading-relaxed ${
                resolvedProfile.store_description
                  ? 'text-on-surface-variant'
                  : 'text-on-surface-variant/40 italic'
              }`}
            >
              {resolvedProfile.store_description ||
                (isOwn
                  ? 'Una buena descripción atrae más clientes. Cuéntanos sobre tu empresa.'
                  : 'Sin descripción')}
            </p>
          )}
        </div>

        {/* ── MÉTODOS DE PAGO ─────────────────────────────────────────────── */}
        {(isOwn ||
          resolvedProfile.payment_cash ||
          resolvedProfile.payment_bank_transfer ||
          resolvedProfile.payment_qr_url) && (
          <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-3">
            <SectionLabel>Métodos de pago aceptados</SectionLabel>

            <div className="flex flex-col gap-3.5">
              {/* Efectivo */}
              <div className="flex items-center justify-between py-2 border-b border-outline-variant/30">
                <div className="flex flex-col gap-0.5">
                  <span className="font-label text-sm font-semibold text-on-surface">Efectivo</span>
                  <span className="font-body text-xs text-on-surface-variant">Acepta pago directo en efectivo</span>
                </div>
                {isOwn ? (
                  <button
                    role="switch"
                    aria-checked={resolvedProfile.payment_cash ?? false}
                    onClick={() => handleSave('payment_cash', !(resolvedProfile.payment_cash ?? false))}
                    className={`w-11 h-6 rounded-full relative transition-colors ${
                      resolvedProfile.payment_cash ? 'bg-primary' : 'bg-outline-variant/60'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                        resolvedProfile.payment_cash ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                ) : (
                  <span
                    className={`font-label text-xs px-2.5 py-1 rounded-full ${
                      resolvedProfile.payment_cash
                        ? 'bg-green-500/15 text-green-500'
                        : 'bg-outline-variant/30 text-on-surface-variant/50'
                    }`}
                  >
                    {resolvedProfile.payment_cash ? 'Aceptado' : 'No aceptado'}
                  </span>
                )}
              </div>

              {/* Transferencia bancaria */}
              <div className="flex flex-col gap-1.5 py-2 border-b border-outline-variant/30">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label text-sm font-semibold text-on-surface">Transferencia bancaria</span>
                    <span className="font-body text-xs text-on-surface-variant">Datos para depósito o transferencia</span>
                  </div>
                  {isOwn && editBank === null && (
                    <button
                      onClick={() => setEditBank(resolvedProfile.payment_bank_transfer ?? '')}
                      className="font-label text-xs text-primary font-semibold active:opacity-75"
                    >
                      {resolvedProfile.payment_bank_transfer ? 'Editar' : '+ Configurar'}
                    </button>
                  )}
                </div>

                {isOwn && editBank !== null ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <textarea
                      value={editBank}
                      onChange={(e) => setEditBank(e.target.value)}
                      placeholder="Ej. Banco Unión, Cuenta Ahorros: 12345678, Titular: Juan Pérez"
                      rows={3}
                      className="rounded-xl border border-outline-variant bg-surface-container px-3 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary resize-none"
                    />
                    <SaveCancelRow
                      onSave={() => handleSave('payment_bank_transfer', editBank)}
                      onCancel={() => setEditBank(null)}
                      saving={savingField === 'payment_bank_transfer'}
                    />
                  </div>
                ) : resolvedProfile.payment_bank_transfer ? (
                  <div className="bg-surface-container rounded-xl p-3 border border-outline-variant/40 mt-1">
                    <p className="font-body text-xs text-on-surface leading-relaxed whitespace-pre-wrap">
                      {resolvedProfile.payment_bank_transfer}
                    </p>
                  </div>
                ) : (
                  <p className="font-body text-xs text-on-surface-variant/50 italic mt-0.5">
                    {isOwn
                      ? 'Aún no has configurado tus datos bancarios.'
                      : 'No acepta transferencias bancarias.'}
                  </p>
                )}
              </div>

              {/* QR de cobro */}
              <div className="flex flex-col gap-2 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label text-sm font-semibold text-on-surface">Código QR de cobro</span>
                    <span className="font-body text-xs text-on-surface-variant">
                      QR de Simple o de tu banco para pagos rápidos
                    </span>
                  </div>
                  {isOwn && resolvedProfile.payment_qr_url && (
                    <button
                      onClick={() => qrInputRef.current?.click()}
                      className="font-label text-xs text-primary font-semibold active:opacity-75"
                    >
                      Cambiar QR
                    </button>
                  )}
                </div>

                {qrUrl ? (
                  <div className="flex flex-col items-center gap-3 mt-2">
                    <div className="relative w-48 h-48 bg-white p-2 rounded-2xl shadow-sm border border-outline-variant/60">
                      <img src={qrUrl} alt="QR de cobro" className="w-full h-full object-contain" />
                      {isOwn && (
                        <button
                          onClick={() => handleSave('payment_qr_url', null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold text-sm shadow-md active:opacity-85"
                          title="Eliminar QR"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ) : isOwn ? (
                  <div
                    onClick={() => !qrUploading && qrInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant hover:border-primary/50 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">qr_code_2</span>
                    <span className="font-label text-xs font-semibold text-on-surface-variant">
                      {qrUploading ? 'Subiendo código...' : 'Cargar imagen de tu QR de cobro'}
                    </span>
                    <span className="font-body text-[10px] text-on-surface-variant/40">PNG, JPG o WEBP (máx 5MB)</span>
                    <input
                      ref={qrInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQrChange}
                    />
                  </div>
                ) : (
                  <p className="font-body text-xs text-on-surface-variant/50 italic mt-0.5">
                    No tiene un código QR configurado.
                  </p>
                )}
                {isOwn && resolvedProfile.payment_qr_url && (
                  <input
                    ref={qrInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleQrChange}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PEDIDO MÍNIMO ────────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Pedido mínimo</SectionLabel>
            {isOwn && editMinOrder === undefined && (
              <button
                onClick={() => setEditMinOrder(resolvedProfile.min_order_amount)}
                className="font-label text-xs text-primary active:opacity-70"
              >
                Editar
              </button>
            )}
          </div>
          {isOwn && editMinOrder !== undefined ? (
            <div className="flex flex-col gap-2">
              <input
                type="number"
                value={editMinOrder ?? ''}
                onChange={(e) =>
                  setEditMinOrder(e.target.value === '' ? null : Number(e.target.value))
                }
                placeholder="Monto en Bs."
                min={0}
                className="rounded-xl border border-outline-variant bg-surface-container px-3 py-2 text-sm font-body text-on-surface focus:outline-none focus:border-primary"
              />
              <SaveCancelRow
                onSave={() => handleSave('min_order_amount', editMinOrder)}
                onCancel={() => setEditMinOrder(undefined)}
                saving={savingField === 'min_order_amount'}
              />
            </div>
          ) : (
            <span
              className={`font-headline font-bold text-xl ${
                resolvedProfile.min_order_amount != null
                  ? 'text-primary'
                  : 'text-on-surface-variant/40'
              }`}
            >
              {resolvedProfile.min_order_amount != null
                ? `Bs. ${resolvedProfile.min_order_amount}`
                : 'Sin mínimo'}
            </span>
          )}
        </div>

        {/* ── EMPRESA / NIT (solo dueño) ───────────────────────────────────── */}
        {isOwn && (
          <div className="bg-surface rounded-2xl p-4 border border-outline-variant flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <SectionLabel>Nombre legal / NIT</SectionLabel>
                <span className="font-body text-[10px] text-on-surface-variant/40">Solo visible para ti</span>
              </div>
              {editCompany === null && (
                <button
                  onClick={() => setEditCompany(resolvedProfile.company_name ?? '')}
                  className="font-label text-xs text-primary active:opacity-70"
                >
                  Editar
                </button>
              )}
            </div>
            {editCompany !== null ? (
              <div className="flex flex-col gap-2">
                <input
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  placeholder="Ej. Materiales Pérez S.R.L. o NIT 123456789"
                  className="rounded-xl border border-outline-variant bg-surface-container px-3 py-2.5 text-sm font-body text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
                />
                <SaveCancelRow
                  onSave={() => handleSave('company_name', editCompany)}
                  onCancel={() => setEditCompany(null)}
                  saving={savingField === 'company_name'}
                />
              </div>
            ) : (
              <span
                className={`font-body text-sm ${
                  resolvedProfile.company_name
                    ? 'text-on-surface'
                    : 'text-on-surface-variant/40 italic'
                }`}
              >
                {resolvedProfile.company_name || 'Sin especificar'}
              </span>
            )}
          </div>
        )}

        {/* ── ZONA DE COBERTURA ────────────────────────────────────────────── */}
        <div className="bg-surface rounded-2xl px-4 py-3.5 border border-outline-variant flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-label text-[11px] uppercase tracking-[0.12em] font-semibold text-on-surface-variant/50">
              Zona de cobertura
            </span>
            <span className="font-body text-sm text-on-surface">
              {resolvedProfile.city || 'Bolivia'} y alrededores
            </span>
          </div>
        </div>

      </div>

      {/* ── FIXED BOTTOM CTA — public view only ─────────────────────────────── */}
      {!isOwn && onContact && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-outline-variant px-4 py-4 z-30">
          <button
            onClick={() =>
              onContact(
                resolvedProfile.user_id,
                resolvedProfile.store_name || resolvedProfile.name,
              )
            }
            className="w-full bg-primary text-on-primary rounded-2xl py-3.5 font-label font-semibold text-sm active:opacity-75"
          >
            Contactar
          </button>
        </div>
      )}
    </div>
  )
}
