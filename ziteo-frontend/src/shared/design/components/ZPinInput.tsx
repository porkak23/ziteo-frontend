import { useRef } from 'react';
import { Z } from '../tokens';
import { ZIcon } from './ZIcon';

interface ZPinInputProps {
  value?: string;
  onChange: (value: string) => void;
  length?: number;
  visible?: boolean;
  onToggle?: () => void;
}

export function ZPinInput({ value = '', onChange, length = 6, visible = false, onToggle }: ZPinInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <label
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              fontWeight: 600,
              color: Z.textSec,
            }}
          >
            PIN de seguridad
          </label>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <ZIcon name={visible ? 'eye-off' : 'eye'} size={20} color={Z.textMuted} />
            </button>
          )}
        </div>
        <div
          onClick={() => ref.current?.focus()}
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            cursor: 'text',
            position: 'relative',
          }}
        >
          <input
            ref={ref}
            type="tel"
            maxLength={length}
            value={value}
            onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
            autoComplete="off"
          />
          {Array.from({ length }, (_, i) => (
            <div
              key={i}
              style={{
                width: 46,
                height: 50,
                borderRadius: Z.r.sm,
                border: `1.5px solid ${i <= value.length && i === value.length ? Z.orange : i < value.length ? Z.orange : Z.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: i < value.length ? Z.orangeLight : Z.surface,
                transition: 'all 0.15s',
              }}
            >
              {i < value.length && (
                visible ? (
                  <span
                    style={{
                      fontFamily: Z.font,
                      fontSize: 20,
                      fontWeight: 700,
                      color: Z.text,
                    }}
                  >
                    {value[i]}
                  </span>
                ) : (
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: Z.orangeDark,
                    }}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
