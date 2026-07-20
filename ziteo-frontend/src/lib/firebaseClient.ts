// firebaseClient.ts — init lazy de Firebase, solo se importa cuando
// VITE_OTP_PROVIDER=firebase (ver features/auth/otp/index.ts). Si el proveedor
// activo es whatsapp, este módulo nunca se descarga en el bundle.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'

let app: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp {
  if (app) return app
  if (getApps().length > 0) {
    app = getApps()[0]
    return app
  }
  app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  })
  return app
}
