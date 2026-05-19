/**
 * geography.ts — Fuente canónica de ciudades activas en Ziteo.
 *
 * Regla: NUNCA hardcodear ciudades inline en el código.
 * Siempre importar CIUDADES_ACTIVAS desde este archivo.
 *
 * Ciudades desactivadas están comentadas — se habilitan al expandir a nuevas plazas.
 */

export const CIUDADES_ACTIVAS = ['Sucre', 'Potosí', 'Santa Cruz'] as const
export type CiudadActiva = typeof CIUDADES_ACTIVAS[number]

// Lista completa de capitales de Bolivia — solo las activas están descomentadas.
// Las desactivadas NO deben aparecer en selectores de la UI.
export const CIUDADES_BOLIVIA_COMPLETAS = [
  'Sucre',
  'Potosí',
  'Santa Cruz',
  // Desactivadas — no mostrar en selectores hasta expansión futura:
  // 'La Paz',
  // 'Cochabamba',
  // 'Oruro',
  // 'Trinidad',
  // 'Cobija',
  // 'Tarija',
] as const

/**
 * Valida si una ciudad pertenece a las ciudades activas de Ziteo.
 * Usar en validaciones de formularios y guards de lógica de negocio.
 */
export function isCiudadActiva(city: string): city is CiudadActiva {
  return (CIUDADES_ACTIVAS as readonly string[]).includes(city)
}
