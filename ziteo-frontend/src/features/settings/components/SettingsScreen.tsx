import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { performLogout } from '../../auth/services/authService'
import { useAuthStore } from '../../auth/store/authStore'
import { useToast } from '../../../shared/hooks/useToast'
import { Toast } from '../../../shared/components/Toast'
import { CIUDADES_ACTIVAS } from '../../../shared/constants/geography'

const CITIES = CIUDADES_ACTIVAS

const NOTIF_KEY = 'ziteo_notif_enabled'

interface SettingsScreenProps {
  onLogout: () => void
}

export function SettingsScreen({ onLogout }: SettingsScreenProps) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { toasts, showToast, removeToast } = useToast()

  // ── Notificaciones ──────────────────────────────────────────────────────────
  const [notifEnabled, setNotifEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(NOTIF_KEY)
    return stored === null ? true : stored === 'true'
  })

  function toggleNotif() {
    const next = !notifEnabled
    setNotifEnabled(next)
    localStorage.setItem(NOTIF_KEY, String(next))
  }

  // ── Ciudad ──────────────────────────────────────────────────────────────────
  const [showCityModal, setShowCityModal] = useState(false)
  const [currentCity, setCurrentCity] = useState<string>('')
  const [savingCity, setSavingCity] = useState(false)
  const [selectedCity, setSelectedCity] = useState('')

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

  async function handleSaveCity() {
    if (!user || !selectedCity) return
    setSavingCity(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ city: selectedCity })
        .eq('user_id', user.user_id)
      if (error) throw error
      setCurrentCity(selectedCity)
      setShowCityModal(false)
      showToast('Ciudad actualizada', 'success')
    } catch {
      showToast('Error al guardar la ciudad', 'error')
    } finally {
      setSavingCity(false)
    }
  }

  // ── Cambiar PIN ─────────────────────────────────────────────────────────────
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinForm, setPinForm] = useState({ current: '', next: '', confirm: '' })
  const [pinError, setPinError] = useState('')
  const [savingPin, setSavingPin] = useState(false)

  function openPinModal() {
    setPinForm({ current: '', next: '', confirm: '' })
    setPinError('')
    setShowPinModal(true)
  }

  async function handleSavePin() {
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

  // ── Cerrar sesión ───────────────────────────────────────────────────────────
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleConfirmLogout() {
    setLoggingOut(true)
    try {
      await performLogout()
    } finally {
      logout()
      onLogout()
    }
  }

  // ── Términos / Privacidad ───────────────────────────────────────────────────
  const [legalModal, setLegalModal] = useState<'terms' | 'privacy' | null>(null)

  // ── Helpers UI ──────────────────────────────────────────────────────────────
  const itemClass =
    'flex items-center gap-3 px-4 py-4 bg-surface border-b border-outline-variant w-full text-left active:opacity-70 transition-opacity'

  return (
    <div className="flex flex-col pb-8 min-h-dvh relative">
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* ── SECCIÓN CUENTA ──────────────────────────────────────────────────── */}
      <div className="mt-4">
        <span className="block px-4 pb-2 font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">
          Cuenta
        </span>
        <div className="bg-surface">
          {/* Cambiar PIN */}
          <button className={itemClass} onClick={openPinModal}>
            <span className="material-symbols-outlined text-on-surface-variant">lock</span>
            <span className="flex-1 font-body text-sm text-on-surface">Cambiar PIN</span>
            <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
          </button>

          {/* Notificaciones */}
          <div className={itemClass}>
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            <span className="flex-1 font-body text-sm text-on-surface">Notificaciones</span>
            <button
              onClick={toggleNotif}
              aria-label={notifEnabled ? 'Desactivar notificaciones' : 'Activar notificaciones'}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                notifEnabled ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  notifEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Ciudad */}
          <button
            className={itemClass}
            onClick={() => {
              setSelectedCity(currentCity)
              setShowCityModal(true)
            }}
          >
            <span className="material-symbols-outlined text-on-surface-variant">location_city</span>
            <span className="flex-1 font-body text-sm text-on-surface">Ciudad</span>
            <span className="font-body text-sm text-on-surface-variant mr-1">
              {currentCity || 'No definida'}
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── SECCIÓN APLICACIÓN ──────────────────────────────────────────────── */}
      <div className="mt-6">
        <span className="block px-4 pb-2 font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">
          Aplicación
        </span>
        <div className="bg-surface">
          {/* Versión */}
          <div className={itemClass}>
            <span className="material-symbols-outlined text-on-surface-variant">info</span>
            <span className="flex-1 font-body text-sm text-on-surface">Versión</span>
            <span className="font-body text-sm text-on-surface-variant">1.0.0 MVP</span>
          </div>

          {/* Términos */}
          <button className={itemClass} onClick={() => setLegalModal('terms')}>
            <span className="material-symbols-outlined text-on-surface-variant">description</span>
            <span className="flex-1 font-body text-sm text-on-surface">Términos y condiciones</span>
            <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
          </button>

          {/* Privacidad */}
          <button className={itemClass} onClick={() => setLegalModal('privacy')}>
            <span className="material-symbols-outlined text-on-surface-variant">policy</span>
            <span className="flex-1 font-body text-sm text-on-surface">Política de privacidad</span>
            <span className="material-symbols-outlined text-on-surface-variant text-base">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── SECCIÓN SESIÓN ──────────────────────────────────────────────────── */}
      <div className="mt-6">
        <span className="block px-4 pb-2 font-label text-[11px] uppercase tracking-[0.14em] font-semibold text-on-surface-variant/50">
          Sesión
        </span>
        <div className="bg-surface">
          <button
            className={`${itemClass} text-error`}
            onClick={() => setShowLogoutConfirm(true)}
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="flex-1 font-body text-sm font-medium">Cerrar sesión</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CAMBIAR PIN
      ═══════════════════════════════════════════════════════════════════════ */}
      {showPinModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => !savingPin && setShowPinModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl text-on-surface font-semibold">Cambiar PIN</h2>
              <button
                onClick={() => !savingPin && setShowPinModal(false)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container active:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-on-surface">close</span>
              </button>
            </div>

            {(['current', 'next', 'confirm'] as const).map((field) => {
              const labels = {
                current: 'PIN actual',
                next: 'PIN nuevo',
                confirm: 'Confirmar PIN nuevo',
              }
              return (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="font-label text-sm text-on-surface-variant px-1">
                    {labels[field]}
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinForm[field]}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setPinForm((prev) => ({ ...prev, [field]: val }))
                    }}
                    disabled={savingPin}
                    placeholder="••••"
                    className="rounded-2xl py-3.5 px-4 bg-transparent border border-outline-variant text-on-surface font-body outline-none focus:border-primary transition-colors tracking-widest text-center text-lg"
                  />
                </div>
              )
            })}

            {pinError && (
              <p className="font-body text-sm text-error px-1">{pinError}</p>
            )}

            <button
              onClick={handleSavePin}
              disabled={savingPin}
              className="mt-2 mb-2 w-full bg-primary text-on-primary font-label font-semibold rounded-2xl py-4 transition-opacity active:opacity-80 disabled:opacity-50 flex items-center justify-center min-h-[56px]"
            >
              {savingPin ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                'Guardar PIN'
              )}
            </button>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CIUDAD
      ═══════════════════════════════════════════════════════════════════════ */}
      {showCityModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => !savingCity && setShowCityModal(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl text-on-surface font-semibold">Seleccionar ciudad</h2>
              <button
                onClick={() => !savingCity && setShowCityModal(false)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container active:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-on-surface">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-colors ${
                    selectedCity === city
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface active:bg-surface-container'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-base"
                    style={
                      selectedCity === city
                        ? { fontVariationSettings: "'FILL' 1" }
                        : undefined
                    }
                  >
                    {selectedCity === city ? 'radio_button_checked' : 'radio_button_unchecked'}
                  </span>
                  <span className="font-body text-sm">{city}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveCity}
              disabled={savingCity || !selectedCity}
              className="w-full bg-primary text-on-primary font-label font-semibold rounded-2xl py-4 transition-opacity active:opacity-80 disabled:opacity-50 flex items-center justify-center min-h-[56px]"
            >
              {savingCity ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                'Confirmar ciudad'
              )}
            </button>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: CONFIRMAR CIERRE DE SESIÓN
      ═══════════════════════════════════════════════════════════════════════ */}
      {showLogoutConfirm && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => !loggingOut && setShowLogoutConfirm(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-6 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-error text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  logout
                </span>
              </div>
              <h2 className="font-headline text-xl text-on-surface font-semibold text-center">
                ¿Cerrar sesión?
              </h2>
              <p className="font-body text-sm text-on-surface-variant text-center">
                Tendrás que volver a ingresar con tu número y PIN.
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                className="w-full bg-error text-on-error font-label font-semibold rounded-2xl py-4 transition-opacity active:opacity-80 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[56px]"
              >
                {loggingOut ? (
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">logout</span>
                    Cerrar sesión
                  </>
                )}
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="w-full bg-surface-container text-on-surface font-label font-semibold rounded-2xl py-4 transition-opacity active:opacity-80 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: LEGAL (TÉRMINOS / PRIVACIDAD)
      ═══════════════════════════════════════════════════════════════════════ */}
      {legalModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setLegalModal(null)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl p-6 flex flex-col gap-4 max-h-[80vh]">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl text-on-surface font-semibold">
                {legalModal === 'terms' ? 'Términos y condiciones' : 'Política de privacidad'}
              </h2>
              <button
                onClick={() => setLegalModal(null)}
                className="w-11 h-11 flex items-center justify-center rounded-full bg-surface-container active:opacity-80 transition-opacity"
              >
                <span className="material-symbols-outlined text-on-surface">close</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 font-body text-sm text-on-surface-variant leading-relaxed">
              {legalModal === 'terms' ? (
                <p>
                  Al usar ZITEO aceptas nuestros términos de servicio. Esta plataforma conecta
                  constructores, proveedores, maestros de obra y choferes para facilitar proyectos
                  de construcción en Bolivia. El contenido de esta sección será completado próximamente.
                </p>
              ) : (
                <p>
                  ZITEO recopila datos necesarios para el funcionamiento de la plataforma: número de
                  teléfono, nombre, ciudad y actividad dentro de la app. No compartimos tu información
                  con terceros sin tu consentimiento. El contenido completo de esta sección estará
                  disponible próximamente.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
