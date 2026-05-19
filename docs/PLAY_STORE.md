# Publicar Ziteo en Google Play Store (TWA)

Un TWA (Trusted Web Activity) empaqueta la PWA de Ziteo como una app Android nativa
sin escribir código nativo. Google Play la distribuye como cualquier otra app.

---

## Prerrequisitos

### 1. Bubblewrap CLI
```bash
npm install -g @bubblewrap/cli
```

### 2. Java JDK 11 o superior
Descargar desde: https://adoptium.net/
Verificar: `java -version`

### 3. Android SDK (Build Tools)
Opción A — Android Studio: https://developer.android.com/studio
Opción B — Solo Command Line Tools: https://developer.android.com/studio#command-tools

Bubblewrap puede descargar el SDK automáticamente en el primer run si no está instalado.

---

## Paso 1: Generar el keystore

El keystore es el certificado que firma la app. Debe guardarse con seguridad —
si se pierde, no se puede actualizar la app en Play Store.

```bash
cd ziteo-frontend/

keytool -genkey -v \
  -keystore android.keystore \
  -alias android \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Datos sugeridos al completar el asistente:
- First and last name: Ziteo
- Organizational unit: Tech
- Organization: Ziteo SRL
- City: Sucre
- State: Chuquisaca
- Country code: BO

**IMPORTANTE:** Hacer backup del archivo `android.keystore` y la contrasena en un
lugar seguro. Sin este archivo no se pueden publicar actualizaciones.

---

## Paso 2: Obtener el SHA256 del keystore

Este hash es necesario para que el TWA funcione sin barra de navegador
(Digital Asset Links).

```bash
keytool -list -v \
  -keystore android.keystore \
  -alias android
```

Buscar la linea que dice `SHA256:` en la seccion "Certificate fingerprints".
El formato es: `AB:CD:EF:...` (32 pares hexadecimales separados por dos puntos).

---

## Paso 3: Actualizar assetlinks.json

Editar `ziteo-frontend/public/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "bo.ziteo.app",
    "sha256_cert_fingerprints": [
      "AB:CD:EF:..."
    ]
  }
}]
```

Reemplazar `AB:CD:EF:...` con el SHA256 obtenido en el paso anterior.

Este archivo debe estar accesible en produccion en:
`https://ziteo.bo/.well-known/assetlinks.json`

Verificar con:
```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://ziteo.bo&relation=delegate_permission/common.handle_all_urls
```

---

## Paso 4: Hacer deploy del frontend con el assetlinks actualizado

```bash
cd ziteo-frontend/
npm run build
# Deploy a produccion (Vercel / servidor)
```

Confirmar que `https://ziteo.bo/.well-known/assetlinks.json` devuelve el JSON correcto
con Content-Type: application/json.

---

## Paso 5: Generar el AAB con Bubblewrap

```bash
cd ziteo-frontend/
bash scripts/build-twa.sh
```

El archivo AAB queda en:
`android/app/build/outputs/bundle/release/app-release.aab`

---

## Paso 6: Crear ficha en Google Play Console

1. Ir a https://play.google.com/console
2. Crear cuenta de desarrollador si no existe (costo unico: USD 25)
3. Crear nueva app:
   - Package ID: `bo.ziteo.app`
   - Nombre: Ziteo
   - Idioma principal: Espanol (Latinoamerica)
   - Tipo: App (no juego)
   - Gratis / de pago: Gratis

---

## Paso 7: Subir el AAB

En Play Console > Production > Create new release:
1. Subir el archivo `.aab` generado
2. Agregar notas de version (ej: "Version inicial de Ziteo 1.0")
3. Revisar y enviar

---

## Paso 8: Completar ficha de la app

### Descripcion corta (max 80 caracteres)
```
La plataforma que conecta constructores, proveedores y maestros en Bolivia.
```

### Descripcion larga (max 4000 caracteres)
```
Ziteo es la plataforma digital que transforma la industria de la construccion
en Bolivia, conectando en un solo lugar a todos los actores clave del sector.

Para Constructores:
Solicita cotizaciones de materiales a multiples proveedores en segundos.
Compara precios, gestiona tus proyectos y contrata maestros de obra verificados
directamente desde tu celular.

Para Proveedores de materiales:
Publica tu catalogo de productos, recibe pedidos en tiempo real y gestiona
tu inventario sin complicaciones. Llega a mas constructores en Sucre, Potosi
y Santa Cruz.

Para Maestros de obra:
Crea tu perfil profesional, muestra tus especialidades y recibe solicitudes de
trabajo de constructores en tu ciudad. Sin intermediarios, sin comisiones ocultas.

Para Transportistas:
Conectate con proveedores que necesitan entregar materiales y gestiona tus
rutas de manera eficiente.

Caracteristicas principales:
- Cotizaciones en tiempo real entre constructores y proveedores
- Perfil verificado para maestros de obra con especialidades y disponibilidad
- Sistema de pagos integrado con QR
- Notificaciones push para seguimiento de pedidos
- Funciona sin internet (modo offline)
- Disponible en Sucre, Potosi y Santa Cruz

Ziteo: construyendo Bolivia, juntos.
```

---

## Paso 9: Screenshots requeridos

Google Play requiere entre 2 y 8 screenshots de telefono (formato 16:9 o 9:16).
Dimensiones recomendadas: 1080x1920 px.

Pantallas sugeridas para capturar:
1. Pantalla de bienvenida con el logo de Ziteo
2. Dashboard del constructor con solicitudes de cotizacion
3. Catalogo de productos del proveedor
4. Perfil de maestro de obra con especialidades
5. Pantalla de cotizacion comparando precios
6. Notificaciones en tiempo real

Herramienta: usar el emulador de Android Studio o un dispositivo fisico
con Android 5.0+ (API 21+).

---

## Paso 10: Politicas requeridas

Antes de publicar, completar en Play Console:
- Politica de privacidad: `https://ziteo.bo/privacidad`
- Formulario de seguridad de datos (que datos recopila la app)
- Clasificacion de contenido (ejecutar el cuestionario)

---

## Notas adicionales

- El proceso de revision de Google Play toma entre 1 y 7 dias habiles.
- Para actualizaciones: incrementar `appVersionCode` en `twa-manifest.json`,
  regenerar el AAB y subir a una nueva release en Play Console.
- Si el SHA256 del keystore cambia (no debe ocurrir), actualizar assetlinks.json
  y hacer deploy antes de publicar la nueva version.
