import { BOLIVIAN_CITIES } from '../../features/auth/constants/authConstants'

interface CityFilterProps {
  value: string
  onChange: (city: string) => void
  allLabel?: string
}

export function CityFilter({ value, onChange, allLabel = 'Todas' }: CityFilterProps) {
  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 flex-1 hide-scrollbar px-4 w-full">
        <button
          onClick={() => onChange('')}
          className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors border ${
            value === ''
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container text-on-surface-variant border-outline-variant'
          }`}
        >
          {allLabel}
        </button>
        {BOLIVIAN_CITIES.map((city) => (
          <button
            key={city}
            onClick={() => onChange(city)}
            className={`rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors border ${
              value === city
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container text-on-surface-variant border-outline-variant'
            }`}
          >
            {city}
          </button>
        ))}
      </div>
    </>
  )
}
