import { Z } from '@/shared/design/tokens'

export default function PoliticaDeDevoluciones() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${Z.divider}`, flexShrink: 0 }}>
        <div style={{ fontFamily: Z.font, fontSize: 11, fontWeight: 600, color: Z.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>
          Ziteo
        </div>
        <h1 style={{ fontFamily: Z.font, fontSize: 20, fontWeight: 800, color: Z.text, margin: 0 }}>
          Política de Devoluciones y Disputas
        </h1>
        <div style={{ fontFamily: Z.font, fontSize: 12, color: Z.textMuted, marginTop: 4 }}>
          Vigente desde el 19 de mayo de 2026
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>

          <Section title="1. Rol de Ziteo en las transacciones">
            <p>
              Ziteo es una plataforma de conexión entre compradores y vendedores del sector construcción. No somos parte
              de los contratos de compraventa de materiales ni de los acuerdos de prestación de servicios entre usuarios.
              Por lo tanto, Ziteo no garantiza devoluciones ni actúa como intermediario financiero en ninguna transacción.
            </p>
          </Section>

          <Section title="2. Materiales de construcción (Proveedor a Constructor)">
            <p>
              Cada proveedor define su propia política de devoluciones para los materiales que vende. Antes de confirmar
              un pedido, el Constructor debe consultar al Proveedor sus condiciones de devolución o cambio.
            </p>
            <p>
              Ziteo no garantiza devoluciones ni reembolsos. En caso de materiales defectuosos, en mal estado o que no
              correspondan a lo acordado, el Constructor puede:
            </p>
            <ul>
              <li>Comunicarse directamente con el Proveedor para resolver el problema.</li>
              <li>Si no se llega a un acuerdo, abrir una disputa formal en la plataforma dentro del plazo establecido.</li>
            </ul>
          </Section>

          <Section title="3. Servicios de maestros de obra">
            <p>
              Los contratos de trabajo entre Constructores y Maestros de Obra son acuerdos privados entre las partes.
              Ziteo no interviene en la definición de honorarios, condiciones de pago ni en la liquidación de servicios
              prestados.
            </p>
            <p>
              Si surgiera un conflicto relacionado con el servicio prestado, las partes pueden usar el mecanismo de
              disputas de la plataforma como canal de comunicación formal, pero la resolución económica y contractual
              es responsabilidad exclusiva de las partes involucradas.
            </p>
          </Section>

          <Section title="4. Entregas de materiales (Chofer / Repartidor)">
            <p>
              El Chofer es responsable de entregar los materiales en las condiciones acordadas con el Proveedor y el
              Constructor. En caso de daños durante el transporte, pérdida de materiales o incumplimiento del tiempo
              de entrega acordado, las partes deben resolver el conflicto directamente.
            </p>
            <p>
              Si no se llega a un acuerdo, puede iniciarse una disputa formal en la plataforma dentro del plazo
              establecido.
            </p>
          </Section>

          <Section title="5. Cómo reportar un problema">
            <p>
              Para reportar un problema con una entrega, un servicio o un material recibido, utiliza el botón de disputa
              disponible en la sección de detalle del pedido dentro de la aplicación.
            </p>
            <p>
              Al abrir una disputa debes proporcionar:
            </p>
            <ul>
              <li>Descripción clara del problema.</li>
              <li>Evidencia disponible (fotos, mensajes, registros de entrega).</li>
              <li>Lo que esperás como resolución.</li>
            </ul>
          </Section>

          <Section title="6. Plazos para abrir una disputa">
            <p>
              Tenés 48 horas desde el momento en que la entrega o el servicio es marcado como completado en la plataforma
              para abrir una disputa formal. Pasado ese plazo, Ziteo no podrá procesar el reporte.
            </p>
            <p>
              Recomendamos revisar los materiales o el resultado del servicio inmediatamente al recibirlos, antes de
              marcar la entrega como completada.
            </p>
          </Section>

          <Section title="7. Proceso de resolución">
            <p>
              Una vez abierta la disputa, el proceso es el siguiente:
            </p>
            <ul>
              <li>Ziteo notifica a ambas partes dentro de las 24 horas hábiles siguientes.</li>
              <li>Ambas partes tienen 5 días hábiles para presentar su versión y evidencias.</li>
              <li>Ziteo revisa la información y emite una recomendación de resolución.</li>
            </ul>
            <p>
              La recomendación de Ziteo no tiene carácter vinculante en términos legales. Si el conflicto no se resuelve
              mediante este mecanismo, las partes pueden recurrir a las instancias legales que correspondan bajo la
              legislación boliviana.
            </p>
          </Section>

          <Section title="8. Suspensión de cuentas">
            <p>
              Ziteo se reserva el derecho de suspender temporalmente o eliminar definitivamente la cuenta de un usuario
              que acumule disputas reiteradamente por incumplimiento comprobado, comportamiento fraudulento o entrega
              de materiales o servicios que no correspondan a lo publicado en la plataforma.
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
