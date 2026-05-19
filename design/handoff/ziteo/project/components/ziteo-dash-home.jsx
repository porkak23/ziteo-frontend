
// ziteo-dash-home.jsx — Home tab + Transport sub-screen + Worker search/profile

// ── Home Tab ────────────────────────────────────────────────────────────────
function HomeTab({ onNavigate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Greeting */}
      <div>
        <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 22, color: Z.text, margin: 0 }}>
          {greeting}, Juan Carlos
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <ZIcon name="map-pin" size={14} color={Z.textMuted} />
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textSec }}>
            Santa Cruz · Constructor
          </span>
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px',
        borderRadius: Z.r.md, background: Z.surface, border: `1.5px solid ${Z.border}`,
      }}>
        <ZIcon name="search" size={18} color={Z.textMuted} />
        <span style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, fontWeight: 400 }}>
          Buscar materiales, trabajadores...
        </span>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Big CTA - Tienda */}
        <button onClick={() => onNavigate('tienda')} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px',
          borderRadius: Z.r.lg, border: 'none', cursor: 'pointer', width: '100%',
          background: `linear-gradient(135deg, ${Z.orangeDark} 0%, ${Z.orange} 100%)`,
          boxShadow: '0 4px 16px rgba(164,55,0,0.25)', textAlign: 'left', outline: 'none',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <NavIconStore color="#fff" size={24} />
          </div>
          <div>
            <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: '#fff' }}>Ir a la Tienda</div>
            <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
              Materiales, herramientas y más
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>

        {/* Transport CTA */}
        <button onClick={() => onNavigate('transporte')} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
          borderRadius: Z.r.lg, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
          width: '100%', background: Z.surface, textAlign: 'left', outline: 'none',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, background: Z.blueLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <NavIconTruck color={Z.blueDark} size={22} />
          </div>
          <div>
            <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>Solicitar Transporte</div>
            <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 500, color: Z.textMuted, marginTop: 1 }}>
              Camiones, volquetas y motos
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginLeft: 'auto' }}>
            <path d="M9 18l6-6-6-6" stroke={Z.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>

        {/* Two-button row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => onNavigate('nuevo-proyecto')} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px',
            borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
            background: Z.surface, textAlign: 'left', outline: 'none',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: Z.orangeLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <NavIconPlus color={Z.orangeDark} size={16} />
            </div>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.text }}>Nuevo</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>Proyecto</div>
            </div>
          </button>

          <button onClick={() => onNavigate('contratar')} style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '14px',
            borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`, cursor: 'pointer',
            background: Z.surface, textAlign: 'left', outline: 'none',
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: Z.blueLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <NavIconUsers color={Z.blueDark} size={16} />
            </div>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.text }}>Contratar</div>
              <div style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 500, color: Z.textMuted }}>Maestros</div>
            </div>
          </button>
        </div>
      </div>

      {/* Summary */}
      <div>
        <SectionTitle title="Resumen" />
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <SummaryCard
            icon={<NavIconCart color={Z.orange} size={18} />}
            label="Pedidos pendientes" value="3" color={Z.orange}
          />
          <SummaryCard
            icon={<NavIconProjects color={Z.blue} size={18} />}
            label="Proyectos activos" value="2" color={Z.blue}
          />
          <SummaryCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>}
            label="Gasto del mes" value="15.4k" color={Z.orange}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <SectionTitle title="Actividad Reciente" action="Ver todo" />
        <div style={{ marginTop: 8 }}>
          <ActivityItem
            title="50 bolsas de Cemento IP-30"
            subtitle="Pedido confirmado · Ferretería San José"
            time="Hace 2h" color={Z.orange}
          />
          <ActivityItem
            title="Licitación: Electricista para obra"
            subtitle="3 nuevas ofertas recibidas"
            time="Hace 5h" color={Z.blue}
          />
          <ActivityItem
            title="Proyecto 'Casa Norte' actualizado"
            subtitle="Nuevo pedido de materiales agregado"
            time="Ayer" color={Z.orange}
          />
          <ActivityItem
            title="Recojo de escombros completado"
            subtitle="Camión volqueta · Zona Norte"
            time="Hace 3d" color={Z.textMuted}
          />
        </div>
      </div>
    </div>
  );
}

// ── Transport Request Sub-screen ────────────────────────────────────────────
function TransportScreen({ onBack }) {
  const [type, setType] = React.useState('');
  const [desc, setDesc] = React.useState('');

  return (
    <ZScreen bg={Z.bg}>
      <ZHeader title="Solicitar Transporte" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
        <div>
          <h3 style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.text, margin: 0 }}>
            Tipo de transporte
          </h3>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>
            Selecciona según tu carga
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'pesado', title: 'Transporte Pesado', desc: 'Camiones, volquetas', icon: <NavIconTruck color={type === 'pesado' ? Z.orangeDark : Z.textSec} size={28} /> },
            { key: 'ligero', title: 'Transporte Ligero', desc: 'Motos, camionetas', icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><rect x="2" y="8" width="13" height="9" rx="1.5" stroke={type === 'ligero' ? Z.orangeDark : Z.textSec} strokeWidth="1.8" fill="none"/><circle cx="6" cy="18" r="2" stroke={type === 'ligero' ? Z.orangeDark : Z.textSec} strokeWidth="1.8" fill="none"/><circle cx="18" cy="18" r="2" stroke={type === 'ligero' ? Z.orangeDark : Z.textSec} strokeWidth="1.8" fill="none"/><path d="M15 11h3l3 3v3h-6" stroke={type === 'ligero' ? Z.orangeDark : Z.textSec} strokeWidth="1.8" fill="none"/></svg> },
          ].map(opt => (
            <button key={opt.key} onClick={() => setType(opt.key)} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
              borderRadius: Z.r.md, border: `2px solid ${type === opt.key ? Z.orange : Z.border}`,
              background: type === opt.key ? Z.orangeLight : Z.surface,
              cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none',
              transition: 'all 0.2s',
            }}>
              {opt.icon}
              <div>
                <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>{opt.title}</div>
                <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>{opt.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Map placeholder */}
        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 8 }}>
            Ubicación de entrega
          </label>
          <div style={{
            height: 140, borderRadius: Z.r.md, border: `1.5px dashed ${Z.border}`,
            background: `linear-gradient(135deg, ${Z.blueLight} 0%, ${Z.divider} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8,
          }}>
            <ZIcon name="map-pin" size={28} color={Z.blue} />
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: Z.textMuted }}>mapa interactivo</span>
          </div>
        </div>

        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 8 }}>
            Descripción de la carga *
          </label>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Ej: 100 bolsas de cemento IP-30, peso aprox. 5000kg"
            style={{
              width: '100%', height: 80, borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
              padding: 14, fontFamily: Z.font, fontSize: 14, color: Z.text,
              resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <ZButton disabled={!type || !desc} onClick={() => { alert('Solicitud enviada'); onBack(); }}>
          Solicitar Transporte
        </ZButton>
      </div>
    </ZScreen>
  );
}

// ── Worker Search Sub-screen ────────────────────────────────────────────────
function WorkerSearchScreen({ onBack }) {
  const [filter, setFilter] = React.useState('Disponibles hoy');
  const [selectedWorker, setSelectedWorker] = React.useState(null);

  const filters = ['Disponibles hoy', 'Albañiles', 'Plomeros', 'Electricistas', 'Carpinteros'];
  const workers = [
    { name: 'Miguel Quispe', specialty: 'Maestro Albañil', experience: '12 años', rating: 4.8, verified: true },
    { name: 'Roberto Flores', specialty: 'Electricista', experience: '8 años', rating: 4.9, verified: true },
    { name: 'Carlos Mamani', specialty: 'Plomero', experience: '15 años', rating: 4.7, verified: true },
    { name: 'Pedro Condori', specialty: 'Carpintero', experience: '10 años', rating: 4.6, verified: false },
    { name: 'Luis Vargas', specialty: 'Soldador', experience: '6 años', rating: 4.5, verified: true },
  ];

  if (selectedWorker) {
    return <WorkerProfileScreen worker={selectedWorker} onBack={() => setSelectedWorker(null)} />;
  }

  return (
    <ZScreen bg={Z.bg}>
      <ZHeader title="Contratar Maestros" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          borderRadius: Z.r.sm, background: Z.surface, border: `1.5px solid ${Z.border}`,
        }}>
          <ZIcon name="search" size={18} color={Z.textMuted} />
          <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted }}>Buscar por nombre o especialidad</span>
        </div>

        {/* Filter bubbles */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontFamily: Z.font, fontSize: 11, fontWeight: filter === f ? 700 : 500,
              padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              background: filter === f ? Z.orangeDark : Z.surface,
              color: filter === f ? '#fff' : Z.textSec,
              whiteSpace: 'nowrap', outline: 'none',
              boxShadow: filter === f ? 'none' : `0 0 0 1px ${Z.border}`,
            }}>{f}</button>
          ))}
        </div>

        {/* Worker list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {workers.map((w, i) => (
            <WorkerCard key={i} {...w} onTap={() => setSelectedWorker(w)} />
          ))}
        </div>
      </div>
    </ZScreen>
  );
}

// ── Worker Profile Sub-screen ───────────────────────────────────────────────
function WorkerProfileScreen({ worker, onBack }) {
  return (
    <ZScreen bg={Z.bg}>
      <ZHeader onBack={onBack} />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Banner placeholder */}
        <div style={{
          height: 140, margin: '0 20px', borderRadius: Z.r.lg, overflow: 'hidden',
          background: `linear-gradient(135deg, #2D1B0E 0%, #1A1520 60%, #0D1530 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.3)',
        }}>foto de trabajo destacado</div>

        {/* Profile info */}
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>{worker.name}</h3>
            {worker.verified && <IconVerified size={18} />}
          </div>
          <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: 0 }}>
            {worker.specialty} · {worker.experience}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            {[1,2,3,4,5].map(i => <IconStar key={i} color={i <= Math.round(worker.rating) ? '#F59E0B' : Z.border} size={16} />)}
            <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text, marginLeft: 4 }}>{worker.rating}</span>
          </div>
        </div>

        {/* Gallery placeholder */}
        <div style={{ padding: '20px 20px 0' }}>
          <SectionTitle title="Portafolio" />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto' }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                width: 110, height: 90, borderRadius: Z.r.sm, flexShrink: 0,
                background: `linear-gradient(135deg, ${Z.divider}, ${i % 2 ? Z.orangeLight : Z.blueLight})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'monospace', fontSize: 9, color: Z.textMuted,
              }}>proyecto {i}</div>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div style={{ padding: '20px 20px 0' }}>
          <SectionTitle title="Herramientas Propias" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {['Rotomartillo', 'Mezcladora', 'Andamios', 'Nivel láser'].map(t => (
              <span key={t} style={{
                fontFamily: Z.font, fontSize: 11, fontWeight: 600, padding: '6px 14px',
                borderRadius: 20, background: Z.blueLight, color: Z.blueDark,
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div style={{ padding: '20px 20px 0' }}>
          <SectionTitle title="Habilidades" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {['Albañilería', 'Obra gruesa', 'Acabados', 'Lectura de planos'].map(s => (
              <span key={s} style={{
                fontFamily: Z.font, fontSize: 11, fontWeight: 600, padding: '6px 14px',
                borderRadius: 20, background: Z.orangeLight, color: Z.orangeDark,
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Contact button */}
        <div style={{ padding: '24px 20px 32px' }}>
          <ZButton variant="blue" onClick={() => {}} icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012 4.1 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.6a2 2 0 01-.4 2.1L8 9.7a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.8.3 1.7.5 2.6.7a2 2 0 011.7 2z" stroke="#fff" strokeWidth="1.8" fill="none"/>
            </svg>
          }>
            Contactar por WhatsApp
          </ZButton>
          <button style={{
            width: '100%', marginTop: 10, padding: '10px', border: 'none',
            background: 'transparent', cursor: 'pointer', outline: 'none',
            fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textMuted,
          }}>Reportar Contratación</button>
        </div>
      </div>
    </ZScreen>
  );
}

Object.assign(window, {
  HomeTab, TransportScreen, WorkerSearchScreen, WorkerProfileScreen,
});
