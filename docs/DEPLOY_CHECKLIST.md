# Ziteo — Checklist de Deploy para Beta PWA

Sigue estos pasos EN ORDEN. Los marcados con [AUTO] ya están hechos en código.

---

## PASO 1 — Supabase: correr migraciones

1. Abre tu proyecto en https://supabase.com/dashboard
2. Ve a **SQL Editor**
3. Abre el archivo `docs/SETUP_SUPABASE.sql` (1146 líneas)
4. Pega el contenido completo y ejecuta
5. Verifica que no haya errores rojos

---

## PASO 2 — Supabase: Storage buckets

En tu dashboard Supabase → **Storage** → **New bucket**:

| Bucket          | Public | Para qué                          |
|-----------------|--------|-----------------------------------|
| `product-images`| Sí     | Fotos de productos del proveedor  |
| `payment-proofs`| No     | Comprobantes de pago (privado)    |

Para `payment-proofs`, una vez creado ve a **Policies** y agrega:
- INSERT: `auth.uid() IS NOT NULL`
- SELECT: `auth.uid() IS NOT NULL`

---

## PASO 3 — Supabase: pg_cron para expirar pedidos

En **SQL Editor**:

```sql
-- Habilitar pg_cron (solo si no está habilitado)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Expirar pedidos pendientes cada 5 minutos
SELECT cron.schedule(
  'expire-pending-orders',
  '*/5 * * * *',
  $$SELECT expire_pending_orders()$$
);
```

---

## PASO 4 — Supabase: VAPID keys para push notifications

En tu terminal (en la carpeta ziteo-frontend):

```bash
node scripts/generate-vapid-keys.mjs
```

Copia los valores que aparecen y agrégalos en Supabase → **Settings** → **Edge Functions** → **Secrets**:
- `VAPID_PUBLIC_KEY` = la clave pública (empieza con BG...)
- `VAPID_PRIVATE_KEY` = la clave privada
- `VAPID_SUBJECT` = `mailto:tu@email.com`

---

## PASO 5 — Supabase: deploy Edge Functions

En tu terminal (requiere Supabase CLI instalado):

```bash
# Instalar CLI si no lo tienes
npm install -g supabase

# Login
supabase login

# Deploy todas las funciones (reemplaza <tu-project-ref>)
supabase functions deploy auth --project-ref <tu-project-ref>
supabase functions deploy notifications --project-ref <tu-project-ref>
```

El `project-ref` lo encuentras en Supabase → Settings → General (ej: `yvqbubjfhmuztknmhyvd`).

---

## PASO 6 — Vercel: conectar y desplegar

1. Ve a https://vercel.com → **Add New Project**
2. Importa el repo de GitHub (este repositorio)
3. En configuración del proyecto:
   - **Root Directory**: `ziteo-frontend`
   - **Framework**: Vite (lo detecta automático)
4. En **Environment Variables** agrega:

| Variable                    | Valor                           | Dónde conseguirlo                      |
|-----------------------------|---------------------------------|----------------------------------------|
| `VITE_SUPABASE_URL`         | Tu URL de Supabase              | Supabase → Settings → API             |
| `VITE_SUPABASE_ANON_KEY`    | Tu anon key de Supabase         | Supabase → Settings → API             |
| `VITE_FIREBASE_API_KEY`     | Tu Firebase API key             | Firebase Console → Project Settings   |
| `VITE_FIREBASE_PROJECT_ID`  | Tu Firebase project ID          | Firebase Console → Project Settings   |
| `VITE_FIREBASE_APP_ID`      | Tu Firebase App ID              | Firebase Console → Project Settings   |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID            | Firebase Console → Project Settings   |
| `VITE_POSTHOG_KEY`          | (opcional para beta)            | https://posthog.com → Project → API   |
| `VITE_SENTRY_DSN`           | (opcional para beta)            | https://sentry.io → Project → DSN     |

5. Haz click en **Deploy**

---

## PASO 7 — Dominio (opcional para beta)

Puedes usar el dominio gratuito de Vercel (`ziteo.vercel.app`) para el beta.

Si tienes un dominio propio:
1. Vercel → tu proyecto → **Domains** → Add domain
2. Apunta el DNS a Vercel según las instrucciones

---

## PASO 8 — Probar la instalación PWA

1. Abre la URL en Chrome Android
2. Espera que cargue completamente
3. El navegador muestra "Agregar a pantalla de inicio"
4. Toca el banner o ve al menú → Añadir a pantalla de inicio
5. La app queda como ícono naranja con "Z" en el homescreen

---

## VARIABLES YA CONFIGURADAS [AUTO]

- `vercel.json` — SPA routing + cache headers para SW
- `vite.config.ts` — PWA manifest, Workbox, code splitting
- `public/icons/` — Íconos PNG reales (192 y 512, con maskable)
- `public/sw-push.js` — Handler de push notifications
- `public/.well-known/assetlinks.json` — Para TWA (futuro)

---

## PARA MANDAR A LOS TESTERS

Una vez que Vercel haya desplegado, manda este mensaje por WhatsApp:

> "Abri el link en Chrome: https://[tu-url].vercel.app
> Cuando cargue, toca el banner que dice 'Agregar a pantalla de inicio'
> Abrí la app e ingresá con tu teléfono"
