
// ziteo-dash-shell.jsx — Dashboard shell: header, floating nav, chat FAB, shared cards

// ── Nav Icons (inline SVGs) ─────────────────────────────────────────────────
function NavIconHome({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-4v-6h-8v6H4a1 1 0 01-1-1V10.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
  </svg>);
}
function NavIconStore({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M6 2L3 7v13a1 1 0 001 1h16a1 1 0 001-1V7l-3-5H6z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    <path d="M3 7h18" stroke={color} strokeWidth="1.8"/>
    <path d="M16 11a4 4 0 01-8 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
  </svg>);
}
function NavIconProjects({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2v11z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
  </svg>);
}
function NavIconBids({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M16 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V8l-5-5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    <path d="M16 3v5h5M8 13h8M8 17h5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>);
}
function NavIconCart({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="21" r="1" fill={color}/><circle cx="20" cy="21" r="1" fill={color}/>
    <path d="M1 1h4l2.7 13.4a1 1 0 001 .8h9.7a1 1 0 001-.8L21 7H6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>);
}
function NavIconTruck({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="1" y="5" width="14" height="12" rx="1.5" stroke={color} strokeWidth="1.8" fill="none"/>
    <path d="M15 9h4l3 4v4h-7V9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    <circle cx="6" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none"/>
    <circle cx="19" cy="18.5" r="2" stroke={color} strokeWidth="1.8" fill="none"/>
  </svg>);
}
function NavIconUsers({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" fill="none"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
  </svg>);
}
function NavIconPlus({ color = '#fff', size = 20 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>);
}
function NavIconMsg({ color = '#fff', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
  </svg>);
}
function IconStar({ color = '#F59E0B', size = 14 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 18l-6.2 3.1L7 14.2l-5-4.9 6.9-1L12 2z" fill={color}/></svg>);
}
function IconVerified({ size = 16 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill={Z.blue}/><path d="M8 12l3 3 5-6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>);
}

// ── Dashboard Header ────────────────────────────────────────────────────────
function DashHeader({ onProfile, notifCount = 3 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '54px 20px 10px', background: Z.bg, position: 'relative', zIndex: 10,
    }}>
      <span style={{
        fontFamily: Z.font, fontWeight: 800, fontSize: 22, letterSpacing: 2,
        background: Z.gradMixed, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>ZITEO</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button style={{
          position: 'relative', width: 38, height: 38, borderRadius: 12, border: 'none',
          background: Z.surface, cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <ZIcon name="bell" size={20} color={Z.textSec} />
          {notifCount > 0 && (
            <div style={{
              position: 'absolute', top: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
              background: Z.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: Z.font, fontSize: 10, fontWeight: 700, color: '#fff',
              border: '2px solid ' + Z.bg,
            }}>{notifCount}</div>
          )}
        </button>
        <div onClick={onProfile} style={{ cursor: 'pointer' }}>
          <ZAvatar name="JC" size={38} />
        </div>
      </div>
    </div>
  );
}

// ── Floating Bottom Nav ─────────────────────────────────────────────────────
function DashNav({ activeTab, onTabChange }) {
  const tabs = [
    { key: 'home', label: 'Home', Icon: NavIconHome },
    { key: 'tienda', label: 'Tienda', Icon: NavIconStore },
    { key: 'proyectos', label: 'Proyectos', Icon: NavIconProjects },
    { key: 'licitaciones', label: 'Licitar', Icon: NavIconBids },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 14, right: 14, height: 58,
      borderRadius: 29, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)',
      zIndex: 20, padding: '0 4px',
    }}>
      {tabs.map(({ key, label, Icon }) => {
        const active = activeTab === key;
        return (
          <button key={key} onClick={() => onTabChange(key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: active ? Z.orangeLight : 'transparent',
            border: 'none', cursor: 'pointer', outline: 'none',
            padding: '7px 14px', borderRadius: 16, transition: 'all 0.2s ease',
            minWidth: 0,
          }}>
            <Icon color={active ? Z.orangeDark : Z.textMuted} size={21} />
            <span style={{
              fontFamily: Z.font, fontSize: 9.5, fontWeight: active ? 700 : 500,
              color: active ? Z.orangeDark : Z.textMuted, letterSpacing: 0.2,
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Chat FAB ────────────────────────────────────────────────────────────────
function ChatFab({ onClick }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', bottom: 92, left: 18, width: 48, height: 48,
      borderRadius: '50%', border: 'none', cursor: 'pointer',
      background: Z.gradMixed, boxShadow: '0 4px 16px rgba(232,115,58,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 15,
    }}>
      <NavIconMsg color="#fff" size={22} />
    </button>
  );
}

// ── Summary Card ────────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color = Z.orange }) {
  return (
    <div style={{
      flex: 1, padding: '14px 12px', borderRadius: Z.r.md, background: Z.surface,
      border: `1px solid ${Z.border}`, display: 'flex', flexDirection: 'column', gap: 6,
      minWidth: 0,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: color + '15',
      }}>{icon}</div>
      <span style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text }}>{value}</span>
      <span style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 600, color: Z.textMuted, lineHeight: 1.3 }}>{label}</span>
    </div>
  );
}

// ── Activity Item ───────────────────────────────────────────────────────────
function ActivityItem({ title, subtitle, time, color = Z.orange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
      borderBottom: `1px solid ${Z.divider}`,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 2,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text }}>{title}</div>
        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textMuted, marginTop: 2 }}>{subtitle}</div>
      </div>
      <span style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{time}</span>
    </div>
  );
}

// ── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ name, brand, price, unit, image, onTap }) {
  return (
    <button onClick={onTap} style={{
      width: '100%', background: Z.surface, borderRadius: Z.r.md,
      border: `1px solid ${Z.border}`, overflow: 'hidden', cursor: 'pointer',
      textAlign: 'left', padding: 0, outline: 'none', transition: 'box-shadow 0.2s',
    }}>
      <div style={{
        height: 110, background: `linear-gradient(135deg, ${Z.divider} 0%, ${Z.blueLight} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 10, color: Z.textMuted, textAlign: 'center', padding: 8,
      }}>{image || 'foto producto'}</div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.text, lineHeight: 1.3 }}>{name}</div>
        {brand && <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted, marginTop: 2 }}>{brand}</div>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
          <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.orangeDark }}>Bs {price}</span>
          {unit && <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>/{unit}</span>}
        </div>
      </div>
    </button>
  );
}

// ── Worker Card ─────────────────────────────────────────────────────────────
function WorkerCard({ name, specialty, experience, rating, verified, onTap }) {
  return (
    <button onClick={onTap} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
      borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`,
      width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(135deg, ${Z.divider}, ${Z.orangeLight})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', fontSize: 9, color: Z.textMuted,
      }}>foto</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{name}</span>
          {verified && <IconVerified size={14} />}
        </div>
        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textSec, marginTop: 2 }}>
          {specialty} · {experience}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <IconStar size={13} />
        <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{rating}</span>
      </div>
    </button>
  );
}

// ── Project Card ────────────────────────────────────────────────────────────
function ProjectCard({ name, status, date, budget, pedidos, onTap }) {
  const statusColors = {
    'Activo': { bg: '#DCFCE7', text: '#16A34A' },
    'Planificación': { bg: Z.blueLight, text: Z.blueDark },
    'Completo': { bg: Z.divider, text: Z.textMuted },
  };
  const sc = statusColors[status] || statusColors['Activo'];
  return (
    <button onClick={onTap} style={{
      display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
      borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`,
      width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{name}</span>
        <span style={{
          fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '4px 10px',
          borderRadius: 20, background: sc.bg, color: sc.text,
        }}>{status}</span>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, fontWeight: 500 }}>Presupuesto</div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>Bs {budget}</div>
        </div>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, fontWeight: 500 }}>Pedidos</div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>{pedidos}</div>
        </div>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, fontWeight: 500 }}>Fecha</div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text, marginTop: 2 }}>{date}</div>
        </div>
      </div>
    </button>
  );
}

// ── Bid Card ────────────────────────────────────────────────────────────────
function BidCard({ title, specialty, budget, city, offers, status, onTap }) {
  const isActive = status === 'Activa';
  return (
    <button onClick={onTap} style={{
      display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
      borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`,
      width: '100%', cursor: 'pointer', textAlign: 'left', outline: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{title}</span>
        <span style={{
          fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '4px 10px',
          borderRadius: 20,
          background: isActive ? Z.orangeLight : Z.divider,
          color: isActive ? Z.orangeDark : Z.textMuted,
        }}>{status}</span>
      </div>
      <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec }}>{specialty}</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.text }}>Bs {budget}</span>
        <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>{city}</span>
        <span style={{
          marginLeft: 'auto', fontFamily: Z.font, fontSize: 12, fontWeight: 700,
          color: isActive ? Z.orange : Z.textMuted,
        }}>{offers} ofertas</span>
      </div>
    </button>
  );
}

// ── Filter Pill Bar ─────────────────────────────────────────────────────────
function FilterBar({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          fontFamily: Z.font, fontSize: 12, fontWeight: active === opt ? 700 : 500,
          padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
          background: active === opt ? Z.orangeDark : Z.surface,
          color: active === opt ? '#fff' : Z.textSec,
          whiteSpace: 'nowrap', transition: 'all 0.2s', outline: 'none',
          boxShadow: active === opt ? 'none' : `0 0 0 1px ${Z.border}`,
        }}>{opt}</button>
      ))}
    </div>
  );
}

// ── Section Title ───────────────────────────────────────────────────────────
function SectionTitle({ title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>{title}</span>
      {action && (
        <span onClick={onAction} style={{
          fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.orange, cursor: 'pointer',
        }}>{action}</span>
      )}
    </div>
  );
}

// ── Generic Role Nav (accepts tabs array) ───────────────────────────────────
function RoleDashNav({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      position: 'absolute', bottom: 24, left: 14, right: 14, height: 58,
      borderRadius: 29, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      boxShadow: '0 2px 20px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04)',
      zIndex: 20, padding: '0 4px',
    }}>
      {tabs.map(({ key, label, Icon }) => {
        const active = activeTab === key;
        return (
          <button key={key} onClick={() => onTabChange(key)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: active ? Z.orangeLight : 'transparent',
            border: 'none', cursor: 'pointer', outline: 'none',
            padding: '7px 14px', borderRadius: 16, transition: 'all 0.2s ease', minWidth: 0,
          }}>
            <Icon color={active ? Z.orangeDark : Z.textMuted} size={21} />
            <span style={{
              fontFamily: Z.font, fontSize: 9.5, fontWeight: active ? 700 : 500,
              color: active ? Z.orangeDark : Z.textMuted, letterSpacing: 0.2,
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  NavIconHome, NavIconStore, NavIconProjects, NavIconBids, NavIconCart, NavIconTruck,
  NavIconUsers, NavIconPlus, NavIconMsg, IconStar, IconVerified,
  DashHeader, DashNav, RoleDashNav, ChatFab, SummaryCard, ActivityItem,
  ProductCard, WorkerCard, ProjectCard, BidCard, FilterBar, SectionTitle,
});
