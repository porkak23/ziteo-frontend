/// <reference types="@types/google.maps" />
import { useEffect, useRef, lazy, Suspense } from 'react'
import { Z } from '@/shared/design/tokens'
import { hasMapsKey, loadMapsLibrary } from '@/shared/lib/mapsLoader'
import { getGeoService } from '@/shared/geo'
import { SIMULATION } from '@/shared/config/simulation'
import type { UnifiedJob } from '../types/jobTypes'

interface GeoPos { lat: number; lng: number }

interface DriverPoolMapProps {
  driverPos: GeoPos | null
  jobs: UnifiedJob[]
  selectedJobId: string | null
  onSelectJob: (id: string) => void
  height?: number
}

const MockMapCanvas = SIMULATION
  ? lazy(() => import('@/sandbox/components/MockMap').then((m) => ({ default: m.MockMapCanvas })))
  : null

// Same brand-orange truck icon as LiveMap.tsx — kept in sync intentionally
// (both render "the driver" on a Google map; a shared constant would be a
// premature abstraction for one SVG path used twice).
const TRUCK_SVG_PATH =
  'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'

const BOLIVIA_CENTER = { lat: -16.5, lng: -64.5 }
const BOLIVIA_ZOOM = 6

/**
 * Radar map for the driver's pool screen — one pin per available job's
 * pickup point, plus the driver's own live position. Tapping a job pin
 * selects it in the JobFocusCard above (same poolIndex the "Ver siguiente"
 * button already drives). Real Google Maps only: the sandbox MockMapCanvas
 * has no click handling, so mock mode is visual-only (matches the sandbox's
 * existing scope — it proves the data reaches the map, not full interaction).
 */
export function DriverPoolMap({ driverPos, jobs, selectedJobId, onSelectJob, height = 220 }: DriverPoolMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const jobMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const mountedRef = useRef(true)
  const onSelectJobRef = useRef(onSelectJob)
  onSelectJobRef.current = onSelectJob

  // Initialize map once
  useEffect(() => {
    mountedRef.current = true
    const jobMarkers = jobMarkersRef.current
    if (!hasMapsKey || !mapDivRef.current) return

    loadMapsLibrary('maps').then((mapsLib) => {
      if (!mountedRef.current || !mapDivRef.current || !mapsLib) return

      const map = new mapsLib.Map(mapDivRef.current, {
        center: driverPos ?? BOLIVIA_CENTER,
        zoom: driverPos ? 13 : BOLIVIA_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      })
      mapRef.current = map

      driverMarkerRef.current = new google.maps.Marker({
        map,
        position: driverPos ?? undefined,
        visible: driverPos != null,
        title: 'Tu ubicación',
        icon: {
          path: TRUCK_SVG_PATH,
          fillColor: '#E8733A',
          fillOpacity: 1,
          strokeColor: '#A43700',
          strokeWeight: 1,
          scale: 1.1,
          anchor: new google.maps.Point(12, 12),
        },
        zIndex: 10,
      })
    })

    return () => {
      mountedRef.current = false
      driverMarkerRef.current?.setMap(null)
      driverMarkerRef.current = null
      jobMarkers.forEach((m) => m.setMap(null))
      jobMarkers.clear()
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current)
        mapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the driver marker in sync without reinitializing the map
  useEffect(() => {
    if (!driverMarkerRef.current) return
    if (!driverPos) {
      driverMarkerRef.current.setVisible(false)
      return
    }
    driverMarkerRef.current.setPosition(driverPos)
    driverMarkerRef.current.setVisible(true)
  }, [driverPos])

  // Rebuild job pins whenever the pool changes; fit bounds to driver + pins
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    jobMarkersRef.current.forEach((m) => m.setMap(null))
    jobMarkersRef.current.clear()

    const bounds = new google.maps.LatLngBounds()
    let hasPoint = false

    if (driverPos) {
      bounds.extend(driverPos)
      hasPoint = true
    }

    jobs.forEach((job) => {
      if (job.pickupLat == null || job.pickupLng == null) return
      const pos = { lat: job.pickupLat, lng: job.pickupLng }
      const isSelected = job.id === selectedJobId
      const marker = new google.maps.Marker({
        map,
        position: pos,
        title: job.feeLabel,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 11 : 8,
          fillColor: isSelected ? '#A43700' : '#22C55E',
          fillOpacity: 1,
          strokeColor: isSelected ? '#7A2900' : '#15803D',
          strokeWeight: 2,
        },
        zIndex: isSelected ? 10 : 5,
      })
      marker.addListener('click', () => onSelectJobRef.current(job.id))
      jobMarkersRef.current.set(job.id, marker)
      bounds.extend(pos)
      hasPoint = true
    })

    if (!hasPoint) return
    if (jobs.length === 0 && driverPos) {
      map.panTo(driverPos)
      map.setZoom(13)
    } else {
      map.fitBounds(bounds, { top: 32, right: 32, bottom: 32, left: 32 })
    }
  }, [jobs, selectedJobId, driverPos])

  // --- Sandbox: mock map, visual-only (no click-to-select) ---
  if (MockMapCanvas && getGeoService().kind === 'mock') {
    const markers = [
      ...(driverPos ? [{ point: driverPos, label: 'Tú', kind: 'driver' as const }] : []),
      ...jobs
        .filter((j) => j.pickupLat != null && j.pickupLng != null)
        .map((j) => ({
          point: { lat: j.pickupLat as number, lng: j.pickupLng as number },
          label: j.feeLabel,
          kind: 'site' as const,
        })),
    ]
    return (
      <Suspense fallback={null}>
        <MockMapCanvas markers={markers} height={height} />
      </Suspense>
    )
  }

  // --- Fallback: no API key configured ---
  if (!hasMapsKey) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '0 0 24px 24px',
        }}
      >
        <span className="material-symbols-outlined text-white/25 text-3xl" aria-hidden="true">map</span>
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: Z.font, textAlign: 'center' }}>
          Mapa no disponible — falta configurar la API de Google Maps
        </p>
      </div>
    )
  }

  return (
    <div ref={mapDivRef} style={{ width: '100%', height, borderRadius: '0 0 24px 24px', overflow: 'hidden' }} />
  )
}
