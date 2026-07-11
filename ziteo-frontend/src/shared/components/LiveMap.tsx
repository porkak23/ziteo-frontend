/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { Z } from '@/shared/design/tokens'
import { hasMapsKey, loadMapsLibrary } from '@/shared/lib/mapsLoader'
import { getGeoService } from '@/shared/geo'
import { SIMULATION } from '@/shared/config/simulation'

export interface DriverPosition {
  lat: number
  lng: number
  heading?: number
  updatedAt?: string
}

interface LiveMapProps {
  driverPosition: DriverPosition | null
  pickupLat?: number | null
  pickupLng?: number | null
  dropoffLat?: number | null
  dropoffLng?: number | null
  height?: number
}

// Bolivia center as fallback
const BOLIVIA_CENTER = { lat: -16.5, lng: -64.5 }
const BOLIVIA_ZOOM = 6

const MockLiveMap = SIMULATION
  ? lazy(() => import('@/sandbox/components/MockMap').then((m) => ({ default: m.MockLiveMap })))
  : null

// Material Design truck path (simplified, fits 0-24 viewport)
const TRUCK_SVG_PATH =
  'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'

function formatTimeSince(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const secs = Math.floor(diffMs / 1000)
  if (secs < 60) return `hace ${secs} seg`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `hace ${mins} min`
  return `hace ${Math.floor(mins / 60)} h`
}

function fitBounds(
  map: google.maps.Map,
  driverPosition: DriverPosition | null,
  pickupLat?: number | null,
  pickupLng?: number | null,
  dropoffLat?: number | null,
  dropoffLng?: number | null
) {
  const points: google.maps.LatLngLiteral[] = []

  if (driverPosition) points.push({ lat: driverPosition.lat, lng: driverPosition.lng })
  if (pickupLat != null && pickupLng != null) points.push({ lat: pickupLat, lng: pickupLng })
  if (dropoffLat != null && dropoffLng != null) points.push({ lat: dropoffLat, lng: dropoffLng })

  if (points.length === 0) return

  if (points.length === 1) {
    map.panTo(points[0])
    map.setZoom(14)
    return
  }

  const bounds = new google.maps.LatLngBounds()
  points.forEach((p) => bounds.extend(p))
  map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
}

export function LiveMap({
  driverPosition,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  height = 320,
}: LiveMapProps) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null)
  const dropoffMarkerRef = useRef<google.maps.Marker | null>(null)
  const mountedRef = useRef(true)

  const [timeSince, setTimeSince] = useState<string | null>(null)

  // Update "last updated" label every 5 seconds
  useEffect(() => {
    if (!driverPosition?.updatedAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTimeSince(null)
      return
    }
    const tick = () => setTimeSince(formatTimeSince(driverPosition.updatedAt!))
    tick()
    const id = setInterval(tick, 5000)
    return () => clearInterval(id)
  }, [driverPosition?.updatedAt])

  // Initialize map once
  useEffect(() => {
    mountedRef.current = true
    if (!hasMapsKey || !mapDivRef.current) return

    loadMapsLibrary('maps').then((mapsLib) => {
      if (!mountedRef.current || !mapDivRef.current || !mapsLib) return

      const initialCenter =
        dropoffLat != null && dropoffLng != null
          ? { lat: dropoffLat, lng: dropoffLng }
          : driverPosition
            ? { lat: driverPosition.lat, lng: driverPosition.lng }
            : BOLIVIA_CENTER

      const initialZoom = dropoffLat != null || driverPosition ? 14 : BOLIVIA_ZOOM

      const map = new mapsLib.Map(mapDivRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      })
      mapRef.current = map

      // Driver marker — truck icon in brand orange #E8733A
      const driverMarker = new google.maps.Marker({
        map,
        position: driverPosition ? { lat: driverPosition.lat, lng: driverPosition.lng } : undefined,
        visible: driverPosition != null,
        title: 'Conductor',
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
      driverMarkerRef.current = driverMarker

      // Pickup marker — green circle
      if (pickupLat != null && pickupLng != null) {
        const pickupMarker = new google.maps.Marker({
          map,
          position: { lat: pickupLat, lng: pickupLng },
          title: 'Punto de recogida',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#22C55E',
            fillOpacity: 1,
            strokeColor: '#15803D',
            strokeWeight: 2,
          },
          zIndex: 5,
        })
        pickupMarkerRef.current = pickupMarker
      }

      // Dropoff marker — brand dark orange arrow
      if (dropoffLat != null && dropoffLng != null) {
        const dropoffMarker = new google.maps.Marker({
          map,
          position: { lat: dropoffLat, lng: dropoffLng },
          title: 'Destino',
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: '#A43700',
            fillOpacity: 1,
            strokeColor: '#7A2900',
            strokeWeight: 1,
          },
          zIndex: 5,
        })
        dropoffMarkerRef.current = dropoffMarker
      }

      fitBounds(map, driverPosition, pickupLat, pickupLng, dropoffLat, dropoffLng)
    })

    return () => {
      mountedRef.current = false
      ;[driverMarkerRef, pickupMarkerRef, dropoffMarkerRef].forEach((ref) => {
        if (ref.current) {
          google.maps.event.clearInstanceListeners(ref.current)
          ref.current.setMap(null)
          ref.current = null
        }
      })
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current)
        mapRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update driver marker position reactively — no map reinitialization
  useEffect(() => {
    if (!driverMarkerRef.current || !mapRef.current) return

    if (!driverPosition) {
      driverMarkerRef.current.setVisible(false)
      return
    }

    driverMarkerRef.current.setPosition({ lat: driverPosition.lat, lng: driverPosition.lng })
    driverMarkerRef.current.setVisible(true)

    fitBounds(mapRef.current, driverPosition, pickupLat, pickupLng, dropoffLat, dropoffLng)
  }, [driverPosition, pickupLat, pickupLng, dropoffLat, dropoffLng])

  // --- Sandbox: mock live map with SVG rendering ---
  if (MockLiveMap && getGeoService().kind === 'mock') {
    return (
      <Suspense fallback={null}>
        <MockLiveMap
          driverPosition={driverPosition}
          pickupLat={pickupLat}
          pickupLng={pickupLng}
          dropoffLat={dropoffLat}
          dropoffLng={dropoffLng}
          height={height}
        />
      </Suspense>
    )
  }

  // --- Fallback: no API key ---
  if (!hasMapsKey) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          borderRadius: Z.r.md,
          border: `1px solid ${Z.border}`,
          background: Z.surface,
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        {/* Map outline icon — lucide-style inline SVG */}
        <svg
          width={40}
          height={40}
          viewBox="0 0 24 24"
          fill="none"
          style={{ opacity: 0.35, flexShrink: 0 }}
        >
          <polygon
            points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"
            stroke={Z.textMuted}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <line x1="8" y1="2" x2="8" y2="18" stroke={Z.textMuted} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16" y1="6" x2="16" y2="22" stroke={Z.textMuted} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: Z.textSec, fontFamily: Z.font }}>
            Seguimiento en vivo no disponible
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: Z.textMuted, fontFamily: Z.font }}>
            Disponible cuando se configure la API key de Google Maps
          </p>
          {dropoffLat != null && dropoffLng != null && (
            <p style={{ margin: '8px 0 0', fontSize: 13, color: Z.text, fontFamily: Z.font }}>
              Destino: {dropoffLat.toFixed(5)}, {dropoffLng.toFixed(5)}
            </p>
          )}
        </div>
      </div>
    )
  }

  // --- With Google Maps ---
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: Z.r.md,
        overflow: 'hidden',
        border: `1px solid ${Z.border}`,
        height,
        flexShrink: 0,
      }}
    >
      <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

      {/* Last updated badge */}
      {timeSince && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            zIndex: 10,
            background: Z.surface,
            border: `1px solid ${Z.border}`,
            borderRadius: Z.r.sm,
            padding: '4px 10px',
            fontSize: 12,
            color: Z.textSec,
            fontFamily: Z.font,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            pointerEvents: 'none',
          }}
        >
          Ultima actualizacion: {timeSince}
        </div>
      )}

      {/* No driver signal badge */}
      {!driverPosition && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: Z.surface,
            border: `1px solid ${Z.border}`,
            borderRadius: Z.r.sm,
            padding: '4px 12px',
            fontSize: 12,
            color: Z.textMuted,
            fontFamily: Z.font,
            boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          Esperando ubicacion del conductor...
        </div>
      )}
    </div>
  )
}
