import { Z } from '@/shared/design/tokens'

export default function TerminosDeUso() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${Z.divider}`, flexShrink: 0 }}>
        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
          Ziteoo
        </div>
        <h1 style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>
          Términos de Uso
        </h1>
        <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, marginTop: 4 }}>
          Vigente desde el 19 de mayo de 2026
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>

          <Section title="1. Descripción del servicio">
            <p>
              Ziteoo es una plataforma digital que conecta a personas y empresas del sector de la construcción en Bolivia.
              A través de Ziteoo, constructores pueden buscar materiales de construcción, contratar maestros de obra y
              coordinar el transporte de insumos. Proveedores publican su catálogo de productos. Maestros de obra ofrecen
              sus servicios. Choferes realizan entregas de materiales.
            </p>
            <p>
              Ziteoo actúa exclusivamente como intermediario tecnológico. No somos parte de los contratos, acuerdos de
              servicio ni transacciones que se celebren entre los usuarios de la plataforma. La responsabilidad de cada
              operación recae íntegramente sobre las partes involucradas.
            </p>
          </Section>

          <Section title="2. Roles y responsabilidades">
            <p><strong>Constructor:</strong> El Constructor es responsable de describir con exactitud sus necesidades de
            materiales o servicios, confirmar entregas y reportar cualquier problema dentro de los plazos establecidos en
            esta plataforma.</p>
            <p><strong>Proveedor:</strong> El Proveedor es responsable de publicar información veraz sobre sus productos
            (precios, disponibilidad, condiciones de entrega) y de cumplir con los pedidos que confirme dentro de la
            plataforma.</p>
            <p><strong>Maestro de Obra:</strong> El Maestro es responsable de la veracidad de su perfil profesional,
            incluyendo experiencia y certificaciones declaradas. Los contratos de trabajo se pactan directamente entre el
            Maestro y el Constructor.</p>
            <p><strong>Chofer / Repartidor:</strong> El Chofer es responsable de la entrega en el tiempo y condiciones
            acordadas. Debe contar con documentación legal del vehículo al día.</p>
          </Section>

          <Section title="3. Condiciones de uso de la plataforma">
            <p>Para usar Ziteoo debes:</p>
            <ul>
              <li>Ser mayor de 18 años o contar con autorización de tu representante legal.</li>
              <li>Proporcionar un número de teléfono boliviano válido y verificable.</li>
              <li>Mantener la confidencialidad de tu PIN de acceso. Eres responsable de toda la actividad realizada desde tu cuenta.</li>
              <li>Usar la plataforma únicamente para actividades relacionadas con el rubro de la construcción en Bolivia.</li>
              <li>Actualizar tu información cuando cambie, especialmente datos de contacto y ciudad de operación.</li>
            </ul>
            <p>
              Ziteoo se reserva el derecho de suspender o eliminar cuentas que incumplan estos términos, sin previo aviso
              en casos de fraude o actividad maliciosa.
            </p>
          </Section>

          <Section title="4. Pagos y transacciones">
            <p>
              Ziteoo facilita el contacto entre compradores y vendedores, pero no procesa pagos ni actúa como intermediario
              financiero. Los pagos se realizan directamente entre las partes, ya sea mediante transferencia bancaria,
              pago QR (código de respuesta rápida del proveedor) u otro método acordado entre los usuarios.
            </p>
            <p>
              Ziteoo no almacena datos de tarjetas de crédito ni información bancaria. No garantiza el cumplimiento de
              ningún pago ni actúa como garante de ninguna transacción. En caso de disputa por un pago, los usuarios
              pueden utilizar el mecanismo de resolución de disputas de la plataforma como medio de comunicación, pero
              la resolución final es responsabilidad de las partes.
            </p>
          </Section>

          <Section title="5. Resolución de disputas">
            <p>
              Si surge un conflicto entre usuarios, Ziteoo ofrece un mecanismo interno de reporte de disputas accesible
              desde la aplicación. El proceso es el siguiente:
            </p>
            <ul>
              <li>El usuario afectado reporta el problema mediante el botón de disputa en la app, dentro de las 48 horas
              posteriores a marcar la entrega o servicio como completado.</li>
              <li>Ziteoo recibe el reporte y notifica a ambas partes dentro de 24 horas hábiles.</li>
              <li>Las partes tienen 5 días hábiles para presentar su versión y cualquier evidencia disponible.</li>
              <li>Ziteoo emite una recomendación de resolución dentro de ese plazo.</li>
            </ul>
            <p>
              La recomendación de Ziteoo no tiene carácter vinculante en términos legales. Si la disputa no se resuelve
              mediante este mecanismo, las partes pueden recurrir a las instancias legales correspondientes bajo la
              jurisdicción boliviana.
            </p>
          </Section>

          <Section title="6. Conductas prohibidas">
            <p>Queda expresamente prohibido:</p>
            <ul>
              <li>Registrar cuentas con datos falsos o suplantar la identidad de otras personas.</li>
              <li>Publicar productos o servicios que no se tienen intención de entregar.</li>
              <li>Realizar transacciones fraudulentas o utilizar la plataforma para actividades ilegales.</li>
              <li>Enviar mensajes no solicitados (spam) a otros usuarios.</li>
              <li>Manipular el sistema de reseñas o valoraciones.</li>
              <li>Intentar acceder a cuentas ajenas o vulnerar la seguridad de la plataforma.</li>
              <li>Usar la información de otros usuarios para fines distintos a la operación acordada en la plataforma.</li>
            </ul>
          </Section>

          <Section title="7. Modificaciones a los términos">
            <p>
              Ziteoo puede modificar estos Términos de Uso en cualquier momento. Cuando lo hagamos, notificaremos a los
              usuarios a través de la aplicación con al menos 7 días de anticipación antes de que los cambios entren en
              vigencia. El uso continuado de la plataforma después de la fecha de vigencia implica la aceptación de los
              nuevos términos.
            </p>
          </Section>

          <Section title="8. Ley aplicable y jurisdicción">
            <p>
              Estos Términos de Uso se rigen por las leyes de Bolivia. Cualquier controversia que no pueda resolverse
              mediante el mecanismo interno de disputas se someterá a la jurisdicción de los tribunales competentes de
              la ciudad de Santa Cruz de la Sierra, Bolivia.
            </p>
          </Section>

          <Section title="9. Contacto">
            <p>
              Para consultas sobre estos términos, puedes contactarnos a través del soporte dentro de la aplicación
              o al correo electrónico de soporte disponible en la plataforma.
            </p>
          </Section>

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--z-font, Manrope, sans-serif)', fontSize: 15, fontWeight: 700, color: 'var(--z-text)', margin: '0 0 10px' }}>
        {title}
      </h2>
      <div style={{ fontFamily: 'var(--z-font, Manrope, sans-serif)', fontSize: 14, color: 'var(--z-text-sec)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}
