import { useEffect, useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { ZAvatar } from '@/shared/design/components/ZAvatar'
import { useAuthStore } from '@/features/auth/store/authStore'
import { useDriverProfile, useSaveVehicleType } from '@/features/transportista/hooks/useDriverProfile'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/shared/hooks/useToast'
import { Toast } from '@/shared/components/Toast'
import type { VehicleType } from '@/features/transportista/types/deliveryTypes'

// ─── Vehicle icons ────────────────────────────────────────────────────────────

function IconMoto({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.75)} viewBox="0 0 40 30" fill="none">
      <circle cx="8"  cy="24" r="5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="32" cy="24" r="5" stroke={color} strokeWidth="2" fill="none" />
      <path
        d="M8 24L12 14L18 12H24L28 16L32 24M24 12L27 8H30M18 12V16H25"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  )
}

function IconCamioneta({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.65)} viewBox="0 0 42 28" fill="none">
      <rect x="2" y="5" width="38" height="15" rx="2.5" stroke={color} strokeWidth="2" fill="none" />
      <path d="M4 7h13v9H4V7z" stroke={color} strokeWidth="1.6" fill="none" />
      <circle cx="9"  cy="22" r="4" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="33" cy="22" r="4" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  )
}

function IconPickup({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.6)} viewBox="0 0 44 26" fill="none">
      <path
        d="M2 20V10a2 2 0 012-2h14v12H2z"
        stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round"
      />
      <path d="M4 11h10v5H4v-5z" stroke={color} strokeWidth="1.5" fill="none" />
      <path
        d="M18 13h22v7H18v-7z"
        stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round"
      />
      <circle cx="9"  cy="21.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="34" cy="21.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
    </svg>
  )
}

function IconCamion({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.55)} viewBox="0 0 54 30" fill="none">
      <path
        d="M2 22V9a2 2 0 012-2h12v15H2z"
        stroke={color} strokeWidth="2" fill="none" strokeLinejoin="round"
      />
      <path d="M4 10h8v8H4v-8z" stroke={color} strokeWidth="1.5" fill="none" />
      <rect x="16" y="4" width="35" height="18" rx="2" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="9"  cy="23.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="36" cy="23.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="44" cy="23.5" r="3.5" stroke={color} strokeWidth="2" fill="none" />
      <path d="M16 15h35" stroke={color} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.4" />
    </svg>
  )
}

// ─── Config ──────────────────────────────────────────────────────────────────

const VEHICLE_CONFIG: Record<VehicleType, {
  label: string
  description: string
  Icon: (p: { color: string; size: number }) => React.ReactElement
}> = {
  moto:      { label: 'Moto',      description: 'Bultos pequeños',  Icon: IconMoto      },
  camioneta: { label: 'Camioneta', description: 'Carga mediana',    Icon: IconCamioneta },
  pickup:    { label: 'Pickup',    description: 'Carga variada',    Icon: IconPickup    },
  camion:    { label: 'Camión',    description: 'Carga pesada',     Icon: IconCamion    },
}

const VEHICLE_ORDER: VehicleType[] = ['moto', 'camioneta', 'pickup', 'camion']

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textMuted,
      textTransform: 'uppercase', letterSpacing: '0.12em',
    }}>
      {children}
    </span>
  )
}

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'none', border: 'none', cursor: 'pointer',
        color: Z.orange, fontFamily: Z.font, fontSize: 13, fontWeight: 600,
        padding: '4px 8px', borderRadius: 8,
      }}
    >
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <path
          d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
          stroke={Z.orange} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      Editar
    </button>
  )
}

function SaveCancelRow({ onSave, onCancel, saving }: { onSave: () => void; onCancel: () => void; saving: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button
        onClick={onCancel}
        style={{
          flex: 1, padding: '11px 0', borderRadius: 10,
          border: `1px solid ${Z.border}`, background: Z.surface,
          fontFamily: Z.font, fontSize: 14, color: Z.textSec, cursor: 'pointer',
        }}
      >
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          flex: 1, padding: '11px 0', borderRadius: 10,
          border: 'none', background: Z.orangeDark,
          fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: '#fff',
          cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: Z.border, margin: '4px 0' }} />
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PerfilRepartidor() {
  const user = useAuthStore((s) => s.user)
  const { data: driverProfile, isLoading: loadingVehicle } = useDriverProfile()
  const { mutateAsync: saveVehicle } = useSaveVehicleType()
  const { toasts, showToast, removeToast } = useToast()

  const displayName = user?.name ?? '—'
  const city = user?.city ?? '—'

  const [bio, setBio]     = useState('')
  const [plate, setPlate] = useState('')
  const [dataReady, setDataReady] = useState(false)

  const [editBio, setEditBio]     = useState<string | null>(null)
  const [editPlate, setEditPlate] = useState<string | null>(null)
  const [editingVehicle, setEditingVehicle] = useState(false)
  const [pendingVehicle, setPendingVehicle] = useState<VehicleType | null>(null)

  const [savingBio,     setSavingBio]     = useState(false)
  const [savingPlate,   setSavingPlate]   = useState(false)
  const [savingVehicle, setSavingVehicle] = useState(false)

  useEffect(() => {
    if (!user?.user_id) return
    const uid = user.user_id
    Promise.all([
      supabase.from('profiles').select('bio').eq('user_id', uid).maybeSingle(),
      supabase.from('user_roles').select('vehicle_plate').eq('user_id', uid).eq('role', 'chofer').maybeSingle(),
    ]).then(([profileRes, roleRes]) => {
      setBio((profileRes.data as { bio?: string | null } | null)?.bio ?? '')
      setPlate((roleRes.data as { vehicle_plate?: string | null } | null)?.vehicle_plate ?? '')
      setDataReady(true)
    })
  }, [user?.user_id])

  async function handleSaveBio() {
    if (!user?.user_id || editBio === null) return
    setSavingBio(true)
    const { error } = await supabase.from('profiles').update({ bio: editBio }).eq('user_id', user.user_id)
    setSavingBio(false)
    if (error) { showToast('No se pudo guardar', 'error'); return }
    setBio(editBio)
    setEditBio(null)
    showToast('Descripción guardada', 'success')
  }

  async function handleSavePlate() {
    if (!user?.user_id || editPlate === null) return
    setSavingPlate(true)
    const { error } = await supabase
      .from('user_roles')
      .update({ vehicle_plate: editPlate.toUpperCase() })
      .eq('user_id', user.user_id)
      .eq('role', 'chofer')
    setSavingPlate(false)
    if (error) { showToast('No se pudo guardar', 'error'); return }
    setPlate(editPlate.toUpperCase())
    setEditPlate(null)
    showToast('Placa guardada', 'success')
  }

  async function handleSaveVehicle() {
    if (!pendingVehicle) return
    setSavingVehicle(true)
    try {
      await saveVehicle(pendingVehicle)
      setEditingVehicle(false)
      setPendingVehicle(null)
      showToast('Vehículo actualizado', 'success')
    } catch {
      showToast('No se pudo guardar', 'error')
    } finally {
      setSavingVehicle(false)
    }
  }

  const currentVehicle = driverProfile?.vehicle_type ?? null
  const vehicleConfig  = currentVehicle ? VEHICLE_CONFIG[currentVehicle] : null

  const card: React.CSSProperties = {
    background: Z.surface,
    border: `1px solid ${Z.border}`,
    borderRadius: Z.r.md,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    borderRadius: 10, border: `1.5px solid ${Z.border}`,
    background: Z.bg, padding: '11px 14px',
    fontFamily: Z.font, fontSize: 15, color: Z.text, outline: 'none',
  }

  if (!dataReady && loadingVehicle) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 20px' }}>
        {[140, 100, 180].map((h, i) => (
          <div key={i} style={{ height: h, borderRadius: Z.r.md, background: Z.border, opacity: 0.5 }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ paddingBottom: 24 }}>
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={{
        padding: '28px 20px 20px',
        background: Z.orangeLight,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        <ZAvatar name={displayName} size={80} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>
            {displayName}
          </h2>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>
            Transportista · {city}
          </p>
        </div>

        {/* Stats pill */}
        <div style={{
          display: 'flex', gap: 0,
          borderRadius: Z.r.full, overflow: 'hidden',
          background: Z.surface, border: `1px solid ${Z.border}`,
        }}>
          <div style={{ textAlign: 'center', padding: '10px 24px' }}>
            <div style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text }}>4.9</div>
            <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, fontWeight: 500 }}>calificación</div>
          </div>
          <div style={{ width: 1, background: Z.border }} />
          <div style={{ textAlign: 'center', padding: '10px 24px' }}>
            <div style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text }}>247</div>
            <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, fontWeight: 500 }}>viajes</div>
          </div>
        </div>
      </div>

      {/* ── Sections ───────────────────────────────────────── */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Sobre mí */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SectionLabel>Sobre mí</SectionLabel>
            {editBio === null && <EditBtn onClick={() => setEditBio(bio)} />}
          </div>
          {editBio !== null ? (
            <>
              <textarea
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="Cuéntanos tu experiencia como transportista…"
                rows={3}
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.55 }}
              />
              <SaveCancelRow
                onSave={handleSaveBio}
                onCancel={() => setEditBio(null)}
                saving={savingBio}
              />
            </>
          ) : (
            <p style={{ fontFamily: Z.font, fontSize: 14, color: bio ? Z.textSec : Z.textMuted, margin: 0, lineHeight: 1.55 }}>
              {bio || 'Agrega una descripción de tu experiencia y servicios.'}
            </p>
          )}
        </div>

        {/* Mi Vehículo */}
        <div style={card}>
          <SectionLabel>Mi vehículo</SectionLabel>

          {/* Tipo de vehículo — current state */}
          {!editingVehicle && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, fontWeight: 500 }}>
                  Tipo de vehículo
                </span>
                <EditBtn onClick={() => { setEditingVehicle(true); setPendingVehicle(currentVehicle) }} />
              </div>

              {vehicleConfig && currentVehicle ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: Z.r.sm,
                  background: Z.orangeLight, border: `1.5px solid ${Z.orange}`,
                }}>
                  <vehicleConfig.Icon color={Z.orangeDark} size={42} />
                  <div>
                    <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>
                      {vehicleConfig.label}
                    </div>
                    <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>
                      {vehicleConfig.description}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '14px', borderRadius: Z.r.sm,
                  background: Z.bg, border: `1.5px dashed ${Z.border}`,
                  textAlign: 'center',
                }}>
                  <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, margin: 0 }}>
                    No has seleccionado un vehículo todavía
                  </p>
                  <button
                    onClick={() => { setEditingVehicle(true); setPendingVehicle(null) }}
                    style={{
                      marginTop: 10, padding: '10px 24px', borderRadius: 10,
                      border: 'none', background: Z.orangeDark,
                      fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Seleccionar vehículo
                  </button>
                </div>
              )}
            </>
          )}

          {/* Tipo de vehículo — editing mode */}
          {editingVehicle && (
            <>
              <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, fontWeight: 500 }}>
                Selecciona tu tipo de vehículo:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {VEHICLE_ORDER.map(vtype => {
                  const cfg     = VEHICLE_CONFIG[vtype]
                  const active  = pendingVehicle === vtype
                  return (
                    <button
                      key={vtype}
                      onClick={() => setPendingVehicle(vtype)}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '16px 8px', borderRadius: Z.r.sm,
                        border: `2px solid ${active ? Z.orangeDark : Z.border}`,
                        background: active ? Z.orangeLight : Z.bg,
                        cursor: 'pointer', transition: 'all 0.15s',
                        minHeight: 90,
                      }}
                    >
                      <cfg.Icon color={active ? Z.orangeDark : Z.textSec} size={44} />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontFamily: Z.font, fontSize: 14, fontWeight: 700,
                          color: active ? Z.orangeDark : Z.text,
                        }}>
                          {cfg.label}
                        </div>
                        <div style={{
                          fontFamily: Z.font, fontSize: 11,
                          color: active ? Z.orange : Z.textMuted, marginTop: 2,
                        }}>
                          {cfg.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
              <SaveCancelRow
                onSave={handleSaveVehicle}
                onCancel={() => { setEditingVehicle(false); setPendingVehicle(null) }}
                saving={savingVehicle}
              />
            </>
          )}

          <Divider />

          {/* Placa */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, fontWeight: 500 }}>
              Placa del vehículo
            </span>
            {editPlate === null && <EditBtn onClick={() => setEditPlate(plate)} />}
          </div>
          {editPlate !== null ? (
            <>
              <input
                value={editPlate}
                onChange={e => setEditPlate(e.target.value.toUpperCase())}
                placeholder="Ej. 1234-ABC"
                maxLength={10}
                style={{ ...inputStyle, letterSpacing: 3, fontWeight: 700, fontSize: 16 }}
              />
              <SaveCancelRow
                onSave={handleSavePlate}
                onCancel={() => setEditPlate(null)}
                saving={savingPlate}
              />
            </>
          ) : (
            <span style={{
              fontFamily: Z.font, fontSize: 18, fontWeight: 800,
              color: plate ? Z.text : Z.textMuted, letterSpacing: 2,
            }}>
              {plate || 'Sin registrar'}
            </span>
          )}
        </div>

        {/* Capacidad de carga (read-only, derived from vehicle) */}
        {currentVehicle && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: Z.r.sm,
            background: Z.blueLight, border: `1px solid ${Z.border}`,
          }}>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.blueDark }}>
                Capacidad de carga
              </div>
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>
                Se determina por el tipo de vehículo
              </div>
            </div>
            <span style={{
              fontFamily: Z.font, fontSize: 13, fontWeight: 700,
              padding: '6px 14px', borderRadius: 20,
              background: Z.surface, color: Z.blueDark,
              border: `1px solid ${Z.border}`,
            }}>
              {VEHICLE_CONFIG[currentVehicle].description}
            </span>
          </div>
        )}

      </div>
    </div>
  )
}
