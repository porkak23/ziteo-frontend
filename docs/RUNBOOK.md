# Runbook de Operaciones de Emergencia — Ziteo

Versión: 1.0
Fecha: 2026-05-18
Responsable: Equipo técnico Ziteo

Este documento describe los procedimientos operativos críticos que cualquier miembro técnico del equipo debe poder ejecutar en caso de incidente. Los pasos son intencionalmente explícitos. No asumas que el lector conoce los comandos de memoria.

---

## Procedimiento 1: Revertir una migración de base de datos

### Cuándo usar esto

Cuando una migración reciente causó un error de producción y necesitas volver al estado anterior de la base de datos lo antes posible.

### Advertencia importante

`supabase db reset` **destruye todos los datos** de la base de datos local y la reconstruye desde cero con todas las migraciones en orden. Úsalo solo en entornos de desarrollo o staging. **Nunca en producción directamente.**

### Pasos para entorno local / staging

1. Abre una terminal en la raíz del repositorio (`d:/Ziteo.1`).

2. Identifica qué migración causó el problema revisando el historial:

   ```bash
   supabase migration list
   ```

3. Elimina o renombra el archivo de migración problemático de `supabase/migrations/`:

   ```bash
   mv supabase/migrations/20260519_nombre_problematico.sql supabase/migrations/_disabled_20260519_nombre_problematico.sql
   ```

4. Ejecuta el reset completo (esto borra y reconstruye la BD local):

   ```bash
   supabase db reset
   ```

5. Verifica que la aplicación funcione correctamente con el estado anterior.

6. Corrige el problema en el archivo de migración antes de rehabilitarlo.

### Pasos para producción (Supabase Cloud)

En producción no existe un "rollback automático". Los pasos son:

1. **Abre el SQL Editor** en el dashboard de Supabase (`app.supabase.com`).

2. Escribe y ejecuta el SQL inverso de la migración problemática. Por ejemplo, si la migración creó una tabla:

   ```sql
   DROP TABLE IF EXISTS nombre_tabla_nueva CASCADE;
   ```

   Si agregó una columna:

   ```sql
   ALTER TABLE nombre_tabla DROP COLUMN IF EXISTS nombre_columna;
   ```

   Si modificó un CHECK constraint:

   ```sql
   ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
   ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
     CHECK (type IN ('contract', 'project_application', 'order', 'delivery', 'general'));
   ```

3. Registra el rollback como una nueva migración en el repositorio para que el historial quede consistente:

   ```bash
   supabase migration new rollback_20260519_nombre_problematico
   ```

4. Documenta el incidente en este runbook con fecha, causa y solución aplicada.

---

## Procedimiento 2: Dar un reembolso manual

### Cuándo usar esto

Un usuario pagó un pedido pero el proveedor no puede entregarlo, o se detectó un cobro incorrecto. El sistema de Ziteo usa pagos QR (transferencia directa), por lo que el reembolso es manual y coordinado por el equipo.

### Qué tabla actualizar

La tabla principal es `orders`. Las columnas relevantes son:

```
orders.status                    — cambiar a 'cancelled' si corresponde
orders.payment_rejection_reason  — registrar el motivo del reembolso
```

### Pasos

1. Abre el SQL Editor en el dashboard de Supabase.

2. Cancela la orden y registra el motivo del reembolso:

   ```sql
   UPDATE orders
      SET status                   = 'cancelled',
          payment_rejection_reason = 'Reembolso manual autorizado por el equipo Ziteo — [motivo específico aquí]',
          updated_at               = now()
    WHERE id = '[UUID de la orden]'
      AND status NOT IN ('cancelled', 'delivered', 'expired');
   ```

3. Verifica que el stock se haya liberado (el trigger `trg_decrement_stock` restaura stock en cancelaciones). Confirma:

   ```sql
   SELECT id, stock_quantity FROM products WHERE id = '[product_id]';
   ```

4. Envía una notificación al usuario afectado usando la RPC segura:

   ```sql
   SELECT send_notification(
     '[user_id del constructor]'::uuid,
     'general',
     'Reembolso procesado',
     'Tu pedido fue cancelado y el reembolso fue aprobado. El equipo de Ziteo coordinará la devolución del pago vía transferencia. Escríbenos al WhatsApp de soporte si tienes dudas.'
   );
   ```

5. Coordina la devolución del monto directamente con el usuario por WhatsApp o correo. Registra el monto y fecha en el canal de incidentes del equipo.

---

## Procedimiento 3: Suspender un usuario

### Cuándo usar esto

Un usuario está abusando de la plataforma: spam, fraude, publicación de contenido inapropiado, o acumulación de disputas sin resolución.

### Pasos

1. Obtén el `user_id` del usuario desde la tabla `profiles`:

   ```sql
   SELECT user_id, name, phone FROM profiles WHERE phone = '+591XXXXXXXXX';
   ```

2. Suspende al usuario usando la Admin API de Supabase (ejecutar desde un script Node.js seguro o desde el dashboard de Supabase en la sección Auth > Users):

   ```javascript
   const { data, error } = await supabase.auth.admin.updateUserById(
     '[user_id]',
     { ban_duration: '876000h' }  // ~100 años = suspensión indefinida
   )
   ```

   Para suspender temporalmente (ej. 7 días):

   ```javascript
   await supabase.auth.admin.updateUserById('[user_id]', { ban_duration: '168h' })
   ```

3. Registra la razón de la suspensión en la tabla `profiles` usando el campo `notes` (agregar la columna si no existe):

   ```sql
   -- Si la columna no existe, créala primero:
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason text;
   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

   -- Luego registra:
   UPDATE profiles
      SET suspension_reason = '[Motivo detallado: fecha, infracción, quién autorizó]',
          suspended_at      = now()
    WHERE user_id = '[user_id]';
   ```

4. Notifica al usuario suspendido:

   ```sql
   SELECT send_notification(
     '[user_id]'::uuid,
     'general',
     'Tu cuenta ha sido suspendida',
     'Tu cuenta en Ziteo fue suspendida por incumplimiento de los términos de uso. Para apelar, escríbenos a soporte@ziteo.bo.'
   );
   ```

5. Para rehabilitar una cuenta suspendida:

   ```javascript
   await supabase.auth.admin.updateUserById('[user_id]', { ban_duration: 'none' })
   ```

---

## Procedimiento 4: Resolver una disputa manualmente

### Cuándo usar esto

Un constructor y un proveedor tienen una disputa abierta (`status = 'open'`) que no se resolvió automáticamente y requiere intervención del equipo.

### Pasos

1. Consulta las disputas abiertas:

   ```sql
   SELECT
     d.id,
     d.order_id,
     d.reason,
     d.details,
     d.created_at,
     p.name AS creador,
     o.total,
     o.status AS estado_orden
   FROM disputes d
   JOIN profiles p ON p.user_id = d.created_by
   JOIN orders o ON o.id = d.order_id
   WHERE d.status = 'open'
   ORDER BY d.created_at ASC;
   ```

2. Revisa la orden involucrada y los comprobantes:

   ```sql
   SELECT
     o.id,
     o.total,
     o.status,
     o.payment_evidence_url,
     o.payment_rejection_reason,
     pc.name AS constructor,
     pp.name AS proveedor
   FROM orders o
   JOIN profiles pc ON pc.user_id = o.constructor_id
   JOIN profiles pp ON pp.user_id = o.provider_id
   WHERE o.id = '[order_id de la disputa]';
   ```

3. Marca la disputa como resuelta (service-role bypasses la RLS que bloquea UPDATE para usuarios normales):

   ```sql
   UPDATE disputes
      SET status      = 'resolved',
          resolved_at = now(),
          details     = details || E'\n\n[Resolución 2026-XX-XX] [Detalle de la resolución y decisión tomada por el equipo]'
    WHERE id = '[dispute_id]';
   ```

4. Notifica a ambas partes con la decisión:

   ```sql
   -- Obtener los IDs de las partes
   SELECT o.constructor_id, o.provider_id
     FROM disputes d
     JOIN orders o ON o.id = d.order_id
    WHERE d.id = '[dispute_id]';

   -- Notificar al constructor
   SELECT send_notification(
     '[constructor_id]'::uuid,
     'dispute',
     'Disputa resuelta',
     '[Descripción de la resolución. Ej: El proveedor fue notificado de reemitir el pedido sin costo adicional.]'
   );

   -- Notificar al proveedor
   SELECT send_notification(
     '[provider_id]'::uuid,
     'dispute',
     'Disputa resuelta',
     '[Descripción de la resolución para el proveedor.]'
   );
   ```

5. Si corresponde un reembolso, sigue el Procedimiento 2 de este runbook.

---

## Procedimiento 5: Contacto de emergencia con usuarios

### Cuándo usar esto

Hay un incidente activo que afecta a todos los usuarios o a un grupo específico: caída del servicio, error masivo en pagos, corrupción de datos.

### Canal principal

WhatsApp Business de Ziteo. Para incidentes graves que afectan muchos usuarios, usar un mensaje de difusión.

### Plantilla de mensaje — Incidente en curso

```
[AVISO ZITEO] Estimado usuario,

Actualmente estamos experimentando un problema técnico que puede afectar [descripción breve: el procesamiento de pagos / la visualización de pedidos / el acceso a la app].

Nuestro equipo está trabajando en la solución. Estimamos resolver la situación en [tiempo estimado: 30 minutos / 2 horas / etc.].

Sus datos y pedidos están seguros. No es necesario que realice ninguna acción.

Le informaremos cuando el servicio esté completamente restablecido.

Disculpe las molestias.
— Equipo Ziteo
```

### Plantilla de mensaje — Incidente resuelto

```
[AVISO ZITEO] Estimado usuario,

El problema técnico reportado anteriormente ha sido resuelto. El servicio de Ziteo opera con normalidad desde las [hora] de hoy.

Si nota algún inconveniente adicional, escríbanos directamente a este número.

Gracias por su paciencia.
— Equipo Ziteo
```

### Plantilla de mensaje — Mantenimiento programado

```
[AVISO ZITEO] Le informamos que el día [fecha] de [hora inicio] a [hora fin] realizaremos mantenimiento programado en nuestra plataforma.

Durante ese período la app puede estar temporalmente inaccesible.

Recomendamos completar sus pedidos o gestiones antes de esa franja horaria.

Gracias por confiar en Ziteo.
— Equipo Ziteo
```

### Pasos para el incidente

1. Detectar y confirmar el incidente (logs en Supabase Dashboard > Logs, o alertas de Sentry).
2. Avisar al canal interno del equipo (WhatsApp o Slack del equipo Ziteo).
3. Si el incidente afecta usuarios activos, enviar el mensaje de "Incidente en curso" dentro de los primeros 10 minutos.
4. Resolver el problema técnico siguiendo el procedimiento correspondiente de este runbook.
5. Enviar el mensaje de "Incidente resuelto" una vez confirmada la normalidad.
6. Documentar el incidente: qué pasó, cuánto duró, cuántos usuarios se vieron afectados, y qué se hizo para prevenirlo en el futuro. Guardar ese registro en `docs/incidentes/AAAA-MM-DD_descripcion.md`.

---

*Este runbook debe actualizarse cada vez que cambie la arquitectura del sistema o se agreguen nuevos procedimientos.*
