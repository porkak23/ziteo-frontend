import { useState } from 'react';
import { Z } from '../../../shared/design/tokens';

function DeleteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none" />
      <line x1="18" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="12" y1="9" x2="18" y2="15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

interface PinPadProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: string | null;
  label?: string;
  sublabel?: string;
}

const PIN_LENGTH = 6;

const KEYS = [
  '1', '2', '3',
  '4', '5', '6',
  '7', '8', '9',
  '',  '0', 'del',
] as const;

type Key = typeof KEYS[number];

export function PinPad({
  value,
  onChange,
  disabled = false,
  error = null,
  label,
  sublabel,
}: PinPadProps) {
  const [pressedKey, setPressedKey] = useState<Key | null>(null);

  function handleKey(key: Key) {
    if (disabled) return;
    if (key === '' ) return;
    if (key === 'del') {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= PIN_LENGTH) return;
    onChange(value + key);
  }

  return (
    <>
      <style>{`
        @keyframes z-dot-pop {
          0%   { transform: scale(0); opacity: 0; }
          60%  { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes z-error-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .z-dot-filled {
          animation: z-dot-pop 0.2s ease-out forwards;
        }
        .z-pin-error {
          animation: z-error-fade 0.2s ease-out forwards;
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          width: '100%',
        }}
      >
        {/* Label */}
        {label && (
          <p
            style={{
              fontFamily: Z.font,
              fontSize: 18,
              fontWeight: 700,
              color: Z.text,
              margin: 0,
              marginBottom: sublabel ? 4 : 20,
              textAlign: 'center',
            }}
          >
            {label}
          </p>
        )}
        {sublabel && (
          <p
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              color: Z.textMuted,
              margin: 0,
              marginBottom: 20,
              textAlign: 'center',
            }}
          >
            {sublabel}
          </p>
        )}

        {/* Dots */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 32,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {Array.from({ length: PIN_LENGTH }, (_, i) => {
            const filled = i < value.length;
            return (
              <span
                key={i}
                className={filled ? 'z-dot-filled' : ''}
                style={{
                  display: 'block',
                  width: 14,
                  height: 14,
                  borderRadius: Z.r.full,
                  background: filled ? Z.orangeDark : 'transparent',
                  border: filled ? 'none' : `2px solid ${Z.border}`,
                  transition: 'background 0.1s ease, border 0.1s ease',
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>

        {/* Numpad grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 72px)',
            gridTemplateRows: 'repeat(4, 56px)',
            gap: '10px 8px',
          }}
        >
          {KEYS.map((key, idx) => {
            if (key === '') {
              return <div key={idx} />;
            }

            const isDisabled = disabled || (key !== 'del' && value.length >= PIN_LENGTH);
            const isPressed = pressedKey === key;

            return (
              <button
                key={idx}
                type="button"
                disabled={isDisabled}
                onPointerDown={() => { setPressedKey(key); handleKey(key); }}
                onPointerUp={() => setPressedKey(null)}
                onPointerLeave={() => setPressedKey(null)}
                aria-label={key === 'del' ? 'Borrar último dígito' : key}
                style={{
                  width: 72,
                  height: 56,
                  borderRadius: Z.r.md,
                  border: 'none',
                  background: isPressed ? Z.surface : 'transparent',
                  color: key === 'del' ? Z.textSec : Z.text,
                  fontFamily: Z.font,
                  fontSize: key === 'del' ? 16 : 24,
                  fontWeight: 600,
                  cursor: isDisabled ? 'default' : 'pointer',
                  opacity: isDisabled && key !== 'del' ? 0.35 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  outline: 'none',
                  transition: 'background 0.1s ease, transform 0.08s ease',
                  transform: isPressed ? 'scale(0.93)' : 'scale(1)',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'none',
                }}
              >
                {key === 'del' ? (
                  <DeleteIcon />
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <p
            className="z-pin-error"
            style={{
              fontFamily: Z.font,
              fontSize: 13,
              color: 'var(--z-error)',
              margin: 0,
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </>
  );
}
