/** Coordenadas fijas de prueba en Santa Cruz — respetan profiles_city_check (Sucre/Potosí/Santa Cruz). */

export const STORE = {
  lat: -17.7776,
  lng: -63.19,
  address: '[SIM] Depósito Ferretería El Tornillo — Av. Cañoto, Santa Cruz',
}

export const SITE = {
  lat: -17.7833,
  lng: -63.1821,
  address: '[SIM] Obra Edificio Torres del Este — Plaza 24 de Septiembre, Santa Cruz',
}

export const DRIVER_START = {
  lat: -17.77,
  lng: -63.195,
}

export const SANDBOX_ADDRESSES = [STORE, SITE] as const

const JITTER_RANGE = 0.0005

/** Posición del chofer simulado con jitter aleatorio, para que el tracking "se mueva". */
export function driverPositionWithJitter(): { lat: number; lng: number } {
  return {
    lat: DRIVER_START.lat + (Math.random() - 0.5) * JITTER_RANGE,
    lng: DRIVER_START.lng + (Math.random() - 0.5) * JITTER_RANGE,
  }
}

/** Encuentra la dirección sintética más cercana a un punto dado (para reverse geocode mock). */
export function nearestSandboxAddress(lat: number, lng: number): string {
  let best: { address: string; dist: number } | null = null
  for (const point of SANDBOX_ADDRESSES) {
    const dist = Math.hypot(point.lat - lat, point.lng - lng)
    if (!best || dist < best.dist) best = { address: point.address, dist }
  }
  return best?.address ?? `[SIM] ${lat.toFixed(5)}, ${lng.toFixed(5)}`
}
