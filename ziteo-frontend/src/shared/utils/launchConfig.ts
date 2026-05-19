/**
 * Soft launch configuration — controla qué ciudades están disponibles para nuevos registros.
 *
 * Para activar la apertura completa a todas las ciudades:
 *   - Opción A (inmediata): mueve todas las ciudades de `waitlist` a `open`.
 *   - Opción B (por fecha): ajusta `fullOpenDate` a la fecha deseada; una vez alcanzada,
 *     todas las ciudades funcionan igual automáticamente.
 */
export const LAUNCH_CONFIG = {
  // Ciudades donde CUALQUIERA puede registrarse y operar sin restricciones
  open: ['Santa Cruz de la Sierra'] as const,

  // Ciudades en lista de espera — registro disponible pero acceso restringido hasta fullOpenDate
  waitlist: ['Sucre', 'Potosí'] as const,

  // Fecha de apertura completa (todas las ciudades activas abiertas)
  // Cambiar esta fecha o mover ciudades a `open` para activar el lanzamiento completo.
  fullOpenDate: '2026-06-02',
} as const

export type OpenCity = (typeof LAUNCH_CONFIG.open)[number]
export type WaitlistCity = (typeof LAUNCH_CONFIG.waitlist)[number]
export type ActiveCity = OpenCity | WaitlistCity

/**
 * Retorna true si la ciudad acepta nuevos registros sin restricciones.
 */
export function isCiudadOpen(city: string): boolean {
  if (isFullLaunch()) return true
  return (LAUNCH_CONFIG.open as readonly string[]).includes(city)
}

/**
 * Retorna true si la ciudad está en lista de espera (antes del lanzamiento completo).
 */
export function isCiudadWaitlist(city: string): boolean {
  if (isFullLaunch()) return false
  return (LAUNCH_CONFIG.waitlist as readonly string[]).includes(city)
}

/**
 * Retorna true si ya pasó la fecha de apertura completa.
 * Una vez true, todas las ciudades funcionan igual.
 */
export function isFullLaunch(): boolean {
  return new Date() >= new Date(LAUNCH_CONFIG.fullOpenDate)
}

/**
 * Retorna el estado de lanzamiento de una ciudad.
 *   'open'     → puede registrarse y operar normalmente
 *   'waitlist' → registro permitido pero acceso restringido hasta fullOpenDate
 *   'unknown'  → ciudad no reconocida (no debería ocurrir en flujo normal)
 */
export function getCiudadStatus(city: string): 'open' | 'waitlist' | 'unknown' {
  if (isCiudadOpen(city)) return 'open'
  if (isCiudadWaitlist(city)) return 'waitlist'
  return 'unknown'
}
