
// ziteo-dash-projects.jsx — Proyectos tab + Licitaciones tab + forms

// ── Sample Data ─────────────────────────────────────────────────────────────
const SAMPLE_PROJECTS = [
  { id: 1, name: 'Casa Norte', status: 'Activo', date: '15 Mar', budget: '45,000', pedidos: 8, desc: 'Construcción de vivienda unifamiliar en zona Norte, 2 plantas.' },
  { id: 2, name: 'Edificio Comercial Sur', status: 'Planificación', date: '02 May', budget: '280,000', pedidos: 0, desc: 'Edificio de oficinas, 6 pisos. Fase de diseño.' },
  { id: 3, name: 'Remodelación Oficina', status: 'Completo', date: '10 Ene', budget: '12,500', pedidos: 5, desc: 'Remodelación interior de oficina corporativa.' },
  { id: 4, name: 'Vivienda Familiar', status: 'Activo', date: '28 Abr', budget: '38,000', pedidos: 3, desc: 'Ampliación y acabados de vivienda en zona Este.' },
];

const SAMPLE_BIDS = [
  { id: 1, title: 'Electricista para obra', specialty: 'Electricidad industrial', budget: '5,000', city: 'Santa Cruz', offers: 5, status: 'Activa', time: '15 días' },
  { id: 2, title: 'Plomería baño principal', specialty: 'Instalación sanitaria', budget: '2,500', city: 'Santa Cruz', offers: 3, status: 'Activa', time: '7 días' },
  { id: 3, title: 'Carpintería puertas', specialty: 'Carpintería fina', budget: '8,000', city: 'La Paz', offers: 7, status: 'Cerrada', time: '30 días' },
  { id: 4, title: 'Pintura interior 3 ambientes', specialty: 'Pintura y acabados', budget: '3,200', city: 'Santa Cruz', offers: 4, status: 'Cerrada', time: '10 días' },
];

// ── Proyectos Tab ───────────────────────────────────────────────────────────
function ProyectosTab() {
  const [filter, setFilter] = React.useState('Todos');
  const [showForm, setShowForm] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState(null);

  const filters = ['Todos', 'Planificación', 'Activos', 'Completos'];
  const filtered = filter === 'Todos'
    ? SAMPLE_PROJECTS
    : SAMPLE_PROJECTS.filter(p =>
        filter === 'Activos' ? p.status === 'Activo' : p.status === filter.replace('s', '')
      );

  if (showForm) return <NewProjectForm onBack={() => setShowForm(false)} />;
  if (selectedProject) return <ProjectDetailScreen project={selectedProject} onBack={() => setSelectedProject(null)} />;

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Proyectos</h2>
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
          borderRadius: 20, border: 'none', cursor: 'pointer',
          background: Z.orangeDark, color: '#fff', outline: 'none',
          fontFamily: Z.font, fontSize: 12, fontWeight: 700,
        }}>
          <NavIconPlus color="#fff" size={14} /> Nuevo
        </button>
      </div>

      <FilterBar options={filters} active={filter} onChange={setFilter} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(p => (
          <ProjectCard key={p.id} {...p} onTap={() => setSelectedProject(p)} />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <NavIconProjects color={Z.textMuted} size={40} />
            <p style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.textMuted, marginTop: 12 }}>
              No hay proyectos en esta categoría
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Project Detail ──────────────────────────────────────────────────────────
function ProjectDetailScreen({ project, onBack }) {
  return (
    <ZScreen bg={Z.bg}>
      <ZHeader title={project.name} onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Photo placeholder */}
        <div style={{
          height: 130, borderRadius: Z.r.lg,
          background: `linear-gradient(135deg, ${Z.divider}, ${Z.orangeLight})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', fontSize: 11, color: Z.textMuted,
        }}>foto del sitio de construcción</div>

        {/* Status + info */}
        <div style={{ display: 'flex', gap: 10 }}>
          <SummaryCard
            icon={<svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke={Z.orange} strokeWidth="2" fill="none"/><path d="M12 8v4l3 2" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>}
            label="Estado" value={project.status} color={Z.orange}
          />
          <SummaryCard
            icon={<NavIconCart color={Z.blue} size={16} />}
            label="Pedidos" value={project.pedidos} color={Z.blue}
          />
          <SummaryCard
            icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke={Z.orange} strokeWidth="2" strokeLinecap="round" fill="none"/></svg>}
            label="Presupuesto" value={`Bs ${project.budget}`} color={Z.orange}
          />
        </div>

        {/* Description */}
        <div style={{
          padding: '14px', borderRadius: Z.r.md, background: Z.surface,
          border: `1px solid ${Z.border}`,
        }}>
          <div style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textMuted, marginBottom: 6 }}>Descripción</div>
          <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.text, lineHeight: 1.5 }}>{project.desc}</div>
        </div>

        {/* Purchase history */}
        <div>
          <SectionTitle title="Historial de Compras" />
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <ActivityItem title="50 bolsas Cemento IP-30" subtitle="Bs 3,100 · Ferretería San José" time="15 Mar" color={Z.orange} />
            <ActivityItem title="20 barras Fierro 12mm" subtitle="Bs 1,700 · Distribuidora Central" time="12 Mar" color={Z.blue} />
            <ActivityItem title="Arena Fina 2m³" subtitle="Bs 700 · Cantera Sur" time="10 Mar" color={Z.orange} />
          </div>
        </div>

        {/* Escombros */}
        <div>
          <SectionTitle title="Recojos de Escombros" />
          <div style={{ marginTop: 10 }}>
            <ActivityItem title="Recojo volqueta 6m³" subtitle="Completado · Zona Norte" time="14 Mar" color={Z.textMuted} />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <ZButton variant="primary" style={{ flex: 1 }}>Comprar Materiales</ZButton>
          <ZButton variant="secondary" style={{ flex: 1 }}>Contratar</ZButton>
        </div>
      </div>
    </ZScreen>
  );
}

// ── New Project Form ────────────────────────────────────────────────────────
function NewProjectForm({ onBack }) {
  const [formData, setFormData] = React.useState({
    name: '', desc: '', budget: '', needPersonnel: false, needMaterials: false,
  });
  const [city, setCity] = React.useState('');

  const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  return (
    <ZScreen bg={Z.bg}>
      <ZHeader title="Nuevo Proyecto" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Photo upload placeholder */}
        <div style={{
          height: 120, borderRadius: Z.r.lg, border: `2px dashed ${Z.border}`,
          background: Z.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8, cursor: 'pointer',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke={Z.textMuted} strokeWidth="1.8" fill="none"/>
            <circle cx="8.5" cy="8.5" r="1.5" fill={Z.textMuted}/>
            <path d="M21 15l-5-5L5 21" stroke={Z.textMuted} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 500, color: Z.textMuted }}>Toca para agregar foto del sitio</span>
        </div>

        <ZInput label="Nombre del proyecto" placeholder="Ej: Casa Norte" value={formData.name} onChange={v => update('name', v)} />

        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 6 }}>
            Descripción
          </label>
          <textarea
            value={formData.desc} onChange={e => update('desc', e.target.value)}
            placeholder="Describe brevemente el proyecto..."
            style={{
              width: '100%', height: 80, borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
              padding: 14, fontFamily: Z.font, fontSize: 14, color: Z.text,
              resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <ZInput label="Presupuesto estimado (Bs)" type="number" placeholder="Ej: 50000" value={formData.budget} onChange={v => update('budget', v)} />

        <ZSelect label="Ciudad" value={city} onChange={setCity} placeholder="Selecciona ciudad"
          options={['La Paz', 'Santa Cruz', 'Cochabamba', 'Sucre', 'Oruro', 'Potosí', 'Tarija']} />

        {/* Location */}
        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 8 }}>
            Ubicación del sitio
          </label>
          <div style={{
            height: 110, borderRadius: Z.r.md, border: `1.5px dashed ${Z.border}`,
            background: `linear-gradient(135deg, ${Z.blueLight} 0%, ${Z.divider} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6,
          }}>
            <ZIcon name="map-pin" size={24} color={Z.blue} />
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: Z.textMuted }}>seleccionar ubicación</span>
          </div>
        </div>

        {/* Switches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'needPersonnel', label: '¿Necesita contratar personal?' },
            { key: 'needMaterials', label: '¿Necesita comprar material?' },
          ].map(sw => (
            <div key={sw.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.text }}>{sw.label}</span>
              <div
                onClick={() => update(sw.key, !formData[sw.key])}
                style={{
                  width: 44, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer',
                  background: formData[sw.key] ? Z.orange : Z.border, transition: 'background 0.2s',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'transform 0.2s',
                  transform: formData[sw.key] ? 'translateX(18px)' : 'translateX(0)',
                }} />
              </div>
            </div>
          ))}
        </div>

        <ZButton disabled={!formData.name} onClick={() => { alert('Proyecto creado'); onBack(); }}>
          Crear Proyecto
        </ZButton>
      </div>
    </ZScreen>
  );
}

// ── Licitaciones Tab ────────────────────────────────────────────────────────
function LicitacionesTab() {
  const [filter, setFilter] = React.useState('Activas');
  const [showForm, setShowForm] = React.useState(false);

  const filtered = filter === 'Activas'
    ? SAMPLE_BIDS.filter(b => b.status === 'Activa')
    : SAMPLE_BIDS.filter(b => b.status === 'Cerrada');

  if (showForm) return <NewBidForm onBack={() => setShowForm(false)} />;

  return (
    <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontFamily: Z.font, fontSize: 22, fontWeight: 800, color: Z.text, margin: 0 }}>Licitaciones</h2>
        <button onClick={() => setShowForm(true)} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
          borderRadius: 20, border: 'none', cursor: 'pointer',
          background: Z.orangeDark, color: '#fff', outline: 'none',
          fontFamily: Z.font, fontSize: 12, fontWeight: 700,
        }}>
          <NavIconPlus color="#fff" size={14} /> Nueva
        </button>
      </div>

      <FilterBar options={['Activas', 'Historial']} active={filter} onChange={setFilter} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(b => (
          <BidCard key={b.id} {...b} />
        ))}
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <NavIconBids color={Z.textMuted} size={40} />
            <p style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.textMuted, marginTop: 12 }}>
              No hay licitaciones aquí
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── New Bid Form ────────────────────────────────────────────────────────────
function NewBidForm({ onBack }) {
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [specialty, setSpecialty] = React.useState('');
  const [budget, setBudget] = React.useState('');
  const [city, setCity] = React.useState('');
  const [time, setTime] = React.useState('');

  return (
    <ZScreen bg={Z.bg}>
      <ZHeader title="Nueva Licitación" onBack={onBack} />
      <div style={{ flex: 1, padding: '8px 20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <ZInput label="Título del trabajo" placeholder="Ej: Electricista para instalación" value={title} onChange={setTitle} />

        <div>
          <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 6 }}>
            Descripción detallada
          </label>
          <textarea
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Describe el trabajo requerido, alcance y detalles..."
            style={{
              width: '100%', height: 90, borderRadius: Z.r.sm, border: `1.5px solid ${Z.border}`,
              padding: 14, fontFamily: Z.font, fontSize: 14, color: Z.text,
              resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        <ZSelect label="Especialidad necesaria" value={specialty} onChange={setSpecialty}
          placeholder="Selecciona especialidad"
          options={['Albañilería', 'Electricidad', 'Plomería', 'Carpintería', 'Soldadura', 'Pintura', 'Otro']} />

        <ZInput label="Presupuesto máximo (Bs)" type="number" placeholder="Ej: 5000" value={budget} onChange={setBudget} />

        <ZSelect label="Ciudad" value={city} onChange={setCity}
          placeholder="Selecciona ciudad"
          options={['La Paz', 'Santa Cruz', 'Cochabamba', 'Sucre', 'Oruro', 'Potosí', 'Tarija']} />

        <ZSelect label="Tiempo estimado" value={time} onChange={setTime}
          placeholder="Duración del trabajo"
          options={['1-3 días', '1 semana', '2 semanas', '1 mes', 'Más de 1 mes']} />

        <ZButton disabled={!title || !specialty || !city} onClick={() => { alert('Licitación publicada'); onBack(); }}>
          Publicar Licitación
        </ZButton>
      </div>
    </ZScreen>
  );
}

Object.assign(window, {
  ProyectosTab, ProjectDetailScreen, NewProjectForm,
  LicitacionesTab, NewBidForm,
});
