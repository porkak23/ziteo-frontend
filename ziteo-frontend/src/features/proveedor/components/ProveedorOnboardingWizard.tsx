/**
 * ProveedorOnboardingWizard — Wizard de primer login para Proveedores.
 *
 * Aparece cuando onboarding_complete = false en user_roles para el rol proveedor.
 * 3 pasos: Perfil del negocio, QR de pago, Primer producto.
 * Al completar o saltar todo: marca onboarding_complete = true.
 */
import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuthStore } from '../../auth/store/authStore'
import { CIUDADES_ACTIVAS } from '../../../shared/constants/geography'
import { CATEGORIAS_CONSTRUCCION } from '../hooks/useInventario'
import { Z } from '../../../shared/design/tokens'
import type { VehicleType } from '../../transportista/types/deliveryTypes'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WizardProps {
  onComplete: () => void
}

type WizardStep = 1 | 2 | 3 | 4

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function markOnboardingComplete(userId: string): Promise<void> {
  await supabase
    .from('user_roles')
    .update({ onboarding_complete: true, onboarding_completed: true })
    .eq('user_id', userId)
    .eq('role', 'proveedor')
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: WizardStep; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as WizardStep
        const isActive = step === current
        const isDone = step < current
        return (
          <div
            key={step}
            style={{
              width: isActive ? 24 : 8,
              height: 8,
              borderRadius: 4,
              background: isActive || isDone ? Z.orange : Z.divider,
              transition: 'all 0.2s',
            }}
          />
        )
      })}
    </div>
  )
}

// ─── Shared field primitives ─────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textSec, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  fontFamily: Z.font,
  fontSize: 15,
  fontWeight: 500,
  color: Z.text,
  padding: '13px 14px',
  borderRadius: Z.r.sm,
  border: `1.5px solid ${Z.border}`,
  background: Z.surface,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

// ─── Step 1: Perfil del negocio ──────────────────────────────────────────────

interface Step1Data {
  storeName: string
  description: string
  city: string
  phone: string
}

function Step1Perfil({
  initialPhone,
  initialCity,
  onNext,
}: {
  initialPhone: string
  initialCity: string | null
  onNext: (data: Step1Data) => void
}) {
  const [storeName, setStoreName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState(initialCity && (CIUDADES_ACTIVAS as readonly string[]).includes(initialCity) ? initialCity : '')
  const [phone, setPhone] = useState(initialPhone)
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  // Pre-rellenar nombre/descripción desde la BD si ya se habían guardado antes,
  // para que reabrir el wizard no muestre los campos vacíos.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    supabase
      .from('user_roles')
      .select('store_name, store_description')
      .eq('user_id', user.user_id)
      .eq('role', 'proveedor')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return
        if (data.store_name) setStoreName((prev) => prev || data.store_name!)
        if (data.store_description) setDescription((prev) => prev || data.store_description!)
      })
    return () => { cancelled = true }
  }, [user])

  const storeNameError = touched && storeName.trim().length < 2 ? 'Mínimo 2 caracteres' : null
  const cityError = touched && !city ? 'Selecciona una ciudad' : null
  const hasErrors = storeName.trim().length < 2 || !city

  async function handleNext() {
    setTouched(true)
    if (hasErrors) return
    setSaving(true)
    setSaveError(null)
    try {
      if (user) {
        const { error: roleErr } = await supabase
          .from('user_roles')
          .update({
            store_name: storeName.trim(),
            store_description: description.trim() || null,
          })
          .eq('user_id', user.user_id)
          .eq('role', 'proveedor')
        if (roleErr) throw roleErr

        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ city, phone: phone.trim() || undefined })
          .eq('user_id', user.user_id)
        if (profileErr) throw profileErr

        // Reflejar la ciudad nueva en el store para el resto de la app.
        if (city && city !== user.city) {
          setUser({ ...user, city })
        }
      }
      onNext({ storeName, description, city, phone })
    } catch {
      setSaveError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
          Completa tu negocio
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginTop: 4 }}>
          Los compradores verán esta informacion en tu tienda.
        </p>
      </div>

      <Field label="Nombre del negocio">
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Ej. Ferretería Central"
          style={{ ...inputStyle, borderColor: storeNameError ? Z.error : Z.border }}
        />
        {storeNameError && (
          <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{storeNameError}</span>
        )}
      </Field>

      <Field label="Descripcion breve">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 200))}
          placeholder="Ej. Materiales de construccion al por mayor y menor..."
          rows={3}
          style={{ ...inputStyle, resize: 'none' }}
        />
        <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, textAlign: 'right' }}>
          {description.length}/200
        </span>
      </Field>

      <Field label="Ciudad">
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onBlur={() => setTouched(true)}
          style={{
            ...inputStyle,
            appearance: 'none',
            cursor: 'pointer',
            color: city ? Z.text : Z.textMuted,
            borderColor: cityError ? Z.error : Z.border,
          }}
        >
          <option value="">Selecciona tu ciudad</option>
          {CIUDADES_ACTIVAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {cityError && (
          <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{cityError}</span>
        )}
      </Field>

      <Field label="Telefono de contacto">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej. 77712345"
          style={inputStyle}
        />
      </Field>

      {saveError && (
        <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{saveError}</span>
      )}

      <button
        onClick={handleNext}
        disabled={saving}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: saving ? 'default' : 'pointer',
          width: '100%',
          opacity: saving ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {saving ? 'Guardando...' : 'Continuar'}
      </button>
    </div>
  )
}

// ─── Step 2: QR de pago ───────────────────────────────────────────────────────

function Step2QR({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const user = useAuthStore((s) => s.user)
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // El bucket solo acepta JPG, PNG o WEBP — validamos antes para dar un mensaje claro.
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Formato no válido. Usa una imagen JPG, PNG o WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen no debe superar 5MB.')
      return
    }

    setError(null)
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      // Conservar la extensión real del archivo para que coincida con su tipo.
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const filePath = `${user.user_id}/qr.${ext}`
      // Eliminar archivo previo antes de subir para evitar conflictos de RLS con upsert.
      await supabase.storage.from('payment-qrs').remove([filePath])
      const { error: uploadErr } = await supabase.storage
        .from('payment-qrs')
        .upload(filePath, file, { upsert: false, contentType: file.type })
      if (uploadErr) throw uploadErr

      const { error: dbErr } = await supabase
        .from('user_roles')
        .update({ payment_qr_url: filePath })
        .eq('user_id', user.user_id)
        .eq('role', 'proveedor')
      if (dbErr) throw dbErr
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Intenta de nuevo.'
      setError(`No se pudo subir el QR: ${msg}`)
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
          Tu QR de pago
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginTop: 4 }}>
          Tus compradores necesitan tu QR para pagarte. Puedes subirlo ahora o mas tarde desde Ajustes.
        </p>
      </div>

      <div
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          borderRadius: Z.r.md,
          border: `2px dashed ${preview ? Z.orange : Z.border}`,
          background: preview ? Z.orangeLight : Z.surface,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          cursor: uploading ? 'default' : 'pointer',
          minHeight: 160,
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Vista previa del QR"
            style={{ maxWidth: 140, maxHeight: 140, objectFit: 'contain', borderRadius: Z.r.sm }}
          />
        ) : (
          <>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: Z.r.sm,
                background: Z.divider,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontFamily: Z.font, fontSize: 22, color: Z.textMuted }}>+</span>
            </div>
            <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, fontWeight: 600 }}>
              Toca para subir imagen del QR
            </span>
            <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>
              JPG, PNG o WEBP — max. 5 MB
            </span>
          </>
        )}
        {uploading && (
          <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.orange, fontWeight: 600 }}>
            Subiendo...
          </span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {error && (
        <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{error}</span>
      )}

      <button
        onClick={onNext}
        disabled={uploading || !preview}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: preview ? Z.gradOrange : Z.divider,
          color: preview ? '#fff' : Z.textMuted,
          border: 'none',
          cursor: uploading || !preview ? 'default' : 'pointer',
          width: '100%',
          transition: 'all 0.2s',
        }}
      >
        Continuar
      </button>

      <button
        onClick={onSkip}
        style={{
          fontFamily: Z.font,
          fontWeight: 600,
          fontSize: 14,
          padding: '12px 24px',
          borderRadius: Z.r.md,
          background: 'transparent',
          color: Z.textSec,
          border: `1.5px solid ${Z.border}`,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Saltar por ahora
      </button>
    </div>
  )
}

// ─── Step 3: Primer producto ──────────────────────────────────────────────────

function Step3Producto({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const user = useAuthStore((s) => s.user)
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [categoria, setCategoria] = useState('')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const precioNum = parseFloat(precio)
  const stockNum = parseInt(stock, 10)
  const nombreError = touched && nombre.trim().length < 2 ? 'Ingresa el nombre del producto' : null
  const precioError = touched && (isNaN(precioNum) || precioNum <= 0) ? 'Precio debe ser mayor a 0' : null
  const stockError = touched && (isNaN(stockNum) || stockNum < 0) ? 'Stock no puede ser negativo' : null
  const catError = touched && !categoria ? 'Selecciona una categoria' : null
  const hasErrors = nombre.trim().length < 2 || isNaN(precioNum) || precioNum <= 0 || isNaN(stockNum) || stockNum < 0 || !categoria

  async function handleAdd() {
    setTouched(true)
    if (hasErrors || !user) return
    setSaving(true)
    setError(null)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbErr } = await (supabase as any).from('products').insert({
        provider_id: user.user_id,
        name: nombre.trim(),
        price: precioNum,
        stock: stockNum,
        category_name: categoria,
        active: true,
      })
      if (dbErr) throw dbErr
      setSaved(true)
      setTimeout(onNext, 800)
    } catch {
      setError('No se pudo agregar el producto. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
          Agrega tu primer producto
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginTop: 4 }}>
          Agrega al menos un producto para que tus compradores puedan encontrarte.
        </p>
      </div>

      <Field label="Nombre del producto">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Ej. Cemento IP-30 50kg"
          style={{ ...inputStyle, borderColor: nombreError ? Z.error : Z.border }}
        />
        {nombreError && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{nombreError}</span>}
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Precio (Bs.)">
          <input
            type="number"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="0.00"
            min="0"
            step="0.01"
            style={{ ...inputStyle, borderColor: precioError ? Z.error : Z.border }}
          />
          {precioError && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{precioError}</span>}
        </Field>

        <Field label="Stock inicial">
          <input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="0"
            min="0"
            style={{ ...inputStyle, borderColor: stockError ? Z.error : Z.border }}
          />
          {stockError && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{stockError}</span>}
        </Field>
      </div>

      <Field label="Categoria">
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          onBlur={() => setTouched(true)}
          style={{
            ...inputStyle,
            appearance: 'none',
            cursor: 'pointer',
            color: categoria ? Z.text : Z.textMuted,
            borderColor: catError ? Z.error : Z.border,
          }}
        >
          <option value="">Selecciona una categoria</option>
          {CATEGORIAS_CONSTRUCCION.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        {catError && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{catError}</span>}
      </Field>

      {error && (
        <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{error}</span>
      )}

      {saved && (
        <div style={{ padding: '12px 16px', borderRadius: Z.r.sm, background: Z.orangeLight }}>
          <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.orangeDark, fontWeight: 600 }}>
            Producto agregado correctamente.
          </span>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={saving || saved}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: Z.gradOrange,
          color: '#fff',
          border: 'none',
          cursor: saving || saved ? 'default' : 'pointer',
          width: '100%',
          opacity: saving || saved ? 0.7 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {saving ? 'Guardando...' : 'Agregar producto'}
      </button>

      <button
        onClick={onSkip}
        style={{
          fontFamily: Z.font,
          fontWeight: 600,
          fontSize: 14,
          padding: '12px 24px',
          borderRadius: Z.r.md,
          background: 'transparent',
          color: Z.textSec,
          border: `1.5px solid ${Z.border}`,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        Saltar por ahora
      </button>
    </div>
  )
}

// ─── Step 4: Vehículo de reparto ──────────────────────────────────────────────

const VEHICLE_LABELS: Record<VehicleType, { label: string; capacity: string }> = {
  moto:      { label: 'Moto',      capacity: 'Carga ligera' },
  camioneta: { label: 'Camioneta', capacity: 'Carga media' },
  pickup:    { label: 'Pickup',    capacity: 'Carga media' },
  camion:    { label: 'Camión',    capacity: 'Carga pesada' },
}
const VEHICLE_ORDER: VehicleType[] = ['moto', 'camioneta', 'pickup', 'camion']

function Step4Vehicle({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  const user = useAuthStore((s) => s.user)
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null)
  const [plate, setPlate] = useState('')
  const [driverName, setDriverName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!user || !vehicleType) return
    setSaving(true)
    setError(null)
    try {
      const { error: dbErr } = await supabase
        .from('user_roles')
        .update({
          vehicle_type: vehicleType,
          vehicle_plate: plate.trim() || null,
          fleet_driver_name: driverName.trim() || null,
        })
        .eq('user_id', user.user_id)
        .eq('role', 'proveedor')
      if (dbErr) throw dbErr
      onNext()
    } catch {
      setError('No se pudo guardar el vehículo. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>
          ¿Tienes vehículo de reparto?
        </h2>
        <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginTop: 4 }}>
          Si tienes vehículo propio, la app te ofrece entregar tus pedidos directamente sin pasar por el pool de choferes de Ziteoo.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {VEHICLE_ORDER.map((vt) => (
          <button
            key={vt}
            onClick={() => setVehicleType(vt)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px',
              borderRadius: Z.r.sm, border: `1.5px solid ${vehicleType === vt ? Z.orange : Z.border}`,
              background: vehicleType === vt ? Z.orangeLight : Z.surface,
              cursor: 'pointer', outline: 'none', textAlign: 'left', width: '100%',
            }}
          >
            <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>
              {VEHICLE_LABELS[vt].label}
            </span>
            <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec }}>
              {VEHICLE_LABELS[vt].capacity}
            </span>
          </button>
        ))}
      </div>

      {vehicleType && (
        <>
          <Field label="Placa">
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="Ej. 1234-ABC"
              style={inputStyle}
            />
          </Field>
          <Field label="Conductor habitual">
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Nombre de quien maneja"
              style={inputStyle}
            />
          </Field>
        </>
      )}

      {error && (
        <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error }}>{error}</span>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !vehicleType}
        style={{
          fontFamily: Z.font,
          fontWeight: 700,
          fontSize: 15,
          padding: '15px 24px',
          borderRadius: Z.r.md,
          background: vehicleType ? Z.gradOrange : Z.divider,
          color: vehicleType ? '#fff' : Z.textMuted,
          border: 'none',
          cursor: saving || !vehicleType ? 'default' : 'pointer',
          width: '100%',
          opacity: saving ? 0.7 : 1,
          transition: 'all 0.2s',
        }}
      >
        {saving ? 'Guardando...' : 'Continuar'}
      </button>

      <button
        onClick={onSkip}
        style={{
          fontFamily: Z.font,
          fontWeight: 600,
          fontSize: 14,
          padding: '12px 24px',
          borderRadius: Z.r.md,
          background: 'transparent',
          color: Z.textSec,
          border: `1.5px solid ${Z.border}`,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        No tengo vehículo propio
      </button>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export function ProveedorOnboardingWizard({ onComplete }: WizardProps) {
  const user = useAuthStore((s) => s.user)
  const [step, setStep] = useState<WizardStep>(1)

  async function finish() {
    if (user) {
      await markOnboardingComplete(user.user_id)
    }
    onComplete()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: Z.bg,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '48px 24px 16px',
          background: `linear-gradient(180deg, ${Z.orangeLight} 0%, ${Z.bg} 100%)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <p style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Paso {step} de 4
          </p>
          <button
            onClick={finish}
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              fontWeight: 700,
              color: Z.textSec,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 6px',
              margin: '-4px -6px',
            }}
          >
            Saltar
          </button>
        </div>
        <StepDots current={step} total={4} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 32px' }}>
        {step === 1 && (
          <Step1Perfil
            initialPhone={user?.phone ?? ''}
            initialCity={user?.city ?? null}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2QR
            onNext={() => setStep(3)}
            onSkip={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3Producto
            onNext={() => setStep(4)}
            onSkip={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step4Vehicle
            onNext={finish}
            onSkip={finish}
          />
        )}
      </div>
    </div>
  )
}
