import { Z } from '@/shared/design/tokens'

interface Point {
  lat: number
  lng: number
}

interface MockLiveMapProps {
  driverPosition: { lat: number; lng: number; heading?: number; updatedAt?: string } | null
  pickupLat?: number | null
  pickupLng?: number | null
  dropoffLat?: number | null
  dropoffLng?: number | null
  height?: number
}

const TRUCK_SVG_PATH =
  'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z'

const VB = 400 // viewBox square size
const PAD = 40 // padding in viewBox units

function project(points: Point[]) {
  if (points.length === 0) return null
  const lats = points.map((p) => p.lat)
  const lngs = points.map((p) => p.lng)
  let minLat = Math.min(...lats)
  let maxLat = Math.max(...lats)
  let minLng = Math.min(...lngs)
  let maxLng = Math.max(...lngs)

  // Evita división por cero cuando hay un solo punto o puntos idénticos.
  if (maxLat - minLat < 0.0005) {
    minLat -= 0.0025
    maxLat += 0.0025
  }
  if (maxLng - minLng < 0.0005) {
    minLng -= 0.0025
    maxLng += 0.0025
  }

  const usable = VB - PAD * 2
  return (p: Point) => ({
    x: PAD + ((p.lng - minLng) / (maxLng - minLng)) * usable,
    // Invertido: lat mayor = arriba
    y: PAD + (1 - (p.lat - minLat) / (maxLat - minLat)) * usable,
  })
}

function MockMapCanvas({
  markers,
  height = 320,
}: {
  markers: { point: Point; label: string; kind: 'store' | 'site' | 'driver' }[]
  height?: number
}) {
  const validMarkers = markers.filter((m) => m.point.lat != null && m.point.lng != null)
  const toXY = project(validMarkers.map((m) => m.point))

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: Z.r.md,
        overflow: 'hidden',
        border: `1px dashed ${Z.orange}`,
        height,
        flexShrink: 0,
        background: Z.surface,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          color: '#fff',
          background: Z.orangeDark,
          textAlign: 'center',
        }}
      >
        Mapa simulado — coordenadas de prueba
      </div>
      <svg viewBox={`0 0 ${VB} ${VB}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* Grid de fondo */}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={(i * VB) / 8}
            y1={0}
            x2={(i * VB) / 8}
            y2={VB}
            stroke={Z.divider}
            strokeWidth={1}
          />
        ))}
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={0}
            y1={(i * VB) / 8}
            x2={VB}
            y2={(i * VB) / 8}
            stroke={Z.divider}
            strokeWidth={1}
          />
        ))}

        {toXY &&
          validMarkers.map((m, i) => {
            const { x, y } = toXY(m.point)
            if (m.kind === 'driver') {
              return (
                <g key={i} transform={`translate(${x - 12}, ${y - 12})`}>
                  <circle cx={12} cy={12} r={16} fill={Z.orangePastel} opacity={0.5} />
                  <path d={TRUCK_SVG_PATH} fill={Z.orange} stroke={Z.orangeDark} strokeWidth={0.5} />
                </g>
              )
            }
            const fill = m.kind === 'store' ? '#22C55E' : Z.orangeDark
            return (
              <g key={i}>
                {m.kind === 'store' ? (
                  <rect x={x - 8} y={y - 8} width={16} height={16} rx={3} fill={fill} stroke="#15803D" strokeWidth={2} />
                ) : (
                  <circle cx={x} cy={y} r={9} fill={fill} stroke="#7A2900" strokeWidth={2} />
                )}
                <text
                  x={x}
                  y={y + 24}
                  fontSize={11}
                  textAnchor="middle"
                  fill={Z.text}
                  fontFamily={Z.font}
                  fontWeight={600}
                >
                  {m.label}
                </text>
              </g>
            )
          })}
      </svg>
    </div>
  )
}

export function MockLiveMap({
  driverPosition,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  height,
}: MockLiveMapProps) {
  const markers: { point: Point; label: string; kind: 'store' | 'site' | 'driver' }[] = []
  if (pickupLat != null && pickupLng != null) {
    markers.push({ point: { lat: pickupLat, lng: pickupLng }, label: 'Recogida', kind: 'store' })
  }
  if (dropoffLat != null && dropoffLng != null) {
    markers.push({ point: { lat: dropoffLat, lng: dropoffLng }, label: 'Entrega', kind: 'site' })
  }
  if (driverPosition) {
    markers.push({ point: driverPosition, label: 'Chofer', kind: 'driver' })
  }
  return <MockMapCanvas markers={markers} height={height} />
}

export { MockMapCanvas }
