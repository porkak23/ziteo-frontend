import { useRef, useEffect, useState } from 'react';
import type { KeyboardEvent, ClipboardEvent } from 'react';
import { Z } from '../../../shared/design/tokens';

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  error?: boolean;
}

const CELL_COUNT = 6;

export function OtpInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  error = false,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [filledIndices, setFilledIndices] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  function focusCell(index: number) {
    const clamped = Math.max(0, Math.min(CELL_COUNT - 1, index));
    inputRefs.current[clamped]?.focus();
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(CELL_COUNT, '').split('').slice(0, CELL_COUNT);
    chars[index] = digit;
    const newVal = chars.join('');
    onChange(newVal);
    if (digit) {
      setFilledIndices((prev) => new Set(prev).add(index));
      if (index < CELL_COUNT - 1) {
        focusCell(index + 1);
      }
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const chars = value.padEnd(CELL_COUNT, '').split('').slice(0, CELL_COUNT);
      if (chars[index]) {
        chars[index] = '';
        onChange(chars.join(''));
        setFilledIndices((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      } else if (index > 0) {
        chars[index - 1] = '';
        onChange(chars.join(''));
        setFilledIndices((prev) => {
          const next = new Set(prev);
          next.delete(index - 1);
          return next;
        });
        focusCell(index - 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusCell(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusCell(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CELL_COUNT);
    if (!pasted) return;
    const chars = Array.from({ length: CELL_COUNT }, (_, i) => pasted[i] ?? '');
    onChange(chars.join(''));
    const newFilled = new Set<number>();
    for (let i = 0; i < pasted.length; i++) newFilled.add(i);
    setFilledIndices(newFilled);
    focusCell(Math.min(pasted.length, CELL_COUNT - 1));
  }

  return (
    <>
      <style>{`
        @keyframes z-otp-pop {
          0%   { transform: scale(1); }
          45%  { transform: scale(1.14); }
          100% { transform: scale(1); }
        }
        .z-otp-cell-pop {
          animation: z-otp-pop 0.18s ease-out;
        }
      `}</style>
      <div
        style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {Array.from({ length: CELL_COUNT }, (_, i) => {
          const digit = (value[i] ?? '');
          const isFocused = focusedIndex === i;
          const isFilled = digit !== '';

          let borderColor: string = Z.border;
          let boxShadow = 'none';
          if (error) {
            borderColor = 'var(--z-error)';
            boxShadow = isFocused ? '0 0 0 3px var(--z-error-bg)' : 'none';
          } else if (isFocused) {
            borderColor = Z.orange;
            boxShadow = `0 0 0 3px ${Z.orangeLight}`;
          }

          return (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              value={digit}
              disabled={disabled}
              aria-label={`Dígito ${i + 1} del código`}
              className={isFilled && filledIndices.has(i) ? 'z-otp-cell-pop' : ''}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => {
                setFocusedIndex(i);
                e.target.select();
              }}
              onBlur={() => setFocusedIndex(null)}
              style={{
                width: 52,
                height: 60,
                borderRadius: Z.r.md,
                border: `1.5px solid ${borderColor}`,
                boxShadow,
                background: Z.surface,
                color: Z.text,
                fontFamily: Z.font,
                fontSize: 28,
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
                cursor: disabled ? 'not-allowed' : 'text',
                opacity: disabled ? 0.5 : 1,
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                caretColor: Z.orange,
                boxSizing: 'border-box',
              }}
            />
          );
        })}
      </div>
    </>
  );
}
