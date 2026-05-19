
// ziteo-ui.jsx — ZITEO Design System: tokens, icons, reusable UI components

const Z = {
  orange: '#E8733A',
  orangeDark: '#A43700',
  orangeLight: '#FFF0EB',
  orangePastel: '#FFEADF',
  blue: '#3A7BD5',
  blueDark: '#1E5FAD',
  blueLight: '#EDF4FF',
  bluePastel: '#D6E6FF',
  navy: '#0D1020',
  navyMid: '#1A1F35',
  bg: '#F8F6F2',
  surface: '#FFFFFF',
  text: '#1A1A2E',
  textSec: '#64748B',
  textMuted: '#94A3B8',
  error: '#BA1A1A',
  errorBg: '#FFF1F1',
  success: '#16A34A',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  font: "'Manrope', sans-serif",
  r: { sm: 10, md: 14, lg: 20, xl: 28, full: 9999 },
  gradOrange: 'linear-gradient(135deg, #E8733A 0%, #A43700 100%)',
  gradBlue: 'linear-gradient(135deg, #5B9BD5 0%, #2E6EB5 100%)',
  gradMixed: 'linear-gradient(135deg, #E8733A 0%, #3A7BD5 100%)',
};

// ── Icons ───────────────────────────────────────────────────────────────────
function ZIcon({ name, size = 24, color = Z.text, style = {} }) {
  const paths = {
    'arrow-left': <path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    'eye': <><ellipse cx="12" cy="12" rx="9" ry="6" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" fill="none"/></>,
    'eye-off': <><path d="M3 3l18 18M10.5 10.7a2.5 2.5 0 003.3 3.1M6.7 6.7C4.3 8.3 3 12 3 12s4 7 9 7c1.8 0 3.4-.7 4.8-1.7" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/><path d="M14 5.5C13.4 5.2 12.7 5 12 5c-5 0-9 7-9 7s1.3 3.7 3.7 5.3" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/></>,
    'check': <path d="M5 12l5 5L19 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
    'phone': <><rect x="6" y="2" width="12" height="20" rx="2.5" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="12" cy="18" r="1" fill={color}/></>,
    'search': <><circle cx="10.5" cy="10.5" r="6" stroke={color} strokeWidth="1.8" fill="none"/><path d="M15 15l5 5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    'settings': <><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" fill="none"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    'logout': <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    'sun': <><circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" fill="none"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4l1.4-1.4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
    'moon': <path d="M21 12.8A9 9 0 0111.2 3a7 7 0 109.8 9.8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>,
    'fingerprint': <><path d="M12 2a10 10 0 00-7.4 16.6M12 2a10 10 0 017.4 16.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/><path d="M12 8a4 4 0 00-4 4c0 2.2.8 4.2 2 5.6M12 8a4 4 0 014 4c0 2.2-.8 4.2-2 5.6M12 11v4" stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none"/></>,
    'close': <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none"/>,
    'bell': <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>,
    'map-pin': <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.8" fill="none"/><circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" fill="none"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, ...style }}>
      {paths[name] || null}
    </svg>
  );
}

// ── Role Icons (larger, colored) ────────────────────────────────────────────
function ZRoleIcon({ role, size = 44 }) {
  const icons = {
    constructor: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="8" y="28" width="32" height="14" rx="2" fill={Z.orangeDark} opacity="0.15"/>
        <rect x="12" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
        <rect x="21" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
        <rect x="30" y="32" width="6" height="6" rx="1" fill={Z.orange} opacity="0.5"/>
        <path d="M6 28h36" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M14 28V18l10-8 10 8v10" stroke={Z.orangeDark} strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
        <rect x="20" y="20" width="8" height="8" rx="1.5" stroke={Z.orange} strokeWidth="2" fill="none"/>
      </svg>
    ),
    vendedor: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="8" y="20" width="32" height="22" rx="3" fill={Z.blue} opacity="0.12"/>
        <path d="M8 20h32" stroke={Z.blueDark} strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M6 20c0 0 4-10 18-10s18 10 18 10" stroke={Z.blue} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <rect x="18" y="28" width="12" height="14" rx="2" stroke={Z.blueDark} strokeWidth="2" fill={Z.blue} opacity="0.2"/>
        <circle cx="24" cy="34" r="1.5" fill={Z.blueDark}/>
      </svg>
    ),
    trabajador: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M18 10l-8 8 3 3 8-8M30 38l8-8-3-3-8 8" stroke={Z.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 34l20-20" stroke={Z.orangeDark} strokeWidth="3" strokeLinecap="round"/>
        <circle cx="14" cy="34" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
        <circle cx="34" cy="14" r="3" fill={Z.orange} opacity="0.3" stroke={Z.orangeDark} strokeWidth="2"/>
      </svg>
    ),
    repartidor: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <rect x="4" y="16" width="24" height="18" rx="3" stroke={Z.blueDark} strokeWidth="2.5" fill={Z.blue} opacity="0.1"/>
        <path d="M28 22h10l6 8v4h-16v-12z" stroke={Z.blueDark} strokeWidth="2.5" strokeLinejoin="round" fill={Z.blue} opacity="0.1"/>
        <circle cx="14" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white"/>
        <circle cx="38" cy="36" r="4" stroke={Z.blue} strokeWidth="2.5" fill="white"/>
        <circle cx="14" cy="36" r="1.5" fill={Z.blueDark}/>
        <circle cx="38" cy="36" r="1.5" fill={Z.blueDark}/>
      </svg>
    ),
  };
  return icons[role] || null;
}

// ── Button ──────────────────────────────────────────────────────────────────
function ZButton({ children, variant = 'primary', fullWidth = true, disabled = false, onClick, style = {}, icon }) {
  const [pressed, setPressed] = React.useState(false);
  const variants = {
    primary: { background: Z.orangeDark, color: '#FFFFFF', border: 'none' },
    secondary: { background: 'transparent', color: Z.orangeDark, border: `2px solid ${Z.orangeDark}` },
    blue: { background: Z.blueDark, color: '#FFFFFF', border: 'none' },
    ghost: { background: 'transparent', color: Z.textSec, border: 'none' },
    social: { background: Z.surface, color: Z.text, border: `1.5px solid ${Z.border}` },
    danger: { background: '#FFF1F1', color: Z.error, border: `1.5px solid #FECACA` },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      disabled={disabled}
      onClick={onClick}
      style={{
        fontFamily: Z.font, fontWeight: 700, fontSize: 14, letterSpacing: '0.3px',
        textTransform: 'uppercase', padding: '15px 24px', borderRadius: Z.r.md,
        cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 10, width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.15s ease', opacity: disabled ? 0.45 : 1,
        transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
        boxSizing: 'border-box', outline: 'none',
        ...v, ...style,
      }}
    >
      {icon}
      {children}
    </button>
  );
}

// ── Input ───────────────────────────────────────────────────────────────────
function ZInput({ label, type = 'text', value, onChange, placeholder, prefix, error, suffix, style = {} }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>{label}</label>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 0,
        border: `1.5px solid ${error ? Z.error : focused ? Z.orange : Z.border}`,
        borderRadius: Z.r.sm, background: Z.surface, overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}>
        {prefix && (
          <span style={{ padding: '0 0 0 14px', fontFamily: Z.font, fontSize: 15, fontWeight: 600, color: Z.textSec, whiteSpace: 'nowrap' }}>
            {prefix}
          </span>
        )}
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: Z.text,
            padding: prefix ? '14px 14px 14px 8px' : '14px', width: '100%',
            boxSizing: 'border-box',
          }}
        />
        {suffix}
      </div>
      {error && <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.error, fontWeight: 500 }}>{error}</span>}
    </div>
  );
}

// ── Select ──────────────────────────────────────────────────────────────────
function ZSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>{label}</label>}
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{
          fontFamily: Z.font, fontSize: 15, fontWeight: 500, color: value ? Z.text : Z.textMuted,
          padding: '14px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
          background: Z.surface, outline: 'none', appearance: 'none', cursor: 'pointer',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394A3B8' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center',
        }}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

// ── PIN Input ───────────────────────────────────────────────────────────────
function ZPinInput({ value = '', onChange, length = 6, visible = false, onToggle }) {
  const ref = React.useRef(null);
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec }}>PIN de seguridad</label>
          {onToggle && (
            <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <ZIcon name={visible ? 'eye-off' : 'eye'} size={20} color={Z.textMuted} />
            </button>
          )}
        </div>
        <div
          onClick={() => ref.current?.focus()}
          style={{ display: 'flex', gap: 10, justifyContent: 'center', cursor: 'text', position: 'relative' }}
        >
          <input
            ref={ref} type="tel" maxLength={length} value={value}
            onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
            autoComplete="off"
          />
          {Array.from({ length }, (_, i) => (
            <div key={i} style={{
              width: 46, height: 50, borderRadius: Z.r.sm,
              border: `1.5px solid ${i === value.length ? Z.orange : i < value.length ? Z.orange : Z.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i < value.length ? Z.orangeLight : Z.surface,
              transition: 'all 0.15s',
            }}>
              {i < value.length && (
                visible
                  ? <span style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 700, color: Z.text }}>{value[i]}</span>
                  : <div style={{ width: 12, height: 12, borderRadius: '50%', background: Z.orangeDark }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── OTP Input ───────────────────────────────────────────────────────────────
function ZOTPInput({ value = '', onChange, length = 6 }) {
  const refs = React.useRef([]);
  const handleChange = (i, v) => {
    const digit = v.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[i] = digit;
    const newVal = arr.join('').slice(0, length);
    onChange(newVal);
    if (digit && i < length - 1) refs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus();
  };
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="tel" maxLength={1} value={value[i] || ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          style={{
            width: 46, height: 54, borderRadius: Z.r.sm, textAlign: 'center',
            border: `1.5px solid ${value[i] ? Z.orange : Z.border}`,
            fontFamily: Z.font, fontSize: 22, fontWeight: 700, color: Z.text,
            outline: 'none', background: value[i] ? Z.orangeLight : Z.surface,
            transition: 'all 0.15s', boxSizing: 'border-box',
          }}
        />
      ))}
    </div>
  );
}

// ── Role Card ───────────────────────────────────────────────────────────────
function ZRoleCard({ role, title, description, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
        borderRadius: Z.r.md, cursor: 'pointer', width: '100%', textAlign: 'left',
        border: `2px solid ${selected ? Z.orange : Z.border}`,
        background: selected ? Z.orangeLight : Z.surface,
        transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none',
      }}
    >
      <ZRoleIcon role={role} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{title}</div>
        <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec, marginTop: 2 }}>{description}</div>
      </div>
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${selected ? Z.orange : Z.border}`,
        background: selected ? Z.orange : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {selected && <ZIcon name="check" size={14} color="#fff" />}
      </div>
    </button>
  );
}

// ── Step Progress Bar ───────────────────────────────────────────────────────
function ZStepBar({ current, total = 3 }) {
  return (
    <div style={{ display: 'flex', gap: 6, padding: '0 4px' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 4, borderRadius: 2,
          background: i < current ? Z.orange : i === current ? Z.orangePastel : Z.divider,
          transition: 'background 0.3s',
          overflow: 'hidden', position: 'relative',
        }}>
          {i === current && (
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '50%', background: Z.orange, borderRadius: 2,
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Avatar ──────────────────────────────────────────────────────────────────
function ZAvatar({ name = '', size = 96, gradient = true }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: gradient ? Z.gradOrange : Z.orangeLight,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `0 4px 20px rgba(232,115,58,0.25)`,
      border: gradient ? 'none' : `3px solid ${Z.orange}`,
    }}>
      <span style={{
        fontFamily: Z.font, fontSize: size * 0.35, fontWeight: 800,
        color: gradient ? '#FFFFFF' : Z.orangeDark, letterSpacing: 1,
      }}>{initials || 'U'}</span>
    </div>
  );
}

// ── Screen Header ───────────────────────────────────────────────────────────
function ZHeader({ title, onBack, right, dark = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '58px 16px 12px', position: 'relative', zIndex: 5,
    }}>
      {onBack ? (
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)',
        }}>
          <ZIcon name="arrow-left" size={22} color={dark ? '#fff' : Z.text} />
        </button>
      ) : <div style={{ width: 40 }} />}
      {title && (
        <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 700, color: dark ? '#fff' : Z.text }}>
          {title}
        </span>
      )}
      {right || <div style={{ width: 40 }} />}
    </div>
  );
}

// ── Divider ─────────────────────────────────────────────────────────────────
function ZDivider({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: Z.border }} />
      {text && <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textMuted, whiteSpace: 'nowrap' }}>{text}</span>}
      <div style={{ flex: 1, height: 1, background: Z.border }} />
    </div>
  );
}

// ── Screen Wrapper ──────────────────────────────────────────────────────────
function ZScreen({ children, bg = Z.bg, style = {} }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: bg, display: 'flex', flexDirection: 'column',
      animation: 'zFadeSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  );
}

Object.assign(window, {
  Z, ZIcon, ZRoleIcon, ZButton, ZInput, ZSelect, ZPinInput, ZOTPInput,
  ZRoleCard, ZStepBar, ZAvatar, ZHeader, ZDivider, ZScreen,
});
