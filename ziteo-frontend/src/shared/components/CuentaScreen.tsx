import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Z } from '@/shared/design/tokens'
import { ZHeader } from '@/shared/design/components/ZHeader'
import { ZScreen } from '@/shared/design/components/ZScreen'
import { useAuthStore } from '@/features/auth/store/authStore'
import { usePaymentQr } from '@/features/proveedor/hooks/usePaymentQr'
import { useToast } from '@/shared/hooks/useToast'
import { Toast } from '@/shared/components/Toast'
import { supabase } from '@/lib/supabaseClient'
import { CIUDADES_ACTIVAS } from '@/shared/constants/geography'

interface CuentaScreenProps {
  onClose: () => void
}

export function CuentaScreen({ onClose }: CuentaScreenProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const role = user?.active_role ?? 'constructor'
  const { toasts, showToast, removeToast } = useToast()
  const { uploadQr, uploading } = usePaymentQr()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── States ──────────────────────────────────────────────────────────────────
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('ziteo_notif_enabled')
    return stored === null ? true : stored === 'true'
  })
  const [showCityModal, setShowCityModal] = useState(false)
  const [currentCity, setCurrentCity] = useState(user?.city || '')
  const [savingCity, setSavingCity] = useState(false)
  const [selectedCity, setSelectedCity] = useState(user?.city || '')

  const [showPinModal, setShowPinModal] = useState(false)
  const [pinForm, setPinForm] = useState({ current: '', next: '', confirm: '' })
  const [pinError, setPinError] = useState('')
  const [savingPin, setSavingPin] = useState(false)

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null)

  const activeCities = CIUDADES_ACTIVAS || ['Sucre', 'Potosí', 'Santa Cruz']

  // ── Queries & Effects ───────────────────────────────────────────────────────
  const { data: qrStatus, refetch: refetchQr } = useQuery<{ payment_qr_url: string | null }>({
    queryKey: ['qr-status', user?.user_id, role],
    enabled: !!user?.user_id && (role === 'proveedor' || role === 'constructor'),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('payment_qr_url')
        .eq('user_id', user!.user_id)
        .eq('role', role)
        .maybeSingle()
      if (error) throw error
      return data ?? { payment_qr_url: null }
    },
  })

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('city')
      .eq('user_id', user.user_id)
      .single()
      .then(({ data }) => {
        if (data?.city) {
          setCurrentCity(data.city)
          setSelectedCity(data.city)
        }
      })
  }, [user])

  const hasQr = !!qrStatus?.payment_qr_url

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast('El archivo no puede superar 5 MB', 'error')
      e.target.value = ''
      return
    }
    try {
      await uploadQr(file)
      await refetchQr()
      showToast('QR de cobranza actualizado', 'success')
    } catch {
      showToast('Error al subir el QR', 'error')
    }
    e.target.value = ''
  }

  const toggleNotif = () => {
    const next = !notifEnabled
    setNotifEnabled(next)
    localStorage.setItem('ziteo_notif_enabled', String(next))
    showToast(next ? 'Notificaciones activadas' : 'Notificaciones desactivadas', 'success')
  }

  const handleSaveCity = async () => {
    if (!user || !selectedCity) return
    setSavingCity(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ city: selectedCity })
        .eq('user_id', user.user_id)
      if (error) throw error
      setCurrentCity(selectedCity)
      useAuthStore.setState((state) => {
        if (state.user) {
          return { user: { ...state.user, city: selectedCity } }
        }
        return {}
      })
      setShowCityModal(false)
      showToast('Ciudad actualizada', 'success')
    } catch {
      showToast('Error al guardar la ciudad', 'error')
    } finally {
      setSavingCity(false)
    }
  }

  const handleSavePin = async () => {
    setPinError('')
    if (pinForm.current.length < 4) {
      setPinError('El PIN actual debe tener al menos 4 dígitos')
      return
    }
    if (pinForm.next.length < 4) {
      setPinError('El PIN nuevo debe tener al menos 4 dígitos')
      return
    }
    if (pinForm.next === pinForm.current) {
      setPinError('El PIN nuevo debe ser diferente al PIN actual')
      return
    }
    if (pinForm.next !== pinForm.confirm) {
      setPinError('Los PINs nuevos no coinciden')
      return
    }
    setSavingPin(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pinForm.next })
      if (error) throw error
      setShowPinModal(false)
      showToast('PIN actualizado correctamente', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el PIN'
      showToast(msg, 'error')
    } finally {
      setSavingPin(false)
    }
  }

  const handleConfirmLogout = async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
    } finally {
      logout()
      onClose()
    }
  }

  return (
    <ZScreen bg={Z.bg} style={{ position: 'fixed', zIndex: 100 }}>
      <Toast toasts={toasts} onRemove={removeToast} />
      <ZHeader title="Mi cuenta" onBack={onClose} />
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 48px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Sección: info del usuario */}
        <div style={{
          padding: '16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`,
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>
            {user?.name}
          </div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 4 }}>
            +591 {user?.phone?.startsWith('+591') ? user.phone.slice(4) : user?.phone}
            {currentCity ? ` · ${currentCity}` : ''}
          </div>
        </div>

        {/* Sección: QR de Cobranza (Proveedores y Constructores) */}
        {(role === 'proveedor' || role === 'constructor') && (
          <div>
            <div style={{
              fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted,
              letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
            }}>
              QR de Cobranza
            </div>
            <div style={{
              padding: '16px', borderRadius: Z.r.md, background: Z.surface,
              border: `1px solid ${Z.border}`, display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>
                    {hasQr ? 'QR de cobro activo' : 'Sin QR configurado'}
                  </div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 3 }}>
                    {hasQr
                      ? 'Se muestra a compradores para facilitar el pago'
                      : 'Sube tu QR de cobro (Tigo Money, QR BCB, etc.)'}
                  </div>
                </div>
                {hasQr && (
                  <div style={{
                    padding: '4px 10px', borderRadius: 20, background: Z.success + '18',
                    fontFamily: Z.font, fontSize: 10, fontWeight: 700, color: Z.success,
                  }}>
                    Activo
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  padding: '10px 16px', borderRadius: Z.r.sm, cursor: 'pointer',
                  background: uploading ? Z.divider : (hasQr ? Z.surface : Z.orangeDark),
                  color: uploading ? Z.textMuted : (hasQr ? Z.text : '#fff'),
                  border: hasQr ? `1.5px solid ${Z.border}` : 'none',
                  fontFamily: Z.font, fontSize: 13, fontWeight: 700,
                  width: '100%', outline: 'none',
                } as React.CSSProperties}
              >
                {uploading
                  ? 'Subiendo...'
                  : hasQr
                    ? 'Reemplazar QR'
                    : 'Subir QR de cobro'}
              </button>
            </div>
          </div>
        )}

        {/* Sección: Configuración de Cuenta */}
        <div>
          <div style={{
            fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted,
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
          }}>
            Configuración de Cuenta
          </div>
          <div style={{
            padding: '16px', borderRadius: Z.r.md, background: Z.surface,
            border: `1px solid ${Z.border}`, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            {/* Cambiar PIN */}
            <button
              onClick={() => {
                setPinForm({ current: '', next: '', confirm: '' })
                setPinError('')
                setShowPinModal(true)
              }}
              style={{
                background: 'transparent', border: 'none', padding: 0, margin: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: Z.textSec, fontSize: 20 }}>lock</span>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>
                  Cambiar PIN
                </span>
              </div>
              <span className="material-symbols-outlined" style={{ color: Z.textMuted, fontSize: 18 }}>chevron_right</span>
            </button>

            <div style={{ height: 1, background: Z.divider }} />

            {/* Ciudad */}
            <button
              onClick={() => {
                setSelectedCity(currentCity)
                setShowCityModal(true)
              }}
              style={{
                background: 'transparent', border: 'none', padding: 0, margin: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: Z.textSec, fontSize: 20 }}>location_city</span>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>
                  Ciudad
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>
                  {currentCity || 'No definida'}
                </span>
                <span className="material-symbols-outlined" style={{ color: Z.textMuted, fontSize: 18 }}>chevron_right</span>
              </div>
            </button>

            <div style={{ height: 1, background: Z.divider }} />

            {/* Notificaciones */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: Z.textSec, fontSize: 20 }}>notifications</span>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>
                  Notificaciones
                </span>
              </div>
              <button
                onClick={toggleNotif}
                style={{
                  position: 'relative', display: 'inline-flex', height: 24, width: 44,
                  alignItems: 'center', borderRadius: 9999, border: 'none', cursor: 'pointer',
                  backgroundColor: notifEnabled ? Z.orangeDark : Z.divider,
                  transition: 'background-color 0.2s', outline: 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-block', height: 16, width: 16, borderRadius: '50%',
                    backgroundColor: '#fff', transition: 'transform 0.2s',
                    transform: notifEnabled ? 'translateX(24px)' : 'translateX(4px)',
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Sección: Aplicación */}
        <div>
          <div style={{
            fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted,
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
          }}>
            Aplicación
          </div>
          <div style={{
            padding: '16px', borderRadius: Z.r.md, background: Z.surface,
            border: `1px solid ${Z.border}`, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: Z.textSec, fontSize: 20 }}>info</span>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>
                  Versión
                </span>
              </div>
              <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>
                1.0.0 MVP
              </span>
            </div>

            <div style={{ height: 1, background: Z.divider }} />

            <button
              onClick={() => setLegalModal('terms')}
              style={{
                background: 'transparent', border: 'none', padding: 0, margin: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: Z.textSec, fontSize: 20 }}>description</span>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>
                  Términos y condiciones
                </span>
              </div>
              <span className="material-symbols-outlined" style={{ color: Z.textMuted, fontSize: 18 }}>chevron_right</span>
            </button>

            <div style={{ height: 1, background: Z.divider }} />

            <button
              onClick={() => setLegalModal('privacy')}
              style={{
                background: 'transparent', border: 'none', padding: 0, margin: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ color: Z.textSec, fontSize: 20 }}>policy</span>
                <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>
                  Política de privacidad
                </span>
              </div>
              <span className="material-symbols-outlined" style={{ color: Z.textMuted, fontSize: 18 }}>chevron_right</span>
            </button>
          </div>
        </div>

        {/* Sección: Sesión */}
        <div>
          <div style={{
            fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted,
            letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
          }}>
            Sesión
          </div>
          <div style={{
            padding: '16px', borderRadius: Z.r.md, background: Z.surface,
            border: `1px solid ${Z.border}`, display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                background: 'transparent', border: 'none', padding: 0, margin: 0,
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{ color: Z.error, fontSize: 20 }}>logout</span>
              <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.error }}>
                Cerrar sesión
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* ── Modal: Cambiar PIN ── */}
      {showPinModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 110, display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)',
        }}>
          <div
            style={{ position: 'absolute', inset: 0 }}
            onClick={() => !savingPin && setShowPinModal(false)}
          />
          <div style={{
            position: 'relative', background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: '24px', display: 'flex', flexDirection: 'column', gap: 16,
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.text, margin: 0 }}>
                Cambiar PIN
              </h2>
              <button
                onClick={() => !savingPin && setShowPinModal(false)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', background: Z.divider,
                  display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', outline: 'none',
                }} aria-label="Cerrar"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: Z.text }}>close</span>
              </button>
            </div>

            {(['current', 'next', 'confirm'] as const).map((field) => {
              const labels = {
                current: 'PIN actual',
                next: 'PIN nuevo',
                confirm: 'Confirmar PIN nuevo',
              }
              return (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec }}>
                    {labels[field]}
                  </label>
                  <input
                    type="password"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinForm[field]}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setPinForm((prev) => ({ ...prev, [field]: val }))
                    }}
                    disabled={savingPin}
                    placeholder="••••"
                    style={{
                      borderRadius: Z.r.sm, padding: '12px 16px', background: Z.bg,
                      border: `1.5px solid ${Z.border}`, fontFamily: Z.font, fontSize: 16,
                      textAlign: 'center', letterSpacing: 4, outline: 'none', color: Z.text,
                    }}
                  />
                </div>
              )
            })}

            {pinError && (
              <p style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, margin: 0, paddingLeft: 4 }}>
                {pinError}
              </p>
            )}

            <button
              onClick={handleSavePin}
              disabled={savingPin}
              style={{
                background: Z.orangeDark, color: '#fff', fontFamily: Z.font, fontSize: 14,
                fontWeight: 700, border: 'none', borderRadius: Z.r.sm, padding: '14px',
                cursor: 'pointer', outline: 'none', transition: 'opacity 0.2s',
                opacity: savingPin ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {savingPin ? 'Guardando PIN...' : 'Guardar PIN'}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Ciudad ── */}
      {showCityModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 110, display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)',
        }}>
          <div
            style={{ position: 'absolute', inset: 0 }}
            onClick={() => !savingCity && setShowCityModal(false)}
          />
          <div style={{
            position: 'relative', background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: '24px', display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.text, margin: 0 }}>
                Seleccionar Ciudad
              </h2>
              <button
                onClick={() => !savingCity && setShowCityModal(false)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', background: Z.divider,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none',
                }} aria-label="Cerrar"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: Z.text }}>close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeCities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderRadius: Z.r.sm, border: `1.5px solid ${selectedCity === city ? Z.orangeDark : Z.border}`,
                    background: selectedCity === city ? Z.orangeLight + '22' : Z.surface,
                    cursor: 'pointer', outline: 'none', textAlign: 'left', width: '100%',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, color: selectedCity === city ? Z.orangeDark : Z.textMuted }}
                  >
                    {selectedCity === city ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                  <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>
                    {city}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveCity}
              disabled={savingCity || !selectedCity}
              style={{
                background: Z.orangeDark, color: '#fff', fontFamily: Z.font, fontSize: 14,
                fontWeight: 700, border: 'none', borderRadius: Z.r.sm, padding: '14px',
                cursor: 'pointer', outline: 'none', transition: 'opacity 0.2s',
                opacity: savingCity ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {savingCity ? 'Guardando...' : 'Confirmar ciudad'}
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar Cierre de Sesión ── */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 110, display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)',
        }}>
          <div
            style={{ position: 'absolute', inset: 0 }}
            onClick={() => !loggingOut && setShowLogoutConfirm(false)}
          />
          <div style={{
            position: 'relative', background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: Z.error + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-outlined" style={{ color: Z.error, fontSize: 28 }}>logout</span>
              </div>
              <h2 style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.text, margin: 0 }}>
                ¿Cerrar sesión?
              </h2>
              <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: 0, lineHeight: 1.4 }}>
                Tendrás que volver a ingresar con tu número de teléfono y PIN.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                style={{
                  background: Z.error, color: '#fff', fontFamily: Z.font, fontSize: 14,
                  fontWeight: 700, border: 'none', borderRadius: Z.r.sm, padding: '14px',
                  cursor: 'pointer', outline: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                style={{
                  background: Z.divider, color: Z.text, fontFamily: Z.font, fontSize: 14,
                  fontWeight: 700, border: 'none', borderRadius: Z.r.sm, padding: '14px',
                  cursor: 'pointer', outline: 'none',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Legal (Términos / Privacidad) ── */}
      {legalModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 110, display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end', background: 'rgba(0,0,0,0.4)',
        }}>
          <div
            style={{ position: 'absolute', inset: 0 }}
            onClick={() => setLegalModal(null)}
          />
          <div style={{
            position: 'relative', background: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text, margin: 0 }}>
                {legalModal === 'terms' ? 'Términos y condiciones' : 'Política de privacidad'}
              </h2>
              <button
                onClick={() => setLegalModal(null)}
                style={{
                  width: 36, height: 36, borderRadius: '50%', border: 'none', background: Z.divider,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none',
                }} aria-label="Cerrar"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: Z.text }}>close</span>
              </button>
            </div>
            <div style={{
              overflowY: 'auto', flex: 1, fontFamily: Z.font, fontSize: 13, color: Z.textSec,
              lineHeight: 1.6, paddingBottom: 16,
            }}>
              {legalModal === 'terms' ? (
                <p style={{ margin: 0 }}>
                  Al usar ZITEO aceptas nuestros términos de servicio. Esta plataforma conecta
                  constructores, proveedores, maestros de obra y choferes para facilitar proyectos
                  de construcción en Bolivia. El contenido de esta sección será completado próximamente.
                </p>
              ) : (
                <p style={{ margin: 0 }}>
                  ZITEO recopila datos necesarios para el funcionamiento de la plataforma: número de
                  teléfono, nombre, ciudad y actividad dentro de la app. No compartimos tu información
                  con terceros sin tu consentimiento. El contenido completo de esta sección estará
                  disponible próximamente.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

    </ZScreen>
  )
}
