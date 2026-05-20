export default function PrivacidadPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#111', fontFamily: 'Manrope, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Brand */}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D94F00', marginBottom: 24 }}>
          Ziteo
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111', margin: '0 0 8px', lineHeight: 1.15 }}>
          Política de Privacidad
        </h1>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 48px' }}>
          Vigente desde el 19 de mayo de 2026
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

          <Section title="1. Introducción">
            <p>
              Ziteo se compromete a proteger la información personal de sus usuarios. Esta Política de Privacidad explica
              qué datos recopilamos, cómo los usamos y cuáles son tus derechos. Esta política cumple con lo establecido
              en la Ley 164 de Bolivia (Ley General de Telecomunicaciones, Tecnologías de Información y Comunicación).
            </p>
          </Section>

          <Section title="2. Datos que recopilamos">
            <p>Al registrarte y usar Ziteo, recopilamos:</p>
            <ul>
              <li><strong>Datos de identificación:</strong> Nombre completo y número de teléfono celular boliviano.</li>
              <li><strong>Datos de perfil:</strong> Ciudad de operación, rol en la plataforma (Constructor, Proveedor,
              Maestro de Obra o Chofer), nombre de empresa (opcional) y correo electrónico (opcional).</li>
              <li><strong>Datos de actividad:</strong> Pedidos realizados o recibidos, productos publicados, servicios
              ofrecidos, historial de entregas y valoraciones recibidas.</li>
              <li><strong>Imágenes:</strong> Fotos de productos publicados por proveedores, imágenes de perfil y, en
              el caso de proveedores, código QR de pago (si lo cargan voluntariamente).</li>
              <li><strong>Datos técnicos:</strong> Información básica del dispositivo y registros de uso necesarios para
              el funcionamiento correcto de la aplicación.</li>
            </ul>
            <p>
              No recopilamos datos de tarjetas de crédito, cuentas bancarias ni ninguna información financiera sensible.
            </p>
          </Section>

          <Section title="3. Para qué usamos tus datos">
            <p>Usamos la información recopilada exclusivamente para:</p>
            <ul>
              <li>Verificar tu identidad y gestionar tu cuenta en la plataforma.</li>
              <li>Conectar a constructores con proveedores, maestros de obra y choferes dentro de tu ciudad.</li>
              <li>Procesar y hacer seguimiento a pedidos, entregas y contratos de servicio.</li>
              <li>Enviarte notificaciones relacionadas con tu actividad en la plataforma.</li>
              <li>Mejorar el funcionamiento de la plataforma mediante análisis anónimos de uso.</li>
              <li>Cumplir con obligaciones legales cuando corresponda.</li>
            </ul>
            <p>
              No usamos tus datos para publicidad de terceros ni para perfilado comercial externo a Ziteo.
            </p>
          </Section>

          <Section title="4. Con quién compartimos tu información">
            <p>
              Ziteo no vende ni comparte tus datos con empresas externas para fines comerciales. La información se
              comparte únicamente en estos casos:
            </p>
            <ul>
              <li><strong>Entre usuarios de la plataforma:</strong> Cuando realizas o recibes un pedido, los datos de
              contacto básicos (nombre, teléfono, ciudad) son visibles para la contraparte involucrada en esa operación.</li>
              <li><strong>Supabase:</strong> Nuestra infraestructura de base de datos y autenticación está alojada en
              Supabase, que actúa como proveedor de infraestructura tecnológica bajo acuerdos de confidencialidad.</li>
              <li><strong>Requerimientos legales:</strong> Podemos revelar información si una autoridad competente
              boliviana lo requiere mediante orden judicial o mandato legal válido.</li>
            </ul>
          </Section>

          <Section title="5. Cookies y tecnologías similares">
            <p>
              Ziteo utiliza únicamente cookies técnicas necesarias para el funcionamiento de la aplicación: gestión de
              sesión y preferencias básicas del usuario. No utilizamos cookies de seguimiento, publicidad ni analítica
              de terceros.
            </p>
          </Section>

          <Section title="6. Retención de datos">
            <p>
              Mantenemos tu información mientras tu cuenta esté activa en la plataforma. Si decides eliminar tu cuenta
              o solicitas la eliminación de tus datos, procederemos a borrarlos dentro de los 30 días siguientes a tu
              solicitud, salvo que exista una obligación legal que requiera conservarlos por un plazo mayor.
            </p>
          </Section>

          <Section title="7. Tus derechos">
            <p>Como usuario de Ziteo, tienes derecho a:</p>
            <ul>
              <li><strong>Acceder</strong> a los datos que tenemos sobre ti.</li>
              <li><strong>Corregir</strong> información incorrecta desde tu perfil en la app.</li>
              <li><strong>Eliminar</strong> tu cuenta y los datos asociados, mediante solicitud al soporte.</li>
              <li><strong>Oponerte</strong> al uso de tus datos para finalidades distintas a las descritas aquí.</li>
            </ul>
            <p>
              Para ejercer cualquiera de estos derechos, contacta al equipo de soporte desde dentro de la aplicación.
              Responderemos dentro de los 10 días hábiles siguientes a tu solicitud.
            </p>
          </Section>

          <Section title="8. Seguridad">
            <p>
              Implementamos medidas técnicas y organizativas razonables para proteger tu información contra acceso no
              autorizado, pérdida o alteración. Esto incluye cifrado en tránsito (HTTPS), autenticación mediante SMS
              y controles de acceso a nuestra infraestructura.
            </p>
          </Section>

          <Section title="9. Cumplimiento legal">
            <p>
              Esta política se rige por la Ley 164 de Bolivia — Ley General de Telecomunicaciones, Tecnologías de
              Información y Comunicación — y sus reglamentos complementarios.
            </p>
          </Section>

          <Section title="10. Contacto">
            <p>
              Para consultas o solicitudes relacionadas con esta Política de Privacidad, comunícate con nuestro equipo
              de soporte a través de la aplicación o escríbenos a{' '}
              <a href="mailto:soporte@ziteo.com.bo" style={{ color: '#D94F00' }}>soporte@ziteo.com.bo</a>.
            </p>
          </Section>

        </div>

        <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid #eee', fontSize: 12, color: '#aaa' }}>
          Ziteo · Bolivia · 2026
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 12px' }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, color: '#444', lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}
