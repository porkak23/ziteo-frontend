
// ziteo-screens.jsx — All authentication flow screens for ZITEO

// ── 1. SPLASH SCREEN ────────────────────────────────────────────────────────
function SplashScreen({ onComplete }) {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const start = Date.now();
    const duration = 3000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / duration, 1);
      setProgress(p);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(onComplete, 300);
    };
    requestAnimationFrame(tick);
  }, []);

  return (
    <ZScreen bg="transparent" style={{ overflow: 'hidden' }}>
      {/* Geometric blueprint background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px),
          linear-gradient(135deg, rgba(232,115,58,0.12) 0%, transparent 45%),
          linear-gradient(315deg, rgba(58,123,213,0.1) 0%, transparent 45%),
          linear-gradient(180deg, #0D1020 0%, #141930 50%, #0D1020 100%)
        `,
      }} />

      {/* Decorative corner elements */}
      <div style={{ position: 'absolute', top: 20, left: 20, width: 40, height: 40, borderTop: '2px solid rgba(232,115,58,0.3)', borderLeft: '2px solid rgba(232,115,58,0.3)', borderRadius: '4px 0 0 0' }} />
      <div style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderTop: '2px solid rgba(58,123,213,0.3)', borderRight: '2px solid rgba(58,123,213,0.3)', borderRadius: '0 4px 0 0' }} />
      <div style={{ position: 'absolute', bottom: 100, left: 20, width: 40, height: 40, borderBottom: '2px solid rgba(58,123,213,0.3)', borderLeft: '2px solid rgba(58,123,213,0.3)', borderRadius: '0 0 0 4px' }} />
      <div style={{ position: 'absolute', bottom: 100, right: 20, width: 40, height: 40, borderBottom: '2px solid rgba(232,115,58,0.3)', borderRight: '2px solid rgba(232,115,58,0.3)', borderRadius: '0 0 4px 0' }} />

      {/* Center content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', position: 'relative', zIndex: 2, gap: 16, paddingBottom: 60,
      }}>
        {/* Architectural icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: Z.gradMixed, boxShadow: '0 8px 32px rgba(232,115,58,0.3)',
          animation: 'zPulseGlow 2s ease-in-out infinite',
        }}>
          <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
            <path d="M8 40V20l16-12 16 12v20" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
            <rect x="14" y="24" width="6" height="6" rx="1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
            <rect x="28" y="24" width="6" height="6" rx="1" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none"/>
            <rect x="19" y="32" width="10" height="8" rx="1.5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" fill="none"/>
            <path d="M24 8V4M24 4h8M24 4h-4" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Logo */}
        <h1 style={{
          fontFamily: Z.font, fontWeight: 800, fontSize: 64, color: '#FFFFFF',
          letterSpacing: 6, margin: 0,
          textShadow: '0 2px 20px rgba(232,115,58,0.3)',
        }}>ZITEO</h1>

        {/* Tagline */}
        <p style={{
          fontFamily: Z.font, fontWeight: 500, fontSize: 14, color: 'rgba(255,255,255,0.55)',
          margin: 0, letterSpacing: 1, textAlign: 'center', lineHeight: 1.5,
        }}>La plataforma que construye Bolivia</p>
      </div>

      {/* Bottom section */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 40px 50px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, zIndex: 2,
      }}>
        {/* Progress bar */}
        <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 2, transition: 'width 0.1s linear',
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #E8733A, #3A7BD5)',
          }} />
        </div>

        {/* Pillars */}
        <div style={{
          display: 'flex', gap: 16, alignItems: 'center',
          fontFamily: Z.font, fontSize: 10, fontWeight: 700, letterSpacing: 2.5,
          color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
        }}>
          <span>Conecta</span>
          <span style={{ color: Z.orange, fontSize: 6 }}>◆</span>
          <span>Construye</span>
          <span style={{ color: Z.blue, fontSize: 6 }}>◆</span>
          <span>Crece</span>
        </div>
      </div>
    </ZScreen>
  );
}

// ── 2. WELCOME SCREEN ───────────────────────────────────────────────────────
function WelcomeScreen({ onLogin, onRegister }) {
  return (
    <ZScreen bg={Z.navy}>
      {/* Hero image placeholder */}
      <div style={{
        position: 'relative', height: '55%', overflow: 'hidden',
        background: `
          linear-gradient(180deg, rgba(13,16,32,0.2) 0%, rgba(13,16,32,0.7) 80%, ${Z.navy} 100%),
          linear-gradient(135deg, #2D1B0E 0%, #1A1520 50%, #0D1530 100%)
        `,
      }}>
        {/* Placeholder construction image */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 8,
        }}>
          <div style={{
            padding: '12px 20px', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 12,
            fontFamily: 'monospace', fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center',
            lineHeight: 1.6, letterSpacing: 0.5,
          }}>
            foto de obrero boliviano<br/>trabajando en obra
          </div>
        </div>
        {/* Geometric accents on image */}
        <div style={{
          position: 'absolute', top: '30%', left: -20, width: 60, height: 60,
          border: '1.5px solid rgba(232,115,58,0.2)', borderRadius: 12, transform: 'rotate(45deg)',
        }} />
        <div style={{
          position: 'absolute', top: '20%', right: -10, width: 40, height: 40,
          border: '1.5px solid rgba(58,123,213,0.2)', borderRadius: 8, transform: 'rotate(30deg)',
        }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 28px', gap: 12, animation: 'zFadeSlideIn 0.5s ease 0.2s both',
      }}>
        <h2 style={{
          fontFamily: Z.font, fontWeight: 800, fontSize: 30, color: '#FFFFFF',
          margin: 0, lineHeight: 1.15,
        }}>
          Bienvenido a<br/>
          <span style={{ background: Z.gradMixed, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ZITEO
          </span>
        </h2>
        <p style={{
          fontFamily: Z.font, fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.5)',
          margin: 0, lineHeight: 1.6,
        }}>
          Conecta con proveedores, maestros de obra y transportistas. Todo lo que necesitas para construir, en un solo lugar.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <ZButton variant="primary" onClick={onLogin}>Inicia Sesión</ZButton>
          <ZButton variant="secondary" onClick={onRegister}
            style={{ borderColor: 'rgba(255,255,255,0.25)', color: '#FFFFFF' }}
          >Crear Cuenta</ZButton>
        </div>
      </div>
    </ZScreen>
  );
}

// ── 3. LOGIN SCREEN ─────────────────────────────────────────────────────────
function LoginScreen({ onBack, onSuccess, onRegister }) {
  const [phone, setPhone] = React.useState('');
  const [pin, setPin] = React.useState('');
  const [pinVisible, setPinVisible] = React.useState(false);
  const [biometrics, setBiometrics] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const validate = () => {
    const e = {};
    if (phone.replace(/\D/g, '').length < 8) e.phone = 'Ingresa un número válido (+591)';
    if (pin.length < 6) e.pin = 'El PIN debe tener 6 dígitos';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = () => {
    if (validate()) onSuccess();
  };

  return (
    <ZScreen bg={Z.bg}>
      <ZHeader onBack={onBack} />
      <div style={{
        flex: 1, padding: '8px 24px 24px', display: 'flex', flexDirection: 'column',
        gap: 24, overflowY: 'auto',
      }}>
        {/* Heading */}
        <div>
          <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 28, color: Z.text, margin: 0 }}>
            Inicia Sesión
          </h2>
          <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Phone */}
        <ZInput
          label="Número de teléfono"
          type="tel" prefix="+591"
          placeholder="7XX XXX XX"
          value={phone} onChange={setPhone}
          error={errors.phone}
        />

        {/* PIN */}
        <ZPinInput
          value={pin} onChange={setPin}
          visible={pinVisible} onToggle={() => setPinVisible(!pinVisible)}
        />

        {/* Biometrics */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
          fontFamily: Z.font, fontSize: 14, fontWeight: 500, color: Z.textSec,
        }}>
          <div
            onClick={(e) => { e.preventDefault(); setBiometrics(!biometrics); }}
            style={{
              width: 44, height: 26, borderRadius: 13, padding: 2, cursor: 'pointer',
              background: biometrics ? Z.orange : Z.border, transition: 'background 0.2s',
              display: 'flex', alignItems: 'center',
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: '50%', background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s',
              transform: biometrics ? 'translateX(18px)' : 'translateX(0)',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ZIcon name="fingerprint" size={18} color={Z.textSec} />
            Activar biometría
          </div>
        </label>

        {/* Login button */}
        <ZButton onClick={handleLogin}>Ingresar</ZButton>

        {/* Divider */}
        <ZDivider text="o continúa con" />

        {/* SSO buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <ZButton variant="social" fullWidth={true} onClick={() => {}}
            icon={<svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.6 9.2l-.1-1.2H9v3h4.8c-.2 1.1-.9 2-1.9 2.6v2.2h3c1.8-1.6 2.7-4 2.7-6.6z" fill="#4285F4"/><path d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2c-.8.5-1.8.9-3 .9-2.3 0-4.3-1.6-5-3.7H1v2.3C2.5 15.9 5.5 18 9 18z" fill="#34A853"/><path d="M4 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H1C.4 6.2 0 7.5 0 9s.4 2.8 1 4l3-2.3z" fill="#FBBC05"/><path d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.5-2.5C13.5.9 11.4 0 9 0 5.5 0 2.5 2.1 1 5l3 2.3c.7-2.1 2.7-3.7 5-3.7z" fill="#EA4335"/></svg>}
          >Google</ZButton>
          <ZButton variant="social" fullWidth={true} onClick={() => {}}
            icon={<svg width="18" height="18" viewBox="0 0 18 18"><path d="M14.5 0H3.5C1.6 0 0 1.6 0 3.5v11C0 16.4 1.6 18 3.5 18h11c1.9 0 3.5-1.6 3.5-3.5v-11C18 1.6 16.4 0 14.5 0zM13.2 6.3c0 3.5-2.7 7.6-7.6 7.6-1.5 0-2.9-.4-4.1-1.2.2 0 .4.1.6.1 1.3 0 2.4-.4 3.4-1.2-1.2 0-2.2-.8-2.5-1.9.2 0 .3.1.5.1.2 0 .5 0 .7-.1C3 9.4 2 8.3 2 7v0c.4.2.8.3 1.2.3C2.4 6.8 2 5.8 2 4.7c0-.6.2-1.1.4-1.6C3.8 4.8 5.8 5.9 8.1 6c-.1-.2-.1-.5-.1-.7 0-1.5 1.2-2.7 2.7-2.7.8 0 1.5.3 2 .9.6-.1 1.2-.3 1.8-.7-.2.7-.7 1.2-1.2 1.5.6-.1 1.1-.2 1.6-.4-.4.6-.9 1.1-1.5 1.5 0 .1 0 .3-.2.9z" fill="#1A1A2E"/></svg>}
          >Apple</ZButton>
        </div>

        {/* Register link */}
        <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: 16 }}>
          <span style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec }}>
            ¿No tienes cuenta?{' '}
            <span onClick={onRegister} style={{ color: Z.orange, fontWeight: 700, cursor: 'pointer' }}>
              Regístrate
            </span>
          </span>
        </div>
      </div>
    </ZScreen>
  );
}

// ── 4. REGISTER SCREEN (3 Steps) ────────────────────────────────────────────
function RegisterScreen({ onBack, onSuccess }) {
  const [step, setStep] = React.useState(0);

  // Step 1 state
  const [regPhone, setRegPhone] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [timer, setTimer] = React.useState(59);

  // Step 2 state
  const [name, setName] = React.useState('');
  const [city, setCity] = React.useState('');
  const [regPin, setRegPin] = React.useState('');

  // Step 3 state
  const [roles, setRoles] = React.useState([]);

  React.useEffect(() => {
    if (!otpSent || timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [otpSent, timer]);

  const toggleRole = (r) => {
    setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const goBack = () => {
    if (step === 0) onBack();
    else setStep(s => s - 1);
  };

  const cities = [
    'La Paz', 'Santa Cruz', 'Cochabamba', 'Sucre', 'Oruro',
    'Potosí', 'Tarija', 'Trinidad', 'Cobija',
  ];

  const roleData = [
    { role: 'constructor', title: 'Constructor', description: 'Busca materiales, herramientas y contrata profesionales para tus obras.' },
    { role: 'vendedor', title: 'Vendedor', description: 'Gestiona tu inventario, ventas y pedidos de materiales de construcción.' },
    { role: 'trabajador', title: 'Trabajador', description: 'Recibe solicitudes de trabajo y muestra tu experiencia profesional.' },
    { role: 'repartidor', title: 'Repartidor', description: 'Gestiona entregas de materiales con camiones o motocicletas.' },
  ];

  return (
    <ZScreen bg={Z.bg}>
      <ZHeader onBack={goBack} />
      <div style={{ padding: '0 24px 8px' }}>
        <ZStepBar current={step} total={3} />
      </div>

      <div style={{
        flex: 1, padding: '16px 24px 24px', display: 'flex', flexDirection: 'column',
        gap: 20, overflowY: 'auto',
      }}>
        {/* ── Step 1: Phone + OTP ── */}
        {step === 0 && (
          <div key="step1" style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
                Verifica tu número
              </h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Te enviaremos un código de verificación por SMS
              </p>
            </div>

            <ZInput
              label="Número de teléfono" type="tel" prefix="+591"
              placeholder="7XX XXX XX"
              value={regPhone} onChange={setRegPhone}
            />

            {!otpSent ? (
              <ZButton onClick={() => { setOtpSent(true); setTimer(59); }}
                disabled={regPhone.replace(/\D/g, '').length < 8}>
                Enviar Código OTP
              </ZButton>
            ) : (
              <>
                <div>
                  <label style={{ fontFamily: Z.font, fontSize: 13, fontWeight: 600, color: Z.textSec, display: 'block', marginBottom: 10 }}>
                    Código de verificación
                  </label>
                  <ZOTPInput value={otp} onChange={setOtp} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  {timer > 0 ? (
                    <span style={{ fontFamily: Z.font, fontSize: 13, color: Z.textMuted }}>
                      Reenviar código en <span style={{ color: Z.orange, fontWeight: 700 }}>{timer}s</span>
                    </span>
                  ) : (
                    <span onClick={() => setTimer(59)} style={{ fontFamily: Z.font, fontSize: 13, color: Z.orange, fontWeight: 700, cursor: 'pointer' }}>
                      Reenviar código
                    </span>
                  )}
                </div>
                <ZButton onClick={() => setStep(1)} disabled={otp.length < 6}>
                  Siguiente
                </ZButton>
              </>
            )}
          </div>
        )}

        {/* ── Step 2: Name + City + PIN ── */}
        {step === 1 && (
          <div key="step2" style={{ display: 'flex', flexDirection: 'column', gap: 20, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
                Datos personales
              </h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Completa tu perfil para comenzar
              </p>
            </div>

            <ZInput
              label="Nombre completo" placeholder="Ej: Juan Carlos Mamani"
              value={name} onChange={setName}
            />

            <ZSelect
              label="Ciudad" value={city} onChange={setCity}
              placeholder="Selecciona tu ciudad" options={cities}
            />

            <ZPinInput value={regPin} onChange={setRegPin} />

            <ZButton onClick={() => setStep(2)} disabled={!name || !city || regPin.length < 6}>
              Siguiente
            </ZButton>
          </div>
        )}

        {/* ── Step 3: Role Selection ── */}
        {step === 2 && (
          <div key="step3" style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'zFadeSlideIn 0.3s ease' }}>
            <div>
              <h2 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 26, color: Z.text, margin: 0 }}>
                ¿Cuál es tu rol?
              </h2>
              <p style={{ fontFamily: Z.font, fontSize: 14, color: Z.textSec, margin: '6px 0 0', lineHeight: 1.5 }}>
                Puedes seleccionar más de uno
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {roleData.map(r => (
                <ZRoleCard
                  key={r.role} role={r.role} title={r.title} description={r.description}
                  selected={roles.includes(r.role)}
                  onSelect={() => toggleRole(r.role)}
                />
              ))}
            </div>

            <ZButton onClick={onSuccess} disabled={roles.length === 0} style={{ marginTop: 8 }}>
              Crear Cuenta
            </ZButton>
          </div>
        )}
      </div>
    </ZScreen>
  );
}

// ── 5. PROFILE / ROLE SELECTOR ──────────────────────────────────────────────
function ProfileScreen({ onLogout, tweaks = {} }) {
  const [selectedRole, setSelectedRole] = React.useState('constructor');
  const [appearance, setAppearance] = React.useState('light');

  const roleData = [
    { role: 'constructor', title: 'Constructor', description: 'Compra materiales y gestiona obras' },
    { role: 'vendedor', title: 'Vendedor', description: 'Vende materiales y gestiona pedidos' },
    { role: 'trabajador', title: 'Trabajador', description: 'Ofrece servicios profesionales' },
    { role: 'repartidor', title: 'Repartidor', description: 'Realiza entregas de materiales' },
  ];

  return (
    <ZScreen bg={Z.bg}>
      <div style={{
        padding: '70px 24px 16px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12,
        background: `linear-gradient(180deg, ${Z.orangeLight} 0%, ${Z.bg} 100%)`,
      }}>
        <ZAvatar name="Juan Carlos" size={88} />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: Z.font, fontWeight: 800, fontSize: 22, color: Z.text, margin: 0 }}>
            Juan Carlos Mamani
          </h3>
          <p style={{ fontFamily: Z.font, fontSize: 13, color: Z.textSec, margin: '4px 0 0' }}>
            +591 7XX XXX XX · Santa Cruz
          </p>
        </div>
      </div>

      <div style={{
        flex: 1, padding: '8px 24px 24px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Current role */}
        <div>
          <label style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>
            Rol actual
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {roleData.map(r => (
              <button key={r.role} onClick={() => setSelectedRole(r.role)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                borderRadius: Z.r.md, cursor: 'pointer', width: '100%', textAlign: 'left',
                border: selectedRole === r.role ? `2px solid ${Z.orange}` : `1.5px solid ${Z.border}`,
                background: selectedRole === r.role ? Z.orangeLight : Z.surface,
                transition: 'all 0.2s', boxSizing: 'border-box', outline: 'none',
              }}>
                <ZRoleIcon role={r.role} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: Z.font, fontSize: 14, fontWeight: 700, color: Z.text }}>{r.title}</div>
                  <div style={{ fontFamily: Z.font, fontSize: 11, color: Z.textSec, marginTop: 1 }}>{r.description}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: `2px solid ${selectedRole === r.role ? Z.orange : Z.border}`,
                  background: selectedRole === r.role ? Z.orange : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selectedRole === r.role && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div>
          <label style={{ fontFamily: Z.font, fontSize: 12, fontWeight: 700, color: Z.textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>
            Apariencia
          </label>
          <div style={{
            display: 'flex', borderRadius: Z.r.sm, overflow: 'hidden',
            border: `1.5px solid ${Z.border}`, background: Z.surface,
          }}>
            {[
              { key: 'light', label: 'Claro', icon: 'sun' },
              { key: 'dark', label: 'Oscuro', icon: 'moon' },
              { key: 'system', label: 'Sistema', icon: 'settings' },
            ].map(opt => (
              <button key={opt.key} onClick={() => setAppearance(opt.key)} style={{
                flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: Z.font, fontSize: 12, fontWeight: 600,
                background: appearance === opt.key ? Z.orangeLight : 'transparent',
                color: appearance === opt.key ? Z.orangeDark : Z.textSec,
                transition: 'all 0.2s', outline: 'none',
              }}>
                <ZIcon name={opt.icon} size={16} color={appearance === opt.key ? Z.orangeDark : Z.textMuted} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <button onClick={() => {}} style={{
          display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
          borderRadius: Z.r.md, border: `1.5px solid ${Z.border}`,
          background: Z.surface, cursor: 'pointer', width: '100%',
          fontFamily: Z.font, fontSize: 15, fontWeight: 600, color: Z.text,
          outline: 'none', textAlign: 'left',
        }}>
          <ZIcon name="settings" size={22} color={Z.textSec} />
          Ajustes
          <svg width="8" height="14" viewBox="0 0 8 14" style={{ marginLeft: 'auto' }}>
            <path d="M1 1l6 6-6 6" stroke={Z.textMuted} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Logout */}
        <ZButton variant="danger" onClick={onLogout}
          icon={<ZIcon name="logout" size={18} color={Z.error} />}
        >
          Cerrar Sesión
        </ZButton>
      </div>
    </ZScreen>
  );
}

Object.assign(window, {
  SplashScreen, WelcomeScreen, LoginScreen, RegisterScreen, ProfileScreen,
});
