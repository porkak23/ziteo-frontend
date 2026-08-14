# Publicar Ziteoo en Google Play Store

**Camino elegido: Capacitor** (app nativa que embebe la PWA), package
**`com.ziteo.app`**. El camino alternativo (TWA/Bubblewrap con `bo.ziteo.app`)
se eliminó del repo el 2026-08-11 porque generaba el AAB en la misma ruta y
sobrescribía el proyecto Capacitor.

> Este documento **reemplazó** a la guía TWA anterior (Bubblewrap, `bo.ziteo.app`).
> Si alguna vez hace falta recuperarla: `git show fe4a4b9:docs/PLAY_STORE.md`.
> Junto con ella se borraron `twa-manifest.json`, `scripts/build-twa.sh` y
> `public/.well-known/assetlinks.json`.

---

## Estado actual

### Listo (no tocar)
- `targetSdk 36` / `compileSdk 36` — supera el mínimo de Play (API 35)
- `minSdk 24` (Android 7.0)
- Sin `server.url` remoto en `capacitor.config.ts` → usa el bundle local, como exige Play
- Permisos completos en el Manifest (GPS, cámara, galería, notificaciones, biométrico)
- `signingConfigs.release` cableado leyendo de `android/key.properties`
- Scripts npm: `android:sync`, `android:open`, `android:build`

### Verificado con un build real (2026-08-11)
Se compiló un AAB de 19 MB en esta máquina. La firma se probó con un keystore
desechable: `jarsigner -verify` devolvió **`jar verified`**. El keystore de prueba
y su `key.properties` se borraron después.

### Bloqueantes — requieren acción tuya
| # | Qué falta | Por qué bloquea |
|---|---|---|
| 1 | **Keystore** (`.jks` + `key.properties`) | Sin firma el AAB se rechaza |
| 2 | **Íconos de marca** | Hoy son el robot verde genérico de Android Studio; Play lo rechaza |
| 3 | **`google-services.json`** | Sin él las push por FCM quedan muertas **en silencio** |
| 4 | **Assets de tienda** | Ícono 512×512, feature graphic 1024×500, screenshots |

---

## 1. Generar el keystore

⚠️ **Guardá este archivo y sus contraseñas en un lugar seguro.** Si lo perdés no
podés volver a actualizar la app en Play — hay que publicar una app nueva.

```bash
cd ziteo-frontend/android
keytool -genkey -v -keystore ziteo-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias ziteo
```

Luego creá `ziteo-frontend/android/key.properties`:

```properties
storeFile=ziteo-release.jks
storePassword=TU_PASSWORD
keyAlias=ziteo
keyPassword=TU_PASSWORD
```

Ambos archivos están en `.gitignore` y **no deben commitearse nunca**.

Para verificar que la firma quedó cableada: sin `key.properties`, el build
muestra `WARNING: android/key.properties no existe -> el AAB de release saldra
SIN FIRMAR`. Con el archivo presente, ese warning desaparece.

## 2. Íconos

Play rechaza el ícono por defecto. Con un PNG **1024×1024** de la marca:

```bash
cd ziteo-frontend
npm i -D @capacitor/assets
npx @capacitor/assets generate --android
```

Genera todos los `mipmap-*` y el splash. Los colores de marca son `#A43700`
(CTAs) y `#E8733A` (acentos) — ojo que hoy `capacitor.config.ts` usa `#0D1020`
para splash/status bar, revisá que sea lo que querés.

## 3. `google-services.json` (push notifications)

Firebase Console → proyecto `ziteo-a08f4` → Project Settings → **Add app** →
Android → package name **`com.ziteo.app`** → descargar y guardar en
`ziteo-frontend/android/app/google-services.json`.

> **Trampa:** `android/app/build.gradle` envuelve el plugin de Google Services en
> un `try/catch`. Si el archivo falta, **el build compila igual** y solo loguea un
> warning — las push simplemente no funcionan. No hay error visible.

**Además falta código:** `@capacitor/push-notifications` está instalado y
configurado en `capacitor.config.ts`, pero ningún archivo lo inicializa. El hook
actual (`src/shared/hooks/usePushNotifications.ts`) usa Web Push del navegador,
que **no funciona de forma fiable dentro del WebView de Capacitor**. Para push
nativas hay que escribir la integración con `PushNotifications.register()`.

## Requisito previo: JDK 21 — **NO el que trae Android Studio**

⚠️ **Trampa verificada el 2026-08-11.** Android Studio incluye su propio JDK
(JBR) pero es **Java 25**, y Gradle 8.14.3 no lo soporta:

```
BUG! exception in phase 'semantic analysis' in source unit '_BuildScript_'
Unsupported class file major version 69
```

(`major version 69` = Java 25.) Hay que usar **JDK 21**:

```bash
winget install --id EclipseAdoptium.Temurin.21.JDK -e --source winget
```

Y apuntar `JAVA_HOME` ahí antes de compilar — no al JBR de Studio:

```bash
export JAVA_HOME="/c/Program Files/Eclipse Adoptium/jdk-21.0.12.8-hotspot"
export ANDROID_HOME="$HOME/AppData/Local/Android/Sdk"
export PATH="$JAVA_HOME/bin:$PATH"
java -version   # debe decir 21.x, NO 25.x
```

### Android SDK

Android Studio **no trae `sdkmanager`**. Command line tools + SDK 36:

```bash
# 1) cmdline-tools -> ~/AppData/Local/Android/Sdk/cmdline-tools/latest/
curl -L -o clt.zip https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip
# (descomprimir y renombrar la carpeta interna a "latest")

# 2) licencias + paquetes
yes | sdkmanager --licenses
sdkmanager "platforms;android-36" "build-tools;36.0.0" "platform-tools"
```

### `local.properties`

Gradle necesita saber dónde está el SDK. Crear `android/local.properties`
(ya está en `.gitignore`), con los backslashes **escapados**:

```properties
sdk.dir=C:\Users\<usuario>\AppData\Local\Android\Sdk
```

### Estado verificado

Con todo lo anterior, el 2026-08-11 se compiló un **AAB de 19 MB** en esta
máquina:

| Escenario | Resultado |
|---|---|
| Sin `key.properties` | `BUILD SUCCESSFUL` + warning explícito; `jarsigner` dice `jar is unsigned` |
| Con `key.properties` válido | `BUILD SUCCESSFUL`; `jarsigner -verify` dice **`jar verified`** |
| `storeFile` con ruta inválida | Falla en `:app:validateSigningRelease` nombrando el archivo que falta |

> `storeFile` se resuelve **relativo a `android/app/`**. Usar ruta absoluta de
> Windows (`C:\...`) o el keystore junto al `build.gradle`.

## 4. Compilar el AAB

```bash
cd ziteo-frontend
npm run android:build
```

Salida: `android/app/build/outputs/bundle/release/app-release.aab`

Para abrir en Android Studio y depurar: `npm run android:open`.

## 5. Subir a Play Console

1. Play Console → Create app → nombre "Ziteoo", español (Bolivia)
2. Subir el AAB en **Internal testing** primero (no producción)
3. Completar: política de privacidad (URL pública obligatoria), content rating,
   data safety, público objetivo
4. Agregar testers por email y compartir el link de opt-in

---

## Versionado

`android/app/build.gradle` → `versionCode` y `versionName`.

**Subí `versionCode` en cada subida** — Play rechaza reutilizar uno. `versionName`
es la cadena visible ("1.0.0"); `versionCode` es un entero que solo crece.

## Notas

- El primer `npm run android:sync` es importante: los assets dentro de `android/`
  eran del 13 de mayo (unos 3 meses de atraso) y faltaba enlazar
  `@aparajita/capacitor-biometric-auth`.
- `minifyEnabled false` en release: el AAB pesa más de lo necesario. Activarlo
  requiere revisar reglas de ProGuard; no es bloqueante para publicar.
- `allowBackup="true"` es el default de Android: permite backup automático de los
  datos de la app. Revisar si es aceptable dado que se guardan sesiones.
- **Firebase PNV** (verificación de teléfono sin SMS ni reCAPTCHA) es Android-only
  y sería la salida definitiva al problema del OTP — ver `docs/OTP_FIREBASE.md`.
  Requiere el SDK `com.google.firebase:firebase-pnv` y Android Credential Manager.
