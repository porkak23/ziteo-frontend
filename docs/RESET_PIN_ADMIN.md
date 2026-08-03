# Reset de PIN por admin

**Contexto:** desde el 2026-08-01 el registro corre con `OTP_VERIFICATION_REQUIRED=false`
(ver `docs/OTP_FIREBASE.md`). Sin OTP no hay autoservicio de "olvidé mi PIN":
`auth-forgot-pin` depende del proveedor OTP, que hoy no entrega SMS. Mientras eso
siga así, **el reset lo hace un admin**.

## Vía principal: panel God Mode (desde 2026-08-01)

`https://www.ziteo.company/?godmode` → pestaña **Usuarios** → buscar por nombre
o teléfono → abrir el detalle → marcar el check de verificación de identidad →
**Generar nuevo PIN** → **Confirmar reset de PIN**.

Requiere que la cuenta admin tenga la **verificación en dos pasos (TOTP) activa**
— la Edge Function `admin-user-actions` exige `aal2` (`_shared/require-admin.ts`,
`requireAdmin(req, {mfa:true})`); sin el segundo factor la acción devuelve
`403 FORBIDDEN`, aunque el resto del panel (lectura) funcione igual. Enrolar
TOTP desde el propio panel al entrar por primera vez.

El `SERVICE_ROLE_KEY` nunca sale de la Edge Function ni pasa por manos humanas
en este camino — es la razón por la que existe. Cada reset queda registrado en
`admin_audit_log` (append-only, no editable ni por el owner de la BD).

## Vía de emergencia: SQL / Dashboard manual

Solo si el panel no está disponible (caída, sin admin con MFA a mano, etc).
Es el procedimiento anterior a esta pantalla — sigue funcionando pero expone
el `SERVICE_ROLE_KEY` a quien lo ejecute, así que es el último recurso, no
la rutina.

El PIN es la contraseña del usuario en Supabase Auth — el email es sintético,
derivado del teléfono. **No se toca `profiles.pin_hash`**: esa columna es un
placeholder (`'managed_by_supabase_auth'`), no la credencial real.

### 1. Verificar la identidad de quien pide el reset

Antes de tocar nada. El teléfono es la única credencial del sistema; un reset
concedido a la persona equivocada entrega la cuenta completa. Confirmar por un
canal fuera de la app (llamada al número registrado) y contrastar con el nombre
y la ciudad que figuran en `profiles`.

```sql
select user_id, name, phone, city, active_role, created_at
from profiles where phone = '+591XXXXXXXX';
```

### 2. Resetear el PIN

Vía Dashboard de Supabase (recomendado, sin SQL):
**Authentication → Users** → buscar `591XXXXXXXX@phone.ziteo.bo` →
**Reset password** → poner el PIN nuevo de 6 dígitos.

Vía API de admin (si se prefiere script):

```bash
SERVICE_KEY='<service_role key>'
USER_ID='<user_id de la consulta anterior>'
curl -s -X PUT "https://yvqbubjfhmuztknmhyvd.supabase.co/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password":"NNNNNN"}'
```

El PIN debe ser exactamente **6 dígitos numéricos** — `auth-login` valida
`/^\d{6}$/` y rechaza cualquier otra cosa antes de consultar la base.

### 3. Entregar el PIN y verificar

Comunicar el PIN nuevo por el canal ya verificado en el paso 1, e indicar que lo
cambie desde la app. Comprobar que quedó operativo:

```bash
curl -s -X POST "https://yvqbubjfhmuztknmhyvd.supabase.co/functions/v1/auth-login" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -H "Origin: https://www.ziteo.company" \
  -d '{"phone":"+591XXXXXXXX","pin":"NNNNNN"}'
```

Un `access_token` en la respuesta = listo.

## Si el usuario quedó bloqueado por throttle

`auth-login` corta a los **5 intentos fallidos por teléfono cada 15 minutos**.
Alguien que estuvo probando PINs de memoria llega bloqueado al pedir el reset, y
seguirá fallando aunque el PIN nuevo sea correcto. Para liberarlo sin esperar:

```sql
delete from auth_throttle where identifier = 'login:+591XXXXXXXX';
```

## Cuándo dejar de hacer esto manualmente

El panel resuelve el problema de exponer el `SERVICE_ROLE_KEY`, pero sigue
siendo intervención humana. Se retira del todo cuando el OTP vuelva a entregar
mensajes: ahí `OTP_VERIFICATION_REQUIRED=true` reactiva el registro verificado
y `auth-forgot-pin` vuelve a ser autoservicio real.

## Cómo entrar al panel y otorgar el rol admin

Ver `docs/RUNBOOK.md` — el acceso pasa por `?godmode` en la URL (no es un
control de seguridad, solo reduce exposición accidental; el acceso real lo
decide `is_admin()` en Postgres) y el rol se otorga por `grant_admin_role()`
desde el SQL Editor, nunca desde el cliente
(`supabase/migrations/20260801000002_admin_role_hardening.sql`).
