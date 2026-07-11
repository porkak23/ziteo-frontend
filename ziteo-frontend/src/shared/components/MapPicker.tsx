/// <reference types="@types/google.maps" />
import { useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { Z } from '@/shared/design/tokens'
import { hasMapsKey, loadMapsLibrary } from '@/shared/lib/mapsLoader'
import { getGeoService } from '@/shared/geo'
import { SIMULATION } from '@/shared/config/simulation'
import { AddressInput } from '@/shared/components/AddressInput'
import { captureException } from '@/lib/sentryClient'
import { useToast } from '@/shared/hooks/useToast'
import { Toast } from '@/shared/components/Toast'

const MockMapPicker = SIMULATION
  ? lazy(() => import('@/sandbox/components/MockMapPicker').then((m) => ({ default: m.MockMapPicker })))
  : null

export interface MapPickerValue {
  lat: number
  lng: number
  address: string
}

interface MapPickerProps {
  value?: MapPickerValue | null
  onChange: (value: MapPickerValue) => void
  placeholder?: string
  height?: number
  label?: string
}

// Bolivia center coordinates
const BOLIVIA_CENTER = { lat: -16.5, lng: -64.5 }
const BOLIVIA_ZOOM = 6
const PLACED_ZOOM = 15

export function MapPicker({ value, onChange, placeholder, height = 280, label }: MapPickerProps) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const mountedRef = useRef(true)
  const { toasts, showToast, removeToast } = useToast()

  const handleLocationResult = useCallback(
    async (lat: number, lng: number) => {
      if (!mapRef.current || !markerRef.current) return
      const pos = { lat, lng }
      mapRef.current.panTo(pos)
      mapRef.current.setZoom(PLACED_ZOOM)
      markerRef.current.setPosition(pos)
      let address: string
      try {
        address = await getGeoService().reverseGeocode(lat, lng)
      } catch (err) {
        captureException(err, { context: 'MapPicker.reverseGeocode' })
        address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      }
      if (mountedRef.current) {
        onChange({ lat, lng, address })
      }
    },
    [onChange]
  )

  const handleGps = useCallback(() => {
    if (!navigator.geolocation || !hasMapsKey) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        handleLocationResult(coords.latitude, coords.longitude)
      },
      undefined,
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [handleLocationResult])

  useEffect(() => {
    mountedRef.current = true
    if (!hasMapsKey || !mapDivRef.current) return

    loadMapsLibrary('maps').then((mapsLib) => {
      if (!mountedRef.current || !mapDivRef.current || !mapsLib) return

      const center = value ? { lat: value.lat, lng: value.lng } : BOLIVIA_CENTER
      const zoom = value ? PLACED_ZOOM : BOLIVIA_ZOOM

      const map = new mapsLib.Map(mapDivRef.current, {
        center,
        zoom,
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

      const marker = new google.maps.Marker({
        map,
        position: value ? { lat: value.lat, lng: value.lng } : undefined,
        draggable: true,
        title: 'Ubicacion seleccionada',
      })
      markerRef.current = marker

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        handleLocationResult(e.latLng.lat(), e.latLng.lng())
      })

      marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return
        handleLocationResult(e.latLng.lat(), e.latLng.lng())
      })
    }).catch((err) => {
      captureException(err, { context: 'MapPicker.loadMapsLibrary' })
      if (mountedRef.current) {
        showToast('No pudimos cargar el mapa, ingresa la dirección manualmente', 'error')
      }
    })

    return () => {
      mountedRef.current = false
      if (markerRef.current) {
        google.maps.event.clearInstanceListeners(markerRef.current)
        markerRef.current.setMap(null)
        markerRef.current = null
      }
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current)
        mapRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker when value changes externally (without reinitializing the map)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !value) return
    const pos = { lat: value.lat, lng: value.lng }
    markerRef.current.setPosition(pos)
  }, [value?.lat, value?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Sandbox: mock map picker with fixed test coordinates ---
  if (MockMapPicker && getGeoService().kind === 'mock') {
    return (
      <Suspense fallback={null}>
        <MockMapPicker value={value} onChange={onChange} label={label} height={height} />
      </Suspense>
    )
  }

  // --- Fallback: no API key ---
  if (!hasMapsKey) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {label && (
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: Z.textSec,
              fontFamily: Z.font,
            }}
          >
            {label}
          </label>
        )}
        <AddressInput
          value={value?.address ?? ''}
          onChange={(address) => onChange({ lat: 0, lng: 0, address })}
          placeholder={placeholder ?? 'Ingresa una direccion'}
          inputStyle={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: Z.r.md,
            border: `1px solid ${Z.border}`,
            background: Z.surface,
            color: Z.text,
            fontSize: 14,
            fontFamily: Z.font,
            boxSizing: 'border-box',
          }}
        />
        <p
          style={{
            fontSize: 12,
            color: Z.textMuted,
            fontFamily: Z.font,
            margin: 0,
          }}
        >
          Seleccion por mapa disponible cuando se configure la API key
        </p>
      </div>
    )
  }

  // --- With Google Maps ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Toast toasts={toasts} onRemove={removeToast} />
      {label && (
        <label
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: Z.textSec,
            fontFamily: Z.font,
          }}
        >
          {label}
        </label>
      )}

      {/* Map container */}
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

        {/* GPS button — absolute in top-right corner of map */}
        <button
          type="button"
          onClick={handleGps}
          title="Usar mi ubicacion actual"
          aria-label="Usar mi ubicacion actual"
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: Z.r.sm,
            background: Z.surface,
            border: `1px solid ${Z.border}`,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            padding: 0,
          }}
        >
          {/* MapPin icon — lucide-style SVG inline */}
          <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            style={{ flexShrink: 0 }}
          >
            <path
              d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
              stroke={Z.orange}
              strokeWidth="1.8"
              fill="none"
            />
            <circle cx="12" cy="10" r="3" stroke={Z.orange} strokeWidth="1.8" fill="none" />
          </svg>
        </button>
      </div>

      {/* Address field below map */}
      <AddressInput
        value={value?.address ?? ''}
        onChange={(address) => {
          // When user types directly, preserve existing coords but update address
          onChange({ lat: value?.lat ?? 0, lng: value?.lng ?? 0, address })
        }}
        placeholder={placeholder ?? 'Haz clic en el mapa o ingresa una direccion'}
        inputStyle={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: Z.r.md,
          border: `1px solid ${Z.border}`,
          background: Z.surface,
          color: Z.text,
          fontSize: 14,
          fontFamily: Z.font,
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
