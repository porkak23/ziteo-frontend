/// <reference types="@types/google.maps" />
import { useEffect, useRef, useCallback } from 'react'
import { Z } from '@/shared/design/tokens'
import { MAPS_KEY, hasMapsKey, loadMapsLibrary } from '@/shared/lib/mapsLoader'
import { captureException } from '@/lib/sentryClient'
import { useToast } from '@/shared/hooks/useToast'
import { Toast } from '@/shared/components/Toast'

interface AddressInputProps {
  value: string
  onChange: (address: string) => void
  onCityChange?: (city: string) => void
  placeholder?: string
  inputStyle?: React.CSSProperties
}

export function AddressInput({ value, onChange, onCityChange, placeholder, inputStyle }: AddressInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const { toasts, showToast, removeToast } = useToast()

  // Sync externally-changed value (e.g. project autofill) → DOM input
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value
    }
  }, [value])

  // Attach Places Autocomplete once on mount
  useEffect(() => {
    if (!hasMapsKey || !inputRef.current) return
    let mounted = true

    loadMapsLibrary('places').then((lib) => {
      if (!mounted || !inputRef.current || !lib) return
      const autocomplete = new lib.Autocomplete(inputRef.current, {
        componentRestrictions: { country: 'bo' },
        fields: ['formatted_address', 'address_components'],
        types: ['address'],
      })
      autocompleteRef.current = autocomplete
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        const addr = place.formatted_address ?? inputRef.current?.value ?? ''
        onChange(addr)
        if (onCityChange && place.address_components) {
          const comp = place.address_components.find((c) =>
            c.types.includes('locality') || c.types.includes('administrative_area_level_2')
          )
          if (comp) onCityChange(comp.long_name)
        }
      })
    }).catch((err) => {
      captureException(err, { context: 'AddressInput.loadMapsLibrary' })
    })

    return () => {
      mounted = false
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGps = useCallback(() => {
    if (!MAPS_KEY || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${MAPS_KEY}&language=es`
          )
          const data = await res.json() as {
            results?: { formatted_address: string; address_components: { types: string[]; long_name: string }[] }[]
          }
          const result = data.results?.[0]
          if (!result) return
          onChange(result.formatted_address)
          if (onCityChange) {
            const comp = result.address_components.find((c) =>
              c.types.includes('locality') || c.types.includes('administrative_area_level_2')
            )
            if (comp) onCityChange(comp.long_name)
          }
        } catch (err) {
          captureException(err, { context: 'AddressInput.handleGps.reverseGeocode' })
          showToast('No pudimos obtener la dirección, ingrésala manualmente', 'error')
        }
      },
      undefined,
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }, [onChange, onCityChange, showToast])

  return (
    <div style={{ position: 'relative' }}>
      <Toast toasts={toasts} onRemove={removeToast} />
      <input
        ref={inputRef}
        defaultValue={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          paddingRight: hasMapsKey ? 44 : inputStyle?.paddingRight,
        }}
      />
      {hasMapsKey && (
        <button
          type="button"
          onClick={handleGps}
          title="Usar mi ubicacion actual"
          aria-label="Usar mi ubicacion actual"
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 20, color: Z.orange }}
          >
            my_location
          </span>
        </button>
      )}
    </div>
  )
}
