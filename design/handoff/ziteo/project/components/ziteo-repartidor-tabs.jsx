
// ziteo-repartidor-tabs.jsx — Repartidor Dashboard: Radar, Pedidos, Ganancias, Perfil

// ── Nav Icons ───────────────────────────────────────────────────────────────
function RNavIconUser({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
    <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8" fill="none"/>
  </svg>);
}
function RNavIconRadar({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="2" fill={color}/>
    <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke={color} strokeWidth="1.8" opacity="0.3" fill="none"/>
    <path d="M12 6a6 6 0 100 12A6 6 0 0012 6z" stroke={color} strokeWidth="1.8" opacity="0.6" fill="none"/>
    <path d="M12 10v-8M12 10l5-7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>);
}
function RNavIconEarnings({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
  </svg>);
}
function RNavIconList({ color = '#94A3B8', size = 22 }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>);
}

// ── Fake Map (SVG) ──────────────────────────────────────────────────────────
function FakeMap({ mode, vehicleType, jobs = [], activeJob = null, onJobPress }) {
  const isOffline = mode === 'offline';
  const w = 402, h = 370;

  // Street colors
  const roadMain = isOffline ? '#D0D0D0' : '#E8EDF2';
  const roadSec = isOffline ? '#E0E0E0' : '#F1F4F7';
  const blockBg = isOffline ? '#EFEFEF' : '#F8F6F2';
  const blockAlt = isOffline ? '#E8E8E8' : '#F2F0EC';

  return (
    <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', transition: 'filter 0.5s', filter: isOffline ? 'grayscale(0.85)' : 'none' }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="heat1" cx="50%" cy="50%"><stop offset="0%" stopColor="#E8733A" stopOpacity="0.28"/><stop offset="100%" stopColor="#E8733A" stopOpacity="0"/></radialGradient>
          <radialGradient id="heat2" cx="50%" cy="50%"><stop offset="0%" stopColor="#E8733A" stopOpacity="0.18"/><stop offset="100%" stopColor="#E8733A" stopOpacity="0"/></radialGradient>
          <radialGradient id="heat3" cx="50%" cy="50%"><stop offset="0%" stopColor="#3A7BD5" stopOpacity="0.12"/><stop offset="100%" stopColor="#3A7BD5" stopOpacity="0"/></radialGradient>
        </defs>

        {/* Background */}
        <rect width={w} height={h} fill={blockBg}/>

        {/* City blocks */}
        {[[8,8,74,54],[90,8,74,54],[172,8,74,54],[254,8,74,54],[336,8,58,54],
          [8,70,74,54],[90,70,74,54],[172,70,74,54],[254,70,74,54],[336,70,58,54],
          [8,132,74,54],[90,132,74,54],[172,132,74,54],[254,132,74,54],[336,132,58,54],
          [8,194,74,54],[90,194,74,54],[172,194,74,54],[254,194,74,54],[336,194,58,54],
          [8,256,74,54],[90,256,74,54],[172,256,74,54],[254,256,74,54],[336,256,58,54],
          [8,318,74,44],[90,318,74,44],[172,318,74,44],[254,318,74,44],[336,318,58,44],
        ].map(([x,y,bw,bh], i) => (
          <rect key={i} x={x} y={y} width={bw} height={bh} rx="3" fill={i % 3 === 0 ? blockAlt : blockBg}/>
        ))}

        {/* Main horizontal roads */}
        {[64,126,188,250,312].map(y => <rect key={y} x="0" y={y} width={w} height="8" fill={roadMain}/>)}
        {/* Main vertical roads */}
        {[82,164,246,328].map(x => <rect key={x} x={x} y="0" width="10" height={h} fill={roadMain}/>)}
        {/* Secondary roads */}
        {[64,126,188,250,312].map(y => <rect key={'sh'+y} x="0" y={y+4} width={w} height="1" fill={roadSec}/>)}

        {/* Diagonal road (avenue) */}
        <line x1="0" y1={h} x2={w * 0.6} y2="0" stroke={roadMain} strokeWidth="8"/>

        {/* Round-about center */}
        <circle cx="246" cy="188" r="20" fill={roadMain}/>
        <circle cx="246" cy="188" r="13" fill={blockBg}/>

        {/* Heat zones (active construction areas) — only when online */}
        {!isOffline && <>
          <ellipse cx="130" cy="100" rx="70" ry="60" fill="url(#heat1)"/>
          <ellipse cx="300" cy="240" rx="65" ry="55" fill="url(#heat2)"/>
          <ellipse cx="80" cy="280" rx="50" ry="40" fill="url(#heat3)"/>
        </>}

        {/* Active job route */}
        {activeJob && (
          <path d={`M${activeJob.from[0]},${activeJob.from[1]} Q${(activeJob.from[0]+activeJob.to[0])/2},${activeJob.from[1]} ${activeJob.to[0]},${activeJob.to[1]}`}
            stroke="#A43700" strokeWidth="4" strokeDasharray="8 4" fill="none" strokeLinecap="round"/>
        )}

        {/* Job pins */}
        {!isOffline && jobs.map((job, i) => (
          <g key={i} onClick={() => onJobPress && onJobPress(job)} style={{ cursor: 'pointer' }}>
            <circle cx={job.x} cy={job.y} r="18" fill={job.type === 'heavy' ? Z.orange : Z.blue} opacity="0.15"/>
            <circle cx={job.x} cy={job.y} r="12" fill={job.type === 'heavy' ? Z.orange : Z.blue} opacity="0.9"/>
            <text x={job.x} y={job.y+4} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">{job.type === 'heavy' ? '🏗' : '⚡'}</text>
          </g>
        ))}

        {/* Active job markers */}
        {activeJob && <>
          <circle cx={activeJob.from[0]} cy={activeJob.from[1]} r="10" fill="#16A34A"/>
          <text x={activeJob.from[0]} y={activeJob.from[1]+4} textAnchor="middle" fontSize="9" fill="white">P</text>
          <circle cx={activeJob.to[0]} cy={activeJob.to[1]} r="10" fill={Z.orangeDark}/>
          <text x={activeJob.to[0]} y={activeJob.to[1]+4} textAnchor="middle" fontSize="9" fill="white">E</text>
        </>}
      </svg>

      {/* Driver position with pulse */}
      <div style={{
        position: 'absolute', left: 195, top: 175, transform: 'translate(-50%,-50%)',
        width: 24, height: 24, borderRadius: '50%',
        background: Z.orangeDark, border: '3px solid #fff',
        boxShadow: `0 0 0 0 rgba(232,115,58,0.5)`,
        animation: !isOffline ? 'driverPulse 1.5s ease-in-out infinite' : 'none',
        zIndex: 2,
      }} />

      {/* Vehicle label */}
      {!isOffline && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          padding: '5px 14px', borderRadius: 20, zIndex: 3,
          background: 'rgba(255,255,255,0.9)',
          fontFamily: Z.font, fontSize: 11, fontWeight: 700, color: Z.text,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {vehicleType === 'heavy' ? '🚛 Camión · Radio 20km' : '🏍 Moto · Radio 5km'}
        </div>
      )}
    </div>
  );
}

// ── Sample Data ─────────────────────────────────────────────────────────────
const MAP_JOBS = [
  { id: 1, x: 110, y: 90, type: 'heavy', title: '100 bolsas Cemento', from: 'Ferretería San José', to: 'Zona Norte', dist: '4.5 km', weight: '5,000 kg', pay: 150, time: '35 min' },
  { id: 2, x: 300, y: 230, type: 'heavy', title: 'Arena Fina 2m³', from: 'Cantera Sur', to: 'Los Pinos', dist: '8.2 km', weight: '3,000 kg', pay: 200, time: '50 min' },
  { id: 3, x: 70, y: 270, type: 'light', title: 'Herramientas Express', from: 'Ferretería Central', to: 'Zona Este', dist: '1.8 km', weight: '15 kg', pay: 45, time: '12 min' },
  { id: 4, x: 320, y: 100, type: 'heavy', title: '20 barras Fierro 12mm', from: 'Distribuidora Norte', to: 'Edificio Sur', dist: '6.0 km', weight: '200 kg', pay: 120, time: '40 min' },
];
const TRIP_HISTORY = [
  { id: 1, title: '50 bolsas Cemento', from: 'Ferretería San José', to: 'Zona Norte', pay: 80, date: 'Hoy 09:30', km: 4.5 },
  { id: 2, title: 'Herramientas Express', from: 'Central', to: 'Zona Este', pay: 45, date: 'Hoy 08:00', km: 1.8 },
  { id: 3, title: 'Arena 1m³', from: 'Cantera Sur', to: 'Centro', pay: 110, date: 'Ayer', km: 6.2 },
  { id: 4, title: '80 bolsas Cemento', from: 'Ferretería Norte', to: 'Los Pinos', pay: 130, date: 'Ayer', km: 5.1 },
];

// ── Radar Tab ────────────────────────────────────────────────────────────────
function RadarTab() {
  const [mode, setMode] = React.useState('offline'); // offline | online | active
  const [vehicleType, setVehicleType] = React.useState('heavy');
  const [selectedJob, setSelectedJob] = React.useState(null);
  const [activeJob, setActiveJob] = React.useState(null);
  const [deliveryStep, setDeliveryStep] = React.useState(0);
  const [showOfferPop, setShowOfferPop] = React.useState(false);

  // Auto-show a job offer when going online
  React.useEffect(() => {
    if (mode === 'online') {
      const t = setTimeout(() => setShowOfferPop(true), 2500);
      return () => clearTimeout(t);
    }
    setShowOfferPop(false);
  }, [mode]);

  const visibleJobs = vehicleType === 'heavy' ? MAP_JOBS.filter(j => j.type === 'heavy') : MAP_JOBS.filter(j => j.type === 'light');
  const activeJobData = { from: [200, 175], to: [320, 90] };

  const handleGoOnline = () => { setMode('online'); setActiveJob(null); setDeliveryStep(0); };
  const handleAccept = (job) => {
    setSelectedJob(null); setShowOfferPop(false);
    setActiveJob(job || MAP_JOBS[0]); setMode('active');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Overlay header on map */}
      <div style={{
        position: 'absolute', top: 54, left: 0, right: 0, zIndex: 10,
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Vehicle selector */}
        <div style={{
          display: 'flex', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        }}>
          {[{ key: 'heavy', label: '🚛 Camión' }, { key: 'light', label: '🏍 Moto' }].map(v => (
            <button key={v.key} onClick={() => setVehicleType(v.key)} style={{
              padding: '8px 14px', border: 'none', cursor: 'pointer', outline: 'none',
              background: vehicleType === v.key ? Z.orangeDark : 'rgba(255,255,255,0.88)',
              color: vehicleType === v.key ? '#fff' : Z.text,
              fontFamily: Z.font, fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
              backdropFilter: 'blur(8px)',
            }}>{v.label}</button>
          ))}
        </div>

        {/* Online toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: Z.font, fontSize: 10, fontWeight: 700,
            color: mode !== 'offline' ? Z.orangeDark : Z.textMuted,
            padding: '4px 10px', borderRadius: 20,
            background: mode !== 'offline' ? Z.orangeLight : 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(8px)',
          }}>{mode !== 'offline' ? '● EN LÍNEA' : '○ OFFLINE'}</span>
          <div onClick={() => mode === 'offline' ? handleGoOnline() : setMode('offline')} style={{
            width: 50, height: 28, borderRadius: 14, padding: 2, cursor: 'pointer',
            background: mode !== 'offline' ? Z.orange : Z.border, transition: 'background 0.3s',
            display: 'flex', alignItems: 'center',
            boxShadow: mode !== 'offline' ? '0 2px 10px rgba(232,115,58,0.4)' : 'none',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.3s',
              transform: mode !== 'offline' ? 'translateX(22px)' : 'translateX(0)',
            }} />
          </div>
        </div>
      </div>

      {/* Map */}
      <FakeMap
        mode={mode} vehicleType={vehicleType} jobs={visibleJobs}
        activeJob={mode === 'active' ? activeJobData : null}
        onJobPress={(job) => setSelectedJob(job)}
      />

      {/* ── OFFLINE: Stats panel ── */}
      {mode === 'offline' && (
        <div style={{
          flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: 16,
          background: Z.bg,
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.textMuted }}>Estás fuera de línea</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <SummaryCard icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={Z.orange} strokeWidth="2" fill="none"/></svg>} label="Ganancias hoy" value="Bs 125" color={Z.orange} />
            <SummaryCard icon={<NavIconTruck color={Z.blue} size={16} />} label="Viajes hoy" value="2" color={Z.blue} />
            <SummaryCard icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M3 3l9 9 9-9M3 21l9-9 9 9" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>} label="Km recorridos" value="6.3" color={Z.orange} />
          </div>
          <button onClick={handleGoOnline} style={{
            padding: '16px', borderRadius: Z.r.lg, border: 'none', cursor: 'pointer',
            background: Z.gradOrange, color: '#fff', outline: 'none',
            fontFamily: Z.font, fontSize: 16, fontWeight: 800, letterSpacing: 1,
            boxShadow: '0 4px 20px rgba(164,55,0,0.3)',
          }}>
            ACTIVAR RADAR
          </button>
          <div style={{ marginTop: 4 }}>
            <SectionTitle title="Últimos Viajes" />
            <div style={{ marginTop: 8 }}>
              {TRIP_HISTORY.slice(0, 2).map(t => (
                <ActivityItem key={t.id} title={t.title} subtitle={`${t.from} → ${t.to} · ${t.km}km`} time={`Bs ${t.pay}`} color={Z.orange} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ONLINE IDLE: Job cards ── */}
      {mode === 'online' && (
        <div style={{
          background: Z.surface, borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
          padding: '14px 16px 80px', flex: 1, overflowY: 'auto',
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text, marginBottom: 12 }}>
            {visibleJobs.length} solicitudes disponibles
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleJobs.map(job => (
              <button key={job.id} onClick={() => setSelectedJob(job)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px',
                borderRadius: Z.r.md, background: Z.bg, border: `1px solid ${Z.border}`,
                cursor: 'pointer', width: '100%', textAlign: 'left', outline: 'none',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: job.type === 'heavy' ? Z.orangeLight : Z.blueLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>{job.type === 'heavy' ? '🏗' : '⚡'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{job.title}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 2 }}>{job.from} → {job.to}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>📍 {job.dist}</span>
                    <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>⏱ {job.time}</span>
                    <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>⚖ {job.weight}</span>
                  </div>
                </div>
                <span style={{ fontFamily: Z.font, fontSize: 18, fontWeight: 800, color: Z.orangeDark, flexShrink: 0 }}>
                  Bs {job.pay}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── ACTIVE DELIVERY: Steps ── */}
      {mode === 'active' && activeJob && (
        <div style={{
          background: Z.surface, borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
          padding: '16px 16px 80px', flex: 1, overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 800, color: Z.text }}>{activeJob.title}</div>
            <span style={{ fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: Z.orangeLight, color: Z.orangeDark }}>EN CAMINO</span>
          </div>
          {/* Delivery steps */}
          {[
            { label: 'Recoger carga', sub: activeJob.from, done: deliveryStep > 0 },
            { label: 'En camino', sub: `${activeJob.dist} · ${activeJob.time}`, done: deliveryStep > 1 },
            { label: 'Entregar y escanear QR', sub: activeJob.to, done: deliveryStep > 2 },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: step.done ? Z.orange : (i === deliveryStep ? Z.orangeLight : Z.divider),
                  border: `2px solid ${step.done ? Z.orange : (i === deliveryStep ? Z.orange : Z.border)}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {step.done ? <ZIcon name="check" size={14} color="#fff" /> : <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 800, color: i === deliveryStep ? Z.orangeDark : Z.textMuted }}>{i+1}</span>}
                </div>
                {i < 2 && <div style={{ width: 2, height: 24, background: step.done ? Z.orange : Z.divider, margin: '4px 0' }} />}
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: i === deliveryStep ? Z.text : Z.textMuted }}>{step.label}</div>
                <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textMuted, marginTop: 2 }}>{step.sub}</div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            {deliveryStep < 3 ? (
              <ZButton onClick={() => { if (deliveryStep < 2) setDeliveryStep(s => s + 1); else { setMode('online'); setActiveJob(null); setDeliveryStep(0); } }}>
                {deliveryStep === 0 ? 'Carga recogida ✓' : deliveryStep === 1 ? 'Escanear QR de Entrega' : 'Finalizar Entrega'}
              </ZButton>
            ) : null}
            <button style={{
              width: 48, height: 48, borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
              background: Z.surface, cursor: 'pointer', outline: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <NavIconMsg color={Z.blue} size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── JOB REQUEST POPUP (auto-appears) ── */}
      {(selectedJob || showOfferPop) && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 30,
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{
            background: Z.surface, borderRadius: '20px 20px 0 0', padding: '20px',
            width: '100%', animation: 'zFadeSlideIn 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 28 }}>{(selectedJob || MAP_JOBS[0]).type === 'heavy' ? '🏗' : '⚡'}</div>
              <div>
                <div style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.text }}>{(selectedJob || MAP_JOBS[0]).title}</div>
                <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>{(selectedJob || MAP_JOBS[0]).from} → {(selectedJob || MAP_JOBS[0]).to}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontFamily: Z.font, fontSize: 24, fontWeight: 800, color: Z.orangeDark }}>Bs {(selectedJob || MAP_JOBS[0]).pay}</div>
                <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>{(selectedJob || MAP_JOBS[0]).time}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 14, padding: '12px', borderRadius: Z.r.md, background: Z.bg, marginBottom: 16 }}>
              {[
                { icon: '📍', val: (selectedJob || MAP_JOBS[0]).dist },
                { icon: '⚖', val: (selectedJob || MAP_JOBS[0]).weight },
              ].map((d, i) => (
                <div key={i} style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 600, color: Z.textSec }}>
                  {d.icon} {d.val}
                </div>
              ))}
              <div style={{ marginLeft: 'auto', fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.blue }}>✓ Apto para tu vehículo</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <ZButton variant="secondary" style={{ flex: 1 }} onClick={() => { setSelectedJob(null); setShowOfferPop(false); }}>Rechazar</ZButton>
              <ZButton style={{ flex: 2 }} onClick={() => handleAccept(selectedJob || MAP_JOBS[0])}>Aceptar Entrega</ZButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pedidos Tab Repartidor ──────────────────────────────────────────────────
function PedidosTabRepartidor() {
  const [filter, setFilter] = React.useState('Activos');
  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Mis Pedidos</h2>
      <FilterBar options={['Activos', 'Completados', 'Historial']} active={filter} onChange={setFilter} />
      {filter === 'Activos' && (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <NavIconTruck color={Z.textMuted} size={44} />
          <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textMuted, marginTop: 12 }}>No tienes entregas activas en este momento</p>
          <p style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, marginTop: 4 }}>Activa tu radar para recibir solicitudes</p>
        </div>
      )}
      {filter !== 'Activos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TRIP_HISTORY.map(t => (
            <div key={t.id} style={{ padding: '14px 16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{t.title}</span>
                <span style={{ fontFamily: Z.font, fontSize: 16, fontWeight: 800, color: Z.orangeDark }}>Bs {t.pay}</span>
              </div>
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec }}>{t.from} → {t.to}</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>📍 {t.km}km</span>
                <span style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>🕐 {t.date}</span>
                <span style={{ marginLeft: 'auto', fontFamily: Z.font, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#DCFCE7', color: Z.success }}>Entregado</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ganancias Tab ────────────────────────────────────────────────────────────
function GananciasTab() {
  const [period, setPeriod] = React.useState('Semana');
  const data = { Semana: { total: 1240, trips: 18, km: 142, avg: 68.9 }, Mes: { total: 4850, trips: 71, km: 562, avg: 68.3 } };
  const d = data[period] || data['Semana'];

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Mis Ganancias</h2>
      <FilterBar options={['Hoy', 'Semana', 'Mes']} active={period} onChange={setPeriod} />

      {/* Main earning card */}
      <div style={{
        padding: '24px', borderRadius: Z.r.lg,
        background: `linear-gradient(135deg, ${Z.orangeDark} 0%, ${Z.orange} 100%)`,
        boxShadow: '0 4px 20px rgba(164,55,0,0.2)',
      }}>
        <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
          Ganancias · esta {period.toLowerCase()}
        </div>
        <div style={{ fontFamily: Z.font, fontSize: 40, fontWeight: 800, color: '#fff', margin: '6px 0 4px' }}>
          Bs {d.total.toLocaleString()}
        </div>
        <div style={{ fontFamily: Z.font, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
          Promedio por viaje: <strong style={{ color: '#fff' }}>Bs {d.avg}</strong>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'flex', gap: 10 }}>
        <SummaryCard icon={<NavIconTruck color={Z.blue} size={17} />} label="Viajes" value={d.trips} color={Z.blue} />
        <SummaryCard icon={<svg width="17" height="17" viewBox="0 0 24 24"><path d="M3 12l2-2 4 4 4-4 4 4 4-4" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>} label="Km recorridos" value={d.km} color={Z.orange} />
      </div>

      {/* Earnings bar chart (simplified) */}
      <div>
        <SectionTitle title="Por día" />
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80, marginTop: 14 }}>
          {[45, 120, 180, 90, 210, 155, 125].map((val, i) => {
            const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
            const maxVal = 210;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', borderRadius: '4px 4px 0 0',
                  height: `${(val / maxVal) * 70}px`,
                  background: i === 4 ? Z.orangeDark : Z.orangeLight,
                  transition: 'height 0.5s',
                }} />
                <span style={{ fontFamily: Z.font, fontSize: 9, fontWeight: 600, color: i === 4 ? Z.orangeDark : Z.textMuted }}>{days[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle maintenance reminder */}
      <div style={{ padding: '14px', borderRadius: Z.r.md, background: Z.blueLight, border: `1px solid ${Z.bluePastel}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 20 }}>🔧</span>
        <div>
          <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.blueDark }}>Mantenimiento del vehículo</div>
          <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 2 }}>Próximo cambio de aceite en 2,000 km</div>
        </div>
      </div>
    </div>
  );
}

// ── Perfil Tab Repartidor ────────────────────────────────────────────────────
function PerfilRepartidor() {
  return (
    <div style={{ overflowY: 'auto', paddingBottom: 20 }}>
      <div style={{ padding: '24px 20px 20px', background: `linear-gradient(180deg, ${Z.orangeLight} 0%, ${Z.bg} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <ZAvatar name="Carlos Condori" size={80} />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>Carlos Condori</h3>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>Transportista · Santa Cruz</p>
        </div>
        <div style={{ display: 'flex', gap: 16, padding: '12px 20px', borderRadius: Z.r.full, background: Z.surface, border: `1px solid ${Z.border}` }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text }}>4.9</div>
            <div style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(i => <IconStar key={i} color="#F59E0B" size={13} />)}</div>
          </div>
          <div style={{ width: 1, background: Z.border }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text }}>247</div>
            <div style={{ fontFamily: Z.font, fontSize: 10, color: Z.textMuted }}>viajes</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Vehicle info */}
        <div>
          <SectionTitle title="Mi Vehículo" />
          <div style={{ marginTop: 10, padding: '16px', borderRadius: Z.r.md, background: Z.surface, border: `1px solid ${Z.border}`, display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ fontSize: 36 }}>🚛</span>
            <div>
              <div style={{ fontFamily: Z.font, fontSize: 15, fontWeight: 700, color: Z.text }}>Camión de Carga</div>
              <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textSec, marginTop: 2 }}>Toyota Dyna · Placa 3456-ABC</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: Z.orangeLight, color: Z.orangeDark }}>Carga máx: 3T</span>
                <span style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: Z.blueLight, color: Z.blueDark }}>Verificado ✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <SectionTitle title="Documentos" />
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { doc: 'Licencia de conducir', status: 'Vigente', ok: true },
              { doc: 'SOAT', status: 'Vigente hasta Mar 2026', ok: true },
              { doc: 'Tarjeta de propiedad', status: 'Vigente', ok: true },
              { doc: 'Revisión técnica', status: 'Vence Jun 2025', ok: false },
            ].map(d => (
              <div key={d.doc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: Z.r.sm, background: Z.surface, border: `1px solid ${d.ok ? Z.border : '#FECACA'}` }}>
                <div>
                  <div style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 700, color: Z.text }}>{d.doc}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: d.ok ? Z.textMuted : Z.error, marginTop: 2 }}>{d.status}</div>
                </div>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: d.ok ? '#DCFCE7' : '#FFF1F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12 }}>{d.ok ? '✓' : '!'}</span>
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
  RNavIconUser, RNavIconRadar, RNavIconEarnings, RNavIconList,
  FakeMap, RadarTab, PedidosTabRepartidor, GananciasTab, PerfilRepartidor,
});
