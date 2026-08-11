import isotipo from '@/assets/brand/isotipo.svg'

export function BrandWatermark() {
  return (
    <img
      src={isotipo}
      alt=""
      aria-hidden="true"
      className="fixed pointer-events-none select-none"
      style={{
        bottom: -60,
        right: -60,
        width: 320,
        height: 320,
        opacity: 0.04,
        zIndex: 0,
      }}
    />
  )
}
