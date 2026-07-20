import type { ConfirmationResult } from 'firebase/auth'
import type { ClientOtpProvider } from './types'
import { RECAPTCHA_CONTAINER_ID } from './constants'

let pendingConfirmation: ConfirmationResult | null = null

// El div del reCAPTCHA invisible lo monta OtpVerificationSheet; si por algún
// motivo no está en el DOM (pantalla saltada, HMR, etc.) lo creamos aquí para
// no romper el flujo.
function ensureRecaptchaContainer(): void {
  if (document.getElementById(RECAPTCHA_CONTAINER_ID)) return
  const div = document.createElement('div')
  div.id = RECAPTCHA_CONTAINER_ID
  div.style.display = 'none'
  document.body.appendChild(div)
}

export const firebaseClientProvider: ClientOtpProvider = {
  name: 'firebase',

  requestCode: async (phone: string) => {
    const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth')
    const { getFirebaseApp } = await import('../../../lib/firebaseClient')

    ensureRecaptchaContainer()

    const auth = getAuth(getFirebaseApp())
    const verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, { size: 'invisible' })

    pendingConfirmation = await signInWithPhoneNumber(auth, phone, verifier)
  },

  getProof: async (code: string) => {
    if (!pendingConfirmation) {
      throw new Error('auth/session-expired')
    }
    const { getAuth, signOut } = await import('firebase/auth')
    const { getFirebaseApp } = await import('../../../lib/firebaseClient')

    const result = await pendingConfirmation.confirm(code)
    const idToken = await result.user.getIdToken()

    // No dejamos sesión de Firebase viva — la sesión real de la app sigue
    // siendo la de Supabase (PIN). El ID token ya quedó capturado arriba.
    await signOut(getAuth(getFirebaseApp()))
    pendingConfirmation = null

    return idToken
  },
}
