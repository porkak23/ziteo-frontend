
// ziteo-trabajador-tabs.jsx — Trabajador/Maestro Dashboard: 4 tabs

// ── Worker-specific Nav Icons ───────────────────────────────────────────────
function WNavIconBriefcase({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="1.8" fill="none"/>
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke={color} strokeWidth="1.8"/>
    <line x1="12" y1="12" x2="12" y2="12.01" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M2 12h9m11 0h-4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>);
}
function WNavIconHardhat({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2a9 9 0 018.66 6.5H3.34A9 9 0 0112 2z" stroke={color} strokeWidth="1.8" fill="none"/>
    <path d="M2 12h20M2 15h20" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M5 19h14a1 1 0 001-1v-3H4v3a1 1 0 001 1z" stroke={color} strokeWidth="1.8" fill="none"/>
  </svg>);
}
function WNavIconUser({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" fill="none"/>
  </svg>);
}

// ── Sample Data ─────────────────────────────────────────────────────────────
const W_REQUESTS = [
  { id: 1, title: 'Albañilería segundo piso', client: 'Juan Mamani', location: 'Zona Norte, SC', budget: 3000, time: '15 días', photos: 2, desc: 'Necesito maestro albañil para levantar paredes del segundo piso. Material disponible. Empezar esta semana.', urgent: true },
  { id: 2, title: 'Reparación de techo filtraciones', client: 'María López', location: 'Zona Sur, SC', budget: 800, time: '3 días', photos: 1, desc: 'Techo de calamina con filtraciones en 3 puntos. Hay que revisar y sellar.', urgent: false },
  { id: 3, title: 'Instalación de pisos cerámicos', client: 'Pedro Quispe', location: 'Centro, SC', budget: 1500, time: '7 días', photos: 3, desc: 'Colocación de cerámica 60x60 en sala, comedor y pasillo. Aprox 80m².', urgent: false },
  { id: 4, title: 'Acabados interiores departamento', client: 'Arq. Torres', location: 'Norte, SC', budget: 5500, time: '30 días', photos: 4, desc: 'Enlucido, empastado y pintura de departamento completo. 3 ambientes.', urgent: true },
];
const W_PROJECTS = [
  {
    id: 1, name: 'Casa Norte', client: 'Juan Mamani', progress: 60,
    checklist: [
      { label: 'Excavación y nivelación', done: true },
      { label: 'Columnas y vigas', done: true },
      { label: 'Paredes primer piso', done: true },
      { label: 'Paredes segundo piso', done: false },
      { label: 'Enlucido interior', done: false },
      { label: 'Acabados finales', done: false },
    ],
    budget: 3000, start: '01 Mar',
  },
  {
    id: 2, name: 'Reparación Techo', client: 'María López', progress: 30,
    checklist: [
      { label: 'Inspección y diagnóstico', done: true },
      { label: 'Retiro material dañado', done: false },
      { label: 'Sellado y colocación', done: false },
    ],
    budget: 800, start: '12 Mar',
  },
];
const W_REVIEWS = [
  { client: 'Carlos Méndez', rating: 5, work: 'Albañilería casa familiar', date: 'Hace 2 semanas' },
  { client: 'Rosa Flores', rating: 5, work: 'Remodelación cocina', date: 'Hace 1 mes' },
  { client: 'Jorge Salinas', rating: 4, work: 'Construcción muro perimetral', date: 'Hace 2 meses' },
  { client: 'Ana Torres', rating: 5, work: 'Acabados departamento', date: 'Hace 3 meses' },
  { client: 'Pedro Condori', rating: 4, work: 'Segundo piso vivienda', date: 'Hace 3 meses' },
];

// ── Home Tab Trabajador ─────────────────────────────────────────────────────
function HomeTabTrabajador({ onNavigate }) {
  const [isActive, setIsActive] = React.useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div style={{ padding: '0 0 20px', display: 'flex', flexDirection: 'column' }}>
      {/* Active / Inactive toggle section */}
      <div style={{
        padding: '20px 20px 24px', margin: '0 0 20px',
        background: isActive
          ? `linear-gradient(160deg, ${Z.orangeLight} 0%, #fff9f5 100%)`
          : `linear-gradient(160deg, ${Z.divider} 0%, ${Z.bg} 100%)`,
        transition: 'background 0.5s',
        borderBottom: `1px solid ${Z.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 20, color: Z.text, margin: 0 }}>
              {greeting}, Miguel
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <ZIcon name="map-pin" size={12} color={Z.textMuted} />
              <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>Santa Cruz · Maestro Albañil</span>
            </div>
          </div>
          {/* Big active toggle */}
          <div onClick={() => setIsActive(!isActive)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer',
          }}>
            <div style={{
              width: 60, height: 32, borderRadius: 16, padding: 3, cursor: 'pointer',
              background: isActive ? Z.orange : Z.border, transition: 'background 0.3s',
              display: 'flex', alignItems: 'center', boxShadow: isActive ? `0 2px 12px rgba(232,115,58,0.3)` : 'none',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s',
                transform: isActive ? 'translateX(28px)' : 'translateX(0)',
              }} />
            </div>
            <span style={{
              fontFamily: Z.font, fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
              color: isActive ? Z.orangeDark : Z.textMuted,
            }}>{isActive ? 'ACTIVO' : 'INACTIVO'}</span>
          </div>
        </div>

        {/* Status indicator */}
        <div style={{
          padding: '12px 14px', borderRadius: Z.r.md,
          background: isActive ? Z.orangeLight : Z.surface,
          border: `1px solid ${isActive ? Z.orange : Z.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: isActive ? Z.orange : Z.textMuted,
            boxShadow: isActive ? `0 0 0 3px rgba(232,115,58,0.2)` : 'none',
          }} />
          <span style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: isActive ? Z.orangeDark : Z.textMuted }}>
            {isActive ? 'Recibiendo solicitudes de trabajo' : 'No estás recibiendo solicitudes'}
          </span>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <SummaryCard
            icon={<IconStar color="#F59E0B" size={18} />}
            label="Calificación" value="4.8" color="#F59E0B"
          />
          <SummaryCard
            icon={<WNavIconHardhat color={Z.blue} size={17} />}
            label="Trabajos mes" value="5" color={Z.blue}
          />
          <SummaryCard
            icon={<svg width="17" height="17" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>}
            label="Ganancias" value="12.5k" color={Z.orange}
          />
        </div>

        {/* Upcoming work today */}
        <div>
          <SectionTitle title="Agenda de Hoy" />
          <div style={{ marginTop: 10 }}>
            {W_PROJECTS.slice(0, 1).map(p => (
              <button key={p.id} onClick={() => onNavigate('proyectos')} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px',
                borderRadius: Z.r.md, border: `2px solid ${Z.orange}`,
                background: Z.orangeLight, width: '100%', cursor: 'pointer', outline: 'none', textAlign: 'left',
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: Z.gradOrange,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <WNavIconHardhat color="#fff" size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{p.name}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 2 }}>{p.client} · {p.progress}% completado</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M9 18l6-6-6-6" stroke={Z.orangeDark} strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* New requests */}
        <div>
          <SectionTitle title="Nuevas Solicitudes" action={`${W_REQUESTS.length} disponibles`} onAction={() => onNavigate('licitaciones')} />
          <div style={{ marginTop: 8 }}>
            {W_REQUESTS.slice(0, 2).map(r => (
              <ActivityItem key={r.id}
                title={r.title + (r.urgent ? ' 🔥' : '')}
                subtitle={r.client + ' · Bs ' + r.budget.toLocaleString()}
                time={r.location.split(',')[0]}
                color={r.urgent ? Z.orange : Z.blue}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Licitaciones Tab Trabajador ──────────────────────────────────────────────
function LicitacionesTabTrabajador() {
  const [filter, setFilter] = React.useState('Nuevas');
  const [selected, setSelected] = React.useState(null);
  const [offerAmt, setOfferAmt] = React.useState('');

  if (selected) {
    return (
      <ZScreen bg={Z.bg}>
        <ZHeader title="Solicitud de Trabajo" onBack={() => setSelected(null)} />
        <div style={{ flex: 1, padding: '8px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Photo placeholders */}
          {selected.photos > 0 && (
            <div style={{ display: 'flex', gap: 8 }}>
              {Array.from({ length: Math.min(selected.photos, 3) }, (_, i) => (
                <div key={i} style={{
                  flex: 1, height: 90, borderRadius: Z.r.sm,
                  background: `linear-gradient(135deg, ${Z.divider}, ${i % 2 ? Z.orangeLight : Z.blueLight})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'monospace', fontSize: 9, color: Z.textMuted,
                }}>foto {i + 1}</div>
              ))}
            </div>
          )}
          <div>
            <h3 style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>{selected.title}</h3>
            <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '8px 0 0', lineHeight: 1.5 }}>{selected.desc}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { icon: '👤', val: selected.client },
              { icon: '📍', val: selected.location },
              { icon: '💰', val: `Bs ${selected.budget.toLocaleString()}` },
              { icon: '📅', val: selected.time },
            ].map(d => (
              <div key={d.val} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
                borderRadius: Z.r.sm, background: Z.surface, border: `1px solid ${Z.border}`,
                fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.text,
              }}>{d.icon} {d.val}</div>
            ))}
          </div>
          {/* Offer form */}
          <div style={{ padding: '16px', borderRadius: Z.r.md, background: Z.orangeLight, border: `1px solid ${Z.orangePastel}` }}>
            <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.orangeDark, marginBottom: 12 }}>Tu oferta económica (Bs)</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px',
                borderRadius: Z.r.sm, background: Z.surface, border: `1.5px solid ${Z.orange}`,
              }}>
                <span style={{ fontFamily: Z.font, fontWeight: 700, color: Z.textSec }}>Bs</span>
                <input type="number" value={offerAmt} onChange={e => setOfferAmt(e.target.value)}
                  placeholder="0.00"
                  style={{ flex: 1, border: 'none', outline: 'none', fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.orangeDark, background: 'transparent' }}
                />
              </div>
            </div>
            <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 8 }}>
              El cliente propone: <strong>Bs {selected.budget.toLocaleString()}</strong>
            </div>
          </div>
          <ZButton disabled={!offerAmt} onClick={() => setSelected(null)}>
            Enviar Oferta
          </ZButton>
          <ZButton variant="secondary" onClick={() => setSelected(null)}>No me interesa</ZButton>
        </div>
      </ZScreen>
    );
  }

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Licitaciones</h2>
      <FilterBar options={['Nuevas', 'Enviadas', 'Historial']} active={filter} onChange={setFilter} />

      {filter === 'Nuevas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {W_REQUESTS.map(r => (
            <button key={r.id} onClick={() => setSelected(r)} style={{
              display: 'flex', flexDirection: 'column', gap: 10, padding: '16px',
              borderRadius: Z.r.md, background: Z.surface, border: `1.5px solid ${r.urgent ? Z.orange : Z.border}`,
              cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none', transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{r.title}</span>
                    {r.urgent && <span style={{ fontFamily: Z.font, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: Z.orangeLight, color: Z.orangeDark }}>URGENTE</span>}
                  </div>
                  <span style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2, display: 'block' }}>{r.client}</span>
                </div>
                {r.photos > 0 && (
                  <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.blue, fontWeight: 600, flexShrink: 0 }}>📸 {r.photos}</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec }}>📍 {r.location}</span>
                <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.orangeDark }}>Bs {r.budget.toLocaleString()}</span>
                <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>⏱ {r.time}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {filter !== 'Nuevas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ActivityItem title="Casa Norte — Oferta aceptada" subtitle="Bs 3,000 · Juan Mamani" time="Hace 3d" color={Z.success} />
          <ActivityItem title="Techo López — Oferta enviada" subtitle="Bs 850 · Esperando respuesta" time="Hoy" color={Z.blue} />
          {filter === 'Historial' && <>
            <ActivityItem title="Empresa Salinas — Rechazada" subtitle="Bs 4,500 · Eligieron otra persona" time="Hace 1 sem" color={Z.error} />
          </>}
        </div>
      )}
    </div>
  );
}

// ── Proyectos Tab Trabajador ─────────────────────────────────────────────────
function ProyectosTabTrabajador() {
  const [selectedProject, setSelectedProject] = React.useState(null);
  const [checklist, setChecklist] = React.useState(W_PROJECTS.map(p => p.checklist));

  const toggleItem = (projIdx, itemIdx) => {
    setChecklist(prev => prev.map((cl, pi) =>
      pi === projIdx ? cl.map((item, ii) => ii === itemIdx ? { ...item, done: !item.done } : item) : cl
    ));
  };

  const getProgress = (cl) => {
    const done = cl.filter(i => i.done).length;
    return Math.round((done / cl.length) * 100);
  };

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Proyectos en Curso</h2>

      {W_PROJECTS.map((project, pIdx) => {
        const cl = checklist[pIdx];
        const pct = getProgress(cl);
        const isOpen = selectedProject === project.id;
        return (
          <div key={project.id} style={{
            borderRadius: Z.r.md, background: Z.surface, border: `1.5px solid ${Z.border}`, overflow: 'hidden',
          }}>
            <button onClick={() => setSelectedProject(isOpen ? null : project.id)} style={{
              width: '100%', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12,
              border: 'none', background: 'transparent', cursor: 'pointer', outline: 'none', textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 800, color: Z.text }}>{project.name}</span>
                  <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>{project.client} · desde {project.start}</div>
                </div>
                <span style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.orangeDark }}>{pct}%</span>
              </div>
              {/* Progress bar */}
              <div style={{ height: 8, borderRadius: 4, background: Z.divider, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4, width: `${pct}%`,
                  background: `linear-gradient(90deg, ${Z.orange}, ${Z.orangeDark})`,
                  transition: 'width 0.5s',
                }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec }}>
                  {cl.filter(i => i.done).length}/{cl.length} hitos
                </span>
                <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.orangeDark }}>Bs {project.budget.toLocaleString()}</span>
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: '0 16px 16px', borderTop: `1px solid ${Z.divider}`, animation: 'zFadeSlideIn 0.2s ease' }}>
                {/* Checklist */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, marginBottom: 14 }}>
                  {cl.map((item, iIdx) => (
                    <button key={iIdx} onClick={() => toggleItem(pIdx, iIdx)} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: Z.r.sm, border: 'none', background: item.done ? Z.orangeLight : Z.divider,
                      cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none', transition: 'all 0.2s',
                    }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                        background: item.done ? Z.orange : Z.surface,
                        border: `2px solid ${item.done ? Z.orange : Z.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {item.done && <ZIcon name="check" size={13} color="#fff" />}
                      </div>
                      <span style={{
                        fontFamily: Z.font, fontSize: 13, fontWeight: 500,
                        color: item.done ? Z.textSec : Z.text,
                        textDecoration: item.done ? 'line-through' : 'none',
                      }}>{item.label}</span>
                    </button>
                  ))}
                </div>
                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
                    background: Z.surface, cursor: 'pointer', outline: 'none',
                    fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec,
                  }}>
                    <NavIconMsg color={Z.textSec} size={16} /> Chat
                  </button>
                  <button style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', borderRadius: Z.r.sm, border: 'none',
                    background: Z.orangeDark, cursor: 'pointer', outline: 'none',
                    fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: '#fff',
                  }}>
                    Actualizar
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Perfil Tab Trabajador ────────────────────────────────────────────────────
function PerfilTabTrabajador() {
  const avgRating = (W_REVIEWS.reduce((s, r) => s + r.rating, 0) / W_REVIEWS.length).toFixed(1);
  const skills = ['Albañilería', 'Obra gruesa', 'Acabados', 'Lectura de planos', 'Impermeabilización'];
  const tools = ['Rotomartillo', 'Mezcladora', 'Andamios', 'Nivel láser', 'Andamio metálico'];
  const certs = [{ title: 'COSUDE Construcción', year: '2022' }, { title: 'INFOCAL Técnico', year: '2019' }];

  return (
    <div style={{ overflowY: 'auto', paddingBottom: 20 }}>
      {/* Profile header */}
      <div style={{
        padding: '24px 20px 20px', background: `linear-gradient(180deg, ${Z.orangeLight} 0%, ${Z.bg} 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 4,
      }}>
        <ZAvatar name="Miguel Quispe" size={84} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <h3 style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>Miguel Quispe</h3>
            <IconVerified size={18} />
          </div>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>Maestro Albañil · 12 años exp.</p>
          <p style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, margin: '2px 0 0' }}>Santa Cruz, Bolivia</p>
        </div>
        {/* Rating summary */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
          borderRadius: Z.r.full, background: Z.surface, border: `1px solid ${Z.border}`,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 28, fontWeight: 800, color: Z.text }}>{avgRating}</div>
            <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {[1,2,3,4,5].map(i => <IconStar key={i} color={i <= Math.round(parseFloat(avgRating)) ? '#F59E0B' : Z.border} size={14} />)}
            </div>
          </div>
          <div style={{ width: 1, height: 40, background: Z.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text }}>47</div>
            <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, fontWeight: 500 }}>trabajos</div>
          </div>
          <div style={{ width: 1, height: 40, background: Z.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text }}>98%</div>
            <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted, fontWeight: 500 }}>éxito</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Portfolio */}
        <div>
          <SectionTitle title="Portafolio" />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {[
              { label: 'Antes', bg: `linear-gradient(135deg, ${Z.divider}, #e2cfc3)` },
              { label: 'Después', bg: `linear-gradient(135deg, ${Z.orangeLight}, #f5e6da)` },
              { label: 'Proyecto', bg: `linear-gradient(135deg, ${Z.blueLight}, #d4e6ff)` },
            ].map((p, i) => (
              <div key={i} style={{
                flex: 1, height: 90, borderRadius: Z.r.sm, background: p.bg,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', padding: 6,
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: 8, color: Z.textMuted, background: 'rgba(255,255,255,0.6)', padding: '2px 5px', borderRadius: 4 }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <SectionTitle title="Habilidades" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {skills.map(s => (
              <span key={s} style={{
                fontFamily: Z.font, fontSize: 12, fontWeight: 600, padding: '7px 14px',
                borderRadius: 20, background: Z.orangeLight, color: Z.orangeDark,
              }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div>
          <SectionTitle title="Herramientas Propias" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {tools.map(t => (
              <span key={t} style={{
                fontFamily: Z.font, fontSize: 12, fontWeight: 600, padding: '7px 14px',
                borderRadius: 20, background: Z.blueLight, color: Z.blueDark,
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <SectionTitle title="Certificaciones" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {certs.map(c => (
              <div key={c.title} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: Z.r.sm, background: Z.surface, border: `1px solid ${Z.border}`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: Z.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎓</div>
                <div>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{c.title}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted }}>{c.year}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews (stars only) */}
        <div>
          <SectionTitle title={`Reseñas (${W_REVIEWS.length})`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {W_REVIEWS.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderRadius: Z.r.sm, background: Z.surface, border: `1px solid ${Z.border}`,
              }}>
                <div>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{r.client}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, marginTop: 2 }}>{r.work}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1,2,3,4,5].map(s => <IconStar key={s} color={s <= r.rating ? '#F59E0B' : Z.border} size={13} />)}
                  </div>
                  <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  WNavIconBriefcase, WNavIconHardhat, WNavIconUser,
  HomeTabTrabajador, LicitacionesTabTrabajador, ProyectosTabTrabajador, PerfilTabTrabajador,
});
