import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'

let _auth: Auth | null = null

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if (!apiKey) {
    throw new Error('Firebase no está configurado. Agrega las variables VITE_FIREBASE_* al archivo .env')
  }

  const app: FirebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        apiKey,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      })

  _auth = getAuth(app)
  return _auth
}
