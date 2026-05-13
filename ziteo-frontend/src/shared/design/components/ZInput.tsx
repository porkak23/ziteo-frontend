import { useState } from 'react';
import { Z } from '../tokens';

interface ZInputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  error?: string;
  suffix?: React.ReactNode;
  style?: React.CSSProperties;
}

export function ZInput({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  prefix,
  error,
  suffix,
  style = {},
}: ZInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <label
          style={{
            fontFamily: Z.font,
            fontSize: 13,
            fontWeight: 600,
            color: Z.textSec,
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 0,
          border: `1.5px solid ${error ? Z.error : focused ? Z.orange : Z.border}`,
          borderRadius: Z.r.sm,
          background: Z.surface,
          overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}
      >
        {prefix && (
          <span
            style={{
              padding: '0 0 0 14px',
              fontFamily: Z.font,
              fontSize: 15,
              fontWeight: 600,
              color: Z.textSec,
              whiteSpace: 'nowrap',
            }}
          >
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: Z.font,
            fontSize: 15,
            fontWeight: 500,
            color: Z.text,
            padding: prefix ? '14px 14px 14px 8px' : '14px',
            width: '100%',
            boxSizing: 'border-box',
          }}
        />
        {suffix}
      </div>
      {error && (
        <span
          style={{
            fontFamily: Z.font,
            fontSize: 12,
            color: Z.error,
            fontWeight: 500,
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
}
