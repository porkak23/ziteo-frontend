import { useRef } from 'react';
import { Z } from '../tokens';

interface ZOTPInputProps {
  value?: string;
  onChange: (value: string) => void;
  length?: number;
}

export function ZOTPInput({ value = '', onChange, length = 6 }: ZOTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = digit;
    const newVal = arr.join('').slice(0, length);
    onChange(newVal);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="tel"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          style={{
            width: 46,
            height: 54,
            borderRadius: Z.r.sm,
            textAlign: 'center',
            border: `1.5px solid ${value[i] ? Z.orange : Z.border}`,
            fontFamily: Z.font,
            fontSize: 22,
            fontWeight: 700,
            color: Z.text,
            outline: 'none',
            background: value[i] ? Z.orangeLight : Z.surface,
            transition: 'all 0.15s',
            boxSizing: 'border-box',
          }}
        />
      ))}
    </div>
  );
}
