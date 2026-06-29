import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../../lib/supabaseClient'

// ─── Types ───────────────────────────────────────────────────────────────────

type ServiceStatus = 'checking' | 'operational' | 'degraded' | 'unavailable'

interface ServiceCheck {
  name: string
  status: ServiceStatus
  latencyMs: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusLabel(status: ServiceStatus): string {
  switch (status) {
    case 'checking':     return 'Verificando...'
    case 'operational':  return 'Operacional'
    case 'degraded':     return 'Degradado'
    case 'unavailable':  return 'No disponible'
  }
}

function statusColorClass(status: ServiceStatus): string {
  switch (status) {
    case 'checking':     return 'text-on-surface-variant'
    case 'operational':  return 'text-primary'
    case 'degraded':     return 'text-warning'
    case 'unavailable':  return 'text-error'
  }
}

function statusDotClass(status: ServiceStatus): string {
  switch (status) {
    case 'checking':     return 'bg-on-surface-variant animate-pulse'
    case 'operational':  return 'bg-primary'
    case 'degraded':     return 'bg-warning'
    case 'unavailable':  return 'bg-error'
  }
}

// ─── Individual service checks ────────────────────────────────────────────────

async function checkDatabaseSimple(): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const start = Date.now()
  try {
    // Consulta mínima para verificar conectividad con la BD
    const { error } = await supabase.from('profiles').select('user_id').limit(1)
    const latencyMs = Date.now() - start
    if (error) {
      // RLS puede bloquear, pero si el error es de permisos la BD responde
      const isRlsOrAuth = error.code === 'PGRST301' || error.message.includes('permission') || error.message.includes('RLS')
      return { status: isRlsOrAuth ? 'operational' : 'degraded', latencyMs }
    }
    return { status: 'operational', latencyMs }
  } catch {
    const latencyMs = Date.now() - start
    return { status: 'unavailable', latencyMs }
  }
}

async function checkAuth(): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const start = Date.now()
  try {
    const { error } = await supabase.auth.getSession()
    const latencyMs = Date.now() - start
    return { status: error ? 'degraded' : 'operational', latencyMs }
  } catch {
    const latencyMs = Date.now() - start
    return { status: 'unavailable', latencyMs }
  }
}

async function checkStorage(): Promise<{ status: ServiceStatus; latencyMs: number }> {
  const start = Date.now()
  try {
    const { error } = await supabase.storage.listBuckets()
    const latencyMs = Date.now() - start
    if (!error) return { status: 'operational', latencyMs }
    // 403/401 significa que el servicio está activo pero el usuario no tiene permisos
    const isAuthError = error.message.includes('403') || error.message.includes('401')
      || error.message.toLowerCase().includes('unauthorized')
      || error.message.toLowerCase().includes('forbidden')
    return { status: isAuthError ? 'operational' : 'degraded', latencyMs }
  } catch {
    const latencyMs = Date.now() - start
    return { status: 'unavailable', latencyMs }
  }
}

// ─── StatusPage ───────────────────────────────────────────────────────────────

export function StatusPage() {
  const [checks, setChecks] = useState<ServiceCheck[]>([
    { name: 'Base de datos',   status: 'checking', latencyMs: null },
    { name: 'Autenticacion',   status: 'checking', latencyMs: null },
    { name: 'Almacenamiento',  status: 'checking', latencyMs: null },
  ])
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [now, setNow] = useState(new Date())

  // Actualizar reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const runChecks = useCallback(async () => {
    setIsVerifying(true)
    setChecks([
      { name: 'Base de datos',   status: 'checking', latencyMs: null },
      { name: 'Autenticacion',   status: 'checking', latencyMs: null },
      { name: 'Almacenamiento',  status: 'checking', latencyMs: null },
    ])

    const [dbResult, authResult, storageResult] = await Promise.all([
      checkDatabaseSimple(),
      checkAuth(),
      checkStorage(),
    ])

    setChecks([
      { name: 'Base de datos',   ...dbResult      },
      { name: 'Autenticacion',   ...authResult    },
      { name: 'Almacenamiento',  ...storageResult },
    ])
    setLastChecked(new Date())
    setIsVerifying(false)
  }, [])

  // Ejecutar verificación inicial
  useEffect(() => {
    const t = setTimeout(() => { runChecks().catch(() => {/* handled inside runChecks */}) }, 0)
    return () => clearTimeout(t)
  }, [runChecks])

  const overallOk = checks.every(c => c.status === 'operational')
  const hasIssues = checks.some(c => c.status === 'unavailable' || c.status === 'degraded')
  const allChecking = checks.every(c => c.status === 'checking')

  const overallLabel = allChecking
    ? 'Verificando servicios...'
    : overallOk
      ? 'Todos los servicios operan con normalidad'
      : hasIssues
        ? 'Algunos servicios presentan problemas'
        : 'Verificando...'

  const overallBannerClass = allChecking
    ? 'bg-surface-container text-on-surface-variant'
    : overallOk
      ? 'bg-primary-container text-on-primary-container'
      : 'bg-error-container text-on-error-container'

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md flex flex-col gap-8">

        {/* Cabecera */}
        <div className="flex flex-col gap-1">
          <h1 className="font-headline font-bold text-2xl text-on-surface">
            Estado del servicio
          </h1>
          <p className="font-body text-sm text-on-surface-variant">Ziteoo</p>
        </div>

        {/* Hora actual */}
        <div className="flex flex-col gap-0.5">
          <span className="font-label text-xs text-on-surface-variant uppercase tracking-wide">
            Hora del sistema
          </span>
          <span className="font-headline font-semibold text-lg text-on-surface tabular-nums">
            {now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="font-body text-sm text-on-surface-variant">
            {now.toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {/* Estado general */}
        <div className={`rounded-2xl px-4 py-3 font-label font-semibold text-sm ${overallBannerClass}`}>
          {overallLabel}
        </div>

        {/* Indicadores de servicio */}
        <div className="flex flex-col gap-3">
          <span className="font-label text-xs text-on-surface-variant uppercase tracking-wide">
            Servicios
          </span>

          {checks.map((check) => (
            <div
              key={check.name}
              className="bg-surface border border-outline-variant rounded-2xl px-4 py-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDotClass(check.status)}`}
                />
                <span className="font-body text-sm text-on-surface">{check.name}</span>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <span className={`font-label text-sm font-semibold ${statusColorClass(check.status)}`}>
                  {statusLabel(check.status)}
                </span>
                {check.latencyMs !== null && (
                  <span className="font-body text-xs text-on-surface-variant">
                    {check.latencyMs} ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Ultima verificacion y boton */}
        <div className="flex flex-col gap-3">
          {lastChecked && (
            <p className="font-body text-xs text-on-surface-variant text-center">
              Ultima verificacion: {lastChecked.toLocaleTimeString('es-BO')}
            </p>
          )}

          <button
            onClick={() => void runChecks()}
            disabled={isVerifying}
            className="w-full bg-primary text-on-primary rounded-2xl py-3 font-label font-semibold text-sm transition-opacity active:opacity-70 disabled:opacity-50"
          >
            {isVerifying ? 'Verificando...' : 'Verificar ahora'}
          </button>
        </div>

        {/* Pie */}
        <p className="font-body text-xs text-on-surface-variant text-center">
          Para reportar incidentes, escriba a soporte@ziteo.bo
        </p>
      </div>
    </div>
  )
}
