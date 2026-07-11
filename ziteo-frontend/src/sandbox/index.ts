import { __setGeoService } from '@/shared/geo'
import { mockGeoProvider } from './geo/mockGeoProvider'

/** Punto de entrada único del sandbox. Solo se importa cuando SIMULATION=true (ver src/main.tsx). */
export function installSandbox(): void {
  __setGeoService(mockGeoProvider)
  // eslint-disable-next-line no-console
  console.info('[SANDBOX] Modo simulación activo — GeoService mock, mapas simulados, pago ficticio.')
}
