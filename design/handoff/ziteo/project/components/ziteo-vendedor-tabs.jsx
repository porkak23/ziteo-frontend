
// ziteo-vendedor-tabs.jsx — Vendedor/Comercio Dashboard: 4 tabs + sub-screens

// ── Vendedor Nav Icons ──────────────────────────────────────────────────────
function VNavIconInventory({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth="1.8" fill="none"/>
    <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth="1.8"/>
  </svg>);
}
function VNavIconOrders({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke={color} strokeWidth="1.8" fill="none"/>
    <rect x="9" y="3" width="6" height="4" rx="1" stroke={color} strokeWidth="1.8" fill="none"/>
    <path d="M9 12h6M9 16h4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>);
}
function VNavIconQuotes({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth="1.8" fill="none"/>
    <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>);
}

// ── Flexible Nav (shared by vendedor + trabajador) ──────────────────────────
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

// ── Sample Data ─────────────────────────────────────────────────────────────
const V_PRODUCTS = [
  { id: 1, name: 'Cemento IP-30', sku: 'CEM-IP30-FAN', brand: 'Fancesa', price: 62, unit: 'bolsa', weight: '50kg', total: 250, comprometido: 50, critico: 30 },
  { id: 2, name: 'Fierro Corrugado 12mm', sku: 'FIE-12MM-DUR', brand: 'Duralit', price: 85, unit: 'barra', weight: '10kg', total: 80, comprometido: 20, critico: 15 },
  { id: 3, name: 'Arena Fina', sku: 'ARE-FIN-CS', brand: 'Cantera Sur', price: 350, unit: 'm³', weight: '-', total: 15, comprometido: 3, critico: 5 },
  { id: 4, name: 'Ladrillo 6 Huecos', sku: 'LAD-6H-CER', brand: 'Ceramil', price: 1.2, unit: 'unid', weight: '3.5kg', total: 5000, comprometido: 500, critico: 500 },
  { id: 5, name: 'Tubería PVC 4"', sku: 'TUB-PVC4-TIG', brand: 'Tigre', price: 48, unit: 'tubo', weight: '2.5kg', total: 30, comprometido: 5, critico: 10 },
];
const V_ORDERS = [
  { id: 1, buyer: 'Juan Carlos Mamani', items: '50 bolsas Cemento IP-30', total: 3100, status: 'Pendiente', delivery: 'envio', time: 'Hace 1h' },
  { id: 2, buyer: 'Roberto Flores', items: '10 barras Fierro 12mm', total: 850, status: 'Confirmado', delivery: 'retiro', time: 'Hace 3h' },
  { id: 3, buyer: 'María González', items: '2m³ Arena Fina', total: 700, status: 'Listo', delivery: 'flota', time: 'Hace 5h' },
  { id: 4, buyer: 'Carlos Condori', items: '200 ladrillos 6H + 5 bolsas cemento', total: 550, status: 'En Tránsito', delivery: 'app', time: 'Ayer' },
  { id: 5, buyer: 'Luis Vargas', items: '1 Tubería PVC 4"', total: 48, status: 'Entregado', delivery: 'retiro', time: 'Hace 2d' },
];
const V_QUOTES = [
  { id: 1, buyer: 'Obra Los Pinos', items: ['100 bolsas Cemento IP-30', '20 barras Fierro 12mm'], when: 'Para el lunes', payment: 'Contado', city: 'Santa Cruz' },
  { id: 2, buyer: 'Construcciones Sur', items: ['50 bolsas Cemento IP-30'], when: 'Para hoy', payment: 'Transferencia', city: 'Santa Cruz' },
  { id: 3, buyer: 'Arq. Torres & Asociados', items: ['500 Ladrillos 6H', '10 bolsas Cemento', '1m³ Arena'], when: 'Próxima semana', payment: 'Crédito 30d', city: 'La Paz' },
];

// ── Home Tab Vendedor ────────────────────────────────────────────────────────
function HomeTabVendedor({ onNavigate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Greeting */}
      <div>
        <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 21, color: Z.text, margin: 0 }}>
          {greeting}, Ferretería San José
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <ZIcon name="map-pin" size={13} color={Z.textMuted} />
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec }}>
            Santa Cruz · Vendedor
          </span>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 10 }}>
        <SummaryCard icon={<VNavIconOrders color={Z.orange} size={17} />} label="Pedidos pendientes" value="8" color={Z.orange} />
        <SummaryCard icon={<VNavIconInventory color={Z.blue} size={17} />} label="Productos activos" value="124" color={Z.blue} />
        <SummaryCard
          icon={<svg width="17" height="17" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={Z.orange} strokeWidth="2.2" strokeLinecap="round" fill="none"/></svg>}
          label="Ventas del mes" value="45.3k" color={Z.orange}
        />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={() => onNavigate('pedidos')} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
          borderRadius: Z.r.lg, border: 'none', cursor: 'pointer', width: '100%',
          background: `linear-gradient(135deg, ${Z.orangeDark} 0%, ${Z.orange} 100%)`,
          boxShadow: '0 4px 16px rgba(164,55,0,0.22)', textAlign: 'left', outline: 'none',
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-6-6zm0 0v6h6" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/><path d="M8 13h4M8 17h8" stroke="rgba(255,255,255,0.8)" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: '#fff' }}>Gestionar Pedidos</div>
            <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>8 pendientes de despacho</div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          </svg>
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Logística */}
          <button onClick={() => onNavigate('inventario')} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '16px',
            borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
            background: Z.surface, textAlign: 'left', outline: 'none',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: Z.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VNavIconInventory color={Z.blueDark} size={20} />
            </div>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>Inventario</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>1 stock crítico</div>
            </div>
          </button>
          {/* Mercado */}
          <button onClick={() => {}} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '16px',
            borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
            background: Z.surface, textAlign: 'left', outline: 'none',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: Z.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8l-1.4 7h12.8M9 21a1 1 0 110-2 1 1 0 010 2zm10 0a1 1 0 110-2 1 1 0 010 2z" stroke={Z.orangeDark} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>Mercado</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>Ver precios</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <SectionTitle title="Últimos Pedidos" action="Ver todos" onAction={() => onNavigate('pedidos')} />
        <div style={{ marginTop: 8 }}>
          {V_ORDERS.slice(0, 3).map(o => (
            <ActivityItem key={o.id}
              title={o.buyer + ' — ' + o.items}
              subtitle={'Bs ' + o.total.toLocaleString() + ' · ' + o.status}
              time={o.time}
              color={o.status === 'Pendiente' ? Z.orange : o.status === 'En Tránsito' ? Z.blue : Z.success}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Inventario Tab ──────────────────────────────────────────────────────────
function InventarioTab() {
  const [updateMode, setUpdateMode] = React.useState(null);

  const getDisponible = p => p.total - p.comprometido;
  const isCritical = p => getDisponible(p) <= p.critico;

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Inventario</h2>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
          borderRadius: 20, border: 'none', cursor: 'pointer',
          background: Z.orangeDark, color: '#fff', outline: 'none',
          fontFamily: Z.font, fontSize: 12, fontWeight: 700,
        }}>
          <NavIconPlus color="#fff" size={14} /> Agregar
        </button>
      </div>

      {/* Update methods */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { key: 'manual', label: 'Manual', icon: '✎' },
          { key: 'csv', label: 'CSV', icon: '⇪' },
          { key: 'api', label: 'API Sync', icon: '⟳' },
        ].map(m => (
          <button key={m.key} onClick={() => setUpdateMode(updateMode === m.key ? null : m.key)} style={{
            flex: 1, padding: '9px 6px', borderRadius: Z.r.sm, border: 'none', cursor: 'pointer',
            background: updateMode === m.key ? Z.blueLight : Z.surface,
            boxShadow: `0 0 0 1px ${updateMode === m.key ? Z.blue : Z.border}`,
            fontFamily: Z.font, fontSize: 11, fontWeight: 700,
            color: updateMode === m.key ? Z.blueDark : Z.textSec, outline: 'none',
          }}>{m.icon} {m.label}</button>
        ))}
      </div>
      {updateMode === 'csv' && (
        <div style={{ padding: '14px', borderRadius: Z.r.md, background: Z.blueLight, border: `1px solid ${Z.bluePastel}`, animation: 'zFadeSlideIn 0.2s ease' }}>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.blueDark }}>Carga masiva CSV</div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 4 }}>Sube tu archivo Excel o CSV para actualizar el inventario completo.</div>
          <button style={{ marginTop: 10, padding: '8px 16px', borderRadius: 20, border: 'none', background: Z.blue, color: '#fff', fontFamily: Z.font, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Subir archivo</button>
        </div>
      )}
      {updateMode === 'api' && (
        <div style={{ padding: '14px', borderRadius: Z.r.md, background: Z.blueLight, border: `1px solid ${Z.bluePastel}`, animation: 'zFadeSlideIn 0.2s ease' }}>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.blueDark }}>Integración API</div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 4 }}>Conecta tu sistema POS o software contable para sincronización automática cada 10 min.</div>
          <button style={{ marginTop: 10, padding: '8px 16px', borderRadius: 20, border: 'none', background: Z.blue, color: '#fff', fontFamily: Z.font, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Configurar API</button>
        </div>
      )}

      {/* Stock critical alert */}
      <div style={{ padding: '12px 14px', borderRadius: Z.r.md, background: '#FFF1F1', border: `1px solid #FECACA`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: Z.error, flexShrink: 0 }} />
        <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.error }}>
          1 producto en stock crítico: <strong>Tubería PVC 4"</strong> (25 disponibles, mínimo 10)
        </span>
      </div>

      {/* Products list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {V_PRODUCTS.map(p => {
          const disp = getDisponible(p);
          const crit = isCritical(p);
          const pct = Math.max(0, disp / p.total);
          return (
            <div key={p.id} style={{
              padding: '14px', borderRadius: Z.r.md, background: Z.surface,
              border: `1.5px solid ${crit ? '#FECACA' : Z.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{p.name}</span>
                    {crit && <span style={{ fontFamily: Z.font, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#FFF1F1', color: Z.error }}>CRÍTICO</span>}
                  </div>
                  <span style={{ fontFamily: 'monospace', fontSize: 10, color: Z.textMuted }}>{p.sku} · {p.brand}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${Z.border}`, background: Z.surface, cursor: 'pointer', fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textSec, outline: 'none' }}>Edit</button>
                </div>
              </div>
              {/* Stock bar */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, marginBottom: 4 }}>Disponible / Total</div>
                  <div style={{ height: 6, borderRadius: 3, background: Z.divider, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${pct * 100}%`, background: crit ? Z.error : Z.orange, transition: 'width 0.5s' }} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>{p.total}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 9, color: Z.textMuted, fontWeight: 600 }}>Total</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.orange }}>{p.comprometido}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 9, color: Z.textMuted, fontWeight: 600 }}>Apartado</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: crit ? Z.error : Z.success }}>{disp}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 9, color: Z.textMuted, fontWeight: 600 }}>Disponible</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.orangeDark }}>Bs {p.price}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 9, color: Z.textMuted }}>/{p.unit}</div>
                </div>
              </div>
              {updateMode === 'manual' && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, animation: 'zFadeSlideIn 0.2s ease' }}>
                  <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>Ajustar:</span>
                  <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${Z.border}`, background: Z.surface, cursor: 'pointer', fontSize: 18, fontWeight: 700, outline: 'none' }}>−</button>
                  <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, width: 40, textAlign: 'center' }}>{p.total}</span>
                  <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${Z.border}`, background: Z.surface, cursor: 'pointer', fontSize: 18, fontWeight: 700, outline: 'none' }}>+</button>
                  <button style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 20, border: 'none', background: Z.orangeDark, color: '#fff', fontFamily: Z.font, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Guardar</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Pedidos Filter Dropdown ──────────────────────────────────────────────────
function PedidosFilterDropdown({ options, value, onChange, statusColor }) {
  const [open, setOpen] = React.useState(false);
  const dot = statusColor[value];
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '11px 16px', width: '100%',
          borderRadius: Z.r.md, border: `1.5px solid ${open ? Z.orange : Z.border}`,
          background: Z.surface, cursor: 'pointer', outline: 'none',
          fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.text,
          transition: 'border-color 0.15s',
          boxShadow: open ? `0 0 0 3px ${Z.orange}22` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
            background: dot || Z.textMuted,
          }} />
          <span>{value}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M6 9l6 6 6-6" stroke={Z.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: Z.surface, borderRadius: Z.r.md,
          border: `1px solid ${Z.border}`,
          boxShadow: '0 8px 28px rgba(0,0,0,0.10)', zIndex: 50, overflow: 'hidden',
          animation: 'zFadeSlideIn 0.15s ease',
        }}>
          {options.map((opt, i) => {
            const isSelected = opt === value;
            const d = statusColor[opt];
            return (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 16px', width: '100%', border: 'none', cursor: 'pointer',
                  background: isSelected ? Z.orangeLight : 'transparent',
                  fontFamily: Z.font, fontSize: 13,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? Z.orangeDark : Z.text,
                  borderBottom: i < options.length - 1 ? `1px solid ${Z.divider}` : 'none',
                  outline: 'none', textAlign: 'left', transition: 'background 0.1s',
                }}
              >
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: d || Z.textMuted, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{opt}</span>
                {isSelected && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L19 7" stroke={Z.orange} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Pedidos Tab ─────────────────────────────────────────────────────────────
function PedidosTabVendedor() {
  const [filter, setFilter] = React.useState('Pendiente');
  const [selectedOrder, setSelectedOrder] = React.useState(null);

  const pipeline = ['Pendiente', 'Confirmado', 'Listo', 'En Tránsito', 'Entregado'];
  const allOptions = ['Todos', ...pipeline];
  const filtered = filter === 'Todos' ? V_ORDERS : V_ORDERS.filter(o => o.status === filter);

  const statusColor = { Todos: Z.textMuted, Pendiente: Z.orange, Confirmado: Z.blue, Listo: Z.success, 'En Tránsito': Z.blue, Entregado: Z.textMuted };

  if (selectedOrder) return <LogisticaScreen order={selectedOrder} onBack={() => setSelectedOrder(null)} />;

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Pedidos</h2>
        <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textMuted }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>
      <PedidosFilterDropdown
        options={allOptions}
        value={filter}
        onChange={setFilter}
        statusColor={statusColor}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(filtered.length === 0 ? V_ORDERS : filtered).map(order => (
          <div key={order.id} style={{
            padding: '14px 16px', borderRadius: Z.r.md, background: Z.surface,
            border: `1px solid ${Z.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{order.buyer}</span>
              <span style={{
                fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '4px 10px',
                borderRadius: 20, background: (statusColor[order.status] || Z.orange) + '18',
                color: statusColor[order.status] || Z.orange,
              }}>{order.status}</span>
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginBottom: 8 }}>{order.items}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.orangeDark }}>Bs {order.total.toLocaleString()}</span>
              {['Pendiente', 'Confirmado', 'Listo'].includes(order.status) && (
                <button onClick={() => setSelectedOrder(order)} style={{
                  padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: Z.orangeDark, color: '#fff', outline: 'none',
                  fontFamily: Z.font, fontSize: 11, fontWeight: 700,
                }}>Gestionar Logística</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Logística Sub-screen ─────────────────────────────────────────────────────
function LogisticaScreen({ order, onBack }) {
  const [mode, setMode] = React.useState(null);
  const [driver, setDriver] = React.useState('');
  const [plate, setPlate] = React.useState('');

  return (
    <ZScreen bg={Z.bg}>
      <ZHeader title="Gestionar Logística" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ padding: '14px', borderRadius: Z.r.md, background: Z.orangeLight, border: `1px solid ${Z.orangePastel}` }}>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark }}>Pedido: {order.buyer}</div>
          <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>{order.items} · Bs {order.total.toLocaleString()}</div>
        </div>

        <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>Selecciona modalidad de entrega:</div>

        {[
          { key: 'retiro', icon: '🏪', title: 'Retiro en Tienda', desc: 'El cliente retira su pedido. Se genera un código QR.', color: Z.blue },
          { key: 'flota', icon: '🚚', title: 'Enviar con mi Flota', desc: 'Asigna uno de tus repartidores con nombre y placa.', color: Z.orange },
          { key: 'app', icon: '📱', title: 'Solicitar Repartidor App', desc: 'ZITEO busca el conductor más cercano con capacidad de carga.', color: Z.orangeDark },
        ].map(opt => (
          <button key={opt.key} onClick={() => setMode(opt.key)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px',
            borderRadius: Z.r.md, border: `2px solid ${mode === opt.key ? opt.color : Z.border}`,
            background: mode === opt.key ? opt.color + '12' : Z.surface,
            cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none', transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 24 }}>{opt.icon}</span>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{opt.title}</div>
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 3, lineHeight: 1.4 }}>{opt.desc}</div>
            </div>
          </button>
        ))}

        {mode === 'retiro' && (
          <div style={{ padding: '20px', borderRadius: Z.r.md, background: Z.blueLight, textAlign: 'center', animation: 'zFadeSlideIn 0.2s ease' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 12, color: Z.blueDark, lineHeight: 1.8 }}>
              ████ ██ █████<br/>█  █ ██ █  █<br/>████ ██ █████<br/><br/>Código QR de Retiro<br/>Válido por 48hs
            </div>
            <ZButton variant="blue" style={{ marginTop: 12 }} onClick={onBack}>Notificar al Cliente</ZButton>
          </div>
        )}
        {mode === 'flota' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, animation: 'zFadeSlideIn 0.2s ease' }}>
            <ZInput label="Nombre del chofer" placeholder="Ej: Carlos Mamani" value={driver} onChange={setDriver} />
            <ZInput label="Placa del vehículo" placeholder="Ej: 3456-ABC" value={plate} onChange={setPlate} />
            <ZButton disabled={!driver || !plate} onClick={onBack}>Asignar y Despachar</ZButton>
          </div>
        )}
        {mode === 'app' && (
          <div style={{ padding: '16px', borderRadius: Z.r.md, background: Z.orangeLight, animation: 'zFadeSlideIn 0.2s ease' }}>
            <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.orangeDark, marginBottom: 6 }}>Filtro automático activo</div>
            <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, lineHeight: 1.5 }}>
              El sistema buscará vehículos pesados con capacidad mínima de carga para este pedido. Los conductores de moto serán excluidos automáticamente.
            </div>
            <ZButton style={{ marginTop: 12 }} onClick={onBack}>Buscar Repartidor Ahora</ZButton>
          </div>
        )}
      </div>
    </ZScreen>
  );
}

// ── Cotizaciones Tab ─────────────────────────────────────────────────────────
function CotizacionesTabVendedor() {
  const [tab, setTab] = React.useState('Solicitudes');
  const [offerModal, setOfferModal] = React.useState(null);
  const [offerPrice, setOfferPrice] = React.useState('');

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Cotizaciones</h2>
      <FilterBar options={['Solicitudes', 'Enviadas', 'Historial']} active={tab} onChange={setTab} />

      {offerModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 30,
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{ background: Z.surface, borderRadius: '20px 20px 0 0', padding: '24px 20px', width: '100%', animation: 'zFadeSlideIn 0.25s ease' }}>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text, marginBottom: 16 }}>Hacer Oferta</div>
            <div style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, marginBottom: 14 }}>Para: <strong>{offerModal.buyer}</strong></div>
            <ZInput label="Precio total (Bs)" type="number" placeholder="Ej: 12500" value={offerPrice} onChange={setOfferPrice} />
            <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, marginTop: 8, marginBottom: 16 }}>
              La oferta tendrá validez de 48 horas. El cliente podrá aceptar, rechazar o contraofertar.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <ZButton variant="secondary" fullWidth={true} onClick={() => setOfferModal(null)}>Cancelar</ZButton>
              <ZButton disabled={!offerPrice} fullWidth={true} onClick={() => { setOfferModal(null); setOfferPrice(''); }}>Enviar Oferta</ZButton>
            </div>
          </div>
        </div>
      )}

      {tab === 'Solicitudes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {V_QUOTES.map(q => (
            <div key={q.id} style={{ padding: '16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{q.buyer}</span>
                <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textMuted }}>{q.city}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {q.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: Z.orange }} />
                    <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.blue }}>📅 {q.when}</span>
                <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textSec }}>💳 {q.payment}</span>
              </div>
              <ZButton onClick={() => setOfferModal(q)}>Hacer Oferta</ZButton>
            </div>
          ))}
        </div>
      )}

      {tab === 'Enviadas' && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <VNavIconQuotes color={Z.textMuted} size={40} />
          <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>No hay cotizaciones enviadas recientemente</p>
        </div>
      )}

      {tab === 'Historial' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ActivityItem title="Obra Los Pinos — Aceptada" subtitle="Bs 10,800 · Cotización ganada" time="Hace 3d" color={Z.success} />
          <ActivityItem title="Empresa Construmax — Rechazada" subtitle="Bs 8,500 · Cliente eligió otro proveedor" time="Hace 5d" color={Z.error} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  RoleDashNav,
  VNavIconInventory, VNavIconOrders, VNavIconQuotes,
  HomeTabVendedor, InventarioTab, PedidosTabVendedor, LogisticaScreen, CotizacionesTabVendedor,
});
