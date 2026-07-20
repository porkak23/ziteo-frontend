/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from 'react'
import { Z } from '@/shared/design/tokens'
import { hasMapsKey, loadMapsLibrary } from '@/shared/lib/mapsLoader'
import { useAdminDriversOnline } from '@/features/admin/hooks/useAdminDriversOnline'
import type { AdminDriverOnline } from '@/features/admin/hooks/useAdminDriversOnline'
import { useAdminActiveDeliveries } from '@/features/admin/hooks/useAdminActiveDeliveries'
import type { AdminActiveDelivery, DeliveryStatus } from '@/features/admin/hooks/useAdminActiveDeliveries'
import { useRouteHistory } from '@/features/admin/hooks/useRouteHistory'
import { DriverDetailSheet } from './DriverDetailSheet'

const BOLIVIA_CENTER = { lat: -17.3, lng: -63.5 }
const BOLIVIA_ZOOM = 7

const STATUS_COLOR: Record<DeliveryStatus, string> = {
  pending: '#94A3B8',
  accepted: '#3B82F6',
  in_transit: '#E8733A',
  delivered: '#22C55E',
  failed: '#EF4444',
}

const SILENT_THRESHOLD_MS = 5 * 60 * 1000

function isSilent(driver: AdminDriverOnline): boolean {
  return Date.now() - new Date(driver.updated_at).getTime() > SILENT_THRESHOLD_MS
}

function findDeliveryForDriver(
  driverId: string,
  deliveries: AdminActiveDelivery[]
): AdminActiveDelivery | undefined {
  return deliveries.find((d) => d.driver_id === driverId)
}

export function LiveMapScreen() {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const mountedRef = useRef(true)
  const [mapReady, setMapReady] = useState(false)
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)

  const { data: drivers = [] } = useAdminDriversOnline()
  const { data: deliveries = [] } = useAdminActiveDeliveries()
  const { data: route = [] } = useRouteHistory(selectedDriverId)

  useEffect(() => {
    mountedRef.current = true
    if (!hasMapsKey || !mapDivRef.current) return

    loadMapsLibrary('maps').then((mapsLib) => {
      if (!mountedRef.current || !mapDivRef.current || !mapsLib) return
      const map = new mapsLib.Map(mapDivRef.current, {
        center: BOLIVIA_CENTER,
        zoom: BOLIVIA_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }],
      })
      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      mountedRef.current = false
      markersRef.current.forEach((marker) => {
        google.maps.event.clearInstanceListeners(marker)
        marker.setMap(null)
      })
      markersRef.current.clear()
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }
      if (mapRef.current) {
        google.maps.event.clearInstanceListeners(mapRef.current)
        mapRef.current = null
      }
    }
  }, [])

  // Replay de ruta: dibuja la polyline del chofer seleccionado con su
  // historial de las últimas 4h (ver useRouteHistory / driver_location_history).
  useEffect(() => {
    if (!mapReady || !mapRef.current) return

    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }

    if (!selectedDriverId || route.length < 2) return

    polylineRef.current = new google.maps.Polyline({
      map: mapRef.current,
      path: route.map((p) => ({ lat: p.lat, lng: p.lng })),
      strokeColor: Z.orange,
      strokeOpacity: 0.8,
      strokeWeight: 3,
    })
  }, [mapReady, selectedDriverId, route])

  // Sincroniza markers con la lista de choferes online en cada actualización,
  // sin recrear el mapa. Un marker por driver_id, reusado entre renders.
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const map = mapRef.current
    const seen = new Set<string>()

    for (const driver of drivers) {
      seen.add(driver.driver_id)
      const delivery = findDeliveryForDriver(driver.driver_id, deliveries)
      const color = delivery ? STATUS_COLOR[delivery.status] : STATUS_COLOR.accepted
      const silent = isSilent(driver)

      let marker = markersRef.current.get(driver.driver_id)
      const position = { lat: driver.lat, lng: driver.lng }
      const icon: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: silent ? '#71717A' : color,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      }

      if (!marker) {
        marker = new google.maps.Marker({ map, position, icon, title: driver.vehicle_plate ?? driver.driver_id })
        marker.addListener('click', () => setSelectedDriverId(driver.driver_id))
        markersRef.current.set(driver.driver_id, marker)
      } else {
        marker.setPosition(position)
        marker.setIcon(icon)
      }
    }

    // Remueve markers de choferes que ya no están online (>2min sin GPS,
    // ver admin_drivers_online en 20260719000002_admin_events_and_activity.sql).
    for (const [driverId, marker] of markersRef.current.entries()) {
      if (!seen.has(driverId)) {
        google.maps.event.clearInstanceListeners(marker)
        marker.setMap(null)
        markersRef.current.delete(driverId)
      }
    }
  }, [mapReady, drivers, deliveries])

  const silentCount = drivers.filter(isSilent).length
  const selectedDriver = drivers.find((d) => d.driver_id === selectedDriverId) ?? null
  const selectedDelivery = selectedDriverId ? findDeliveryForDriver(selectedDriverId, deliveries) : undefined

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: '70vh', background: Z.bg }}>
      {!hasMapsKey && (
        <div style={{ padding: 24, textAlign: 'center', color: Z.textMuted, fontSize: 14 }}>
          Mapa no disponible (falta VITE_GOOGLE_MAPS_KEY).
        </div>
      )}

      <div ref={mapDivRef} style={{ width: '100%', height: '100%', minHeight: '70vh' }} />

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ background: Z.surface, border: `1px solid ${Z.border}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, color: Z.text }}>
          {drivers.length} choferes online
        </div>
        {silentCount > 0 && (
          <div style={{ background: '#EF444420', border: '1px solid #EF444460', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
            {silentCount} sin señal
          </div>
        )}
      </div>

      {selectedDriver && (
        <DriverDetailSheet
          driver={selectedDriver}
          delivery={selectedDelivery}
          silent={isSilent(selectedDriver)}
          onClose={() => setSelectedDriverId(null)}
        />
      )}
    </div>
  )
}
