import type { ConfirmationResult, RecaptchaVerifier as RecaptchaVerifierType } from 'firebase/auth'
import type { ClientOtpProvider } from './types'
import { RECAPTCHA_CONTAINER_ID } from './constants'

let pendingConfirmation: ConfirmationResult | null = null
let recaptchaVerifierInstance: RecaptchaVerifierType | null = null

/**
 * Devuelve el ancla del widget invisible de reCAPTCHA, creándola solo si falta.
 *
 * Importante: NO destruir el nodo existente. Este contenedor es propiedad
 * exclusiva de este módulo, pero un `.remove()` incondicional también borraría
 * un nodo montado por React si alguna pantalla lo renderizara, dejando el
 * widget colgado en los reintentos. Vaciarlo es suficiente para reinstanciarlo.
 */
function ensureRecaptchaContainer(): HTMLElement {
  const existing = document.getElementById(RECAPTCHA_CONTAINER_ID)
  if (existing) {
    existing.innerHTML = ''
    return existing
  }
  const element = document.createElement('div')
  element.id = RECAPTCHA_CONTAINER_ID
  element.style.display = 'none'
  document.body.appendChild(element)
  return element
}

export const firebaseClientProvider: ClientOtpProvider = {
  name: 'firebase',

  requestCode: async (phone: string) => {
    const { getAuth, RecaptchaVerifier, signInWithPhoneNumber } = await import('firebase/auth')
    const { getFirebaseApp } = await import('../../../lib/firebaseClient')

    // Limpiar instancia previa de reCAPTCHA si existe
    if (recaptchaVerifierInstance) {
      try {
        recaptchaVerifierInstance.clear()
      } catch (e) {
        console.warn('[Firebase Auth] No se pudo limpiar reCAPTCHA previo:', e)
      }
      recaptchaVerifierInstance = null
    }

    ensureRecaptchaContainer()

    // Formatear teléfono a E.164 (+591 para Bolivia)
    const cleanDigits = phone.replace(/\D/g, '')
    const formattedPhone = phone.startsWith('+')
      ? phone
      : cleanDigits.startsWith('591')
        ? `+${cleanDigits}`
        : `+591${cleanDigits}`

    const auth = getAuth(getFirebaseApp())
    recaptchaVerifierInstance = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA resuelto automáticamente
      },
      'expired-callback': () => {
        console.warn('[Firebase Auth] El token de reCAPTCHA ha expirado')
      },
    })

    try {
      pendingConfirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierInstance)
      if (import.meta.env.DEV) {
        // Firebase resuelve igual de "exitoso" un número ficticio que uno real,
        // pero los ficticios NUNCA reciben un SMS: esperan el código fijo de la
        // consola. Si el código no llega, revisar esa lista antes que nada.
        console.info(
          `[Firebase Auth] Código solicitado para ${formattedPhone}. Si no llega ningún SMS, ` +
          'verificar que el número no esté en Authentication → Sign-in method → Phone → ' +
          '"Phone numbers for testing" (esos números nunca reciben SMS real).'
        )
      }
    } catch (error) {
      if (recaptchaVerifierInstance) {
        try {
          recaptchaVerifierInstance.clear()
        } catch {
          // ignorar error de limpieza
        }
        recaptchaVerifierInstance = null
      }
      throw error
    }
  },

  getProof: async (code: string) => {
    if (!pendingConfirmation) {
      throw new Error('auth/session-expired')
    }
    const { getAuth, signOut } = await import('firebase/auth')
    const { getFirebaseApp } = await import('../../../lib/firebaseClient')

    // Si confirm() lanza (código de 6 dígitos incorrecto), dejamos que el error
    // suba sin limpiar `pendingConfirmation`: así el usuario reintenta el código
    // sin gastar un SMS nuevo.
    const result = await pendingConfirmation.confirm(code)
    const idToken = await result.user.getIdToken()

    // No dejamos sesión de Firebase viva — la sesión real de la app sigue
    // siendo la de Supabase (PIN). El ID token ya quedó capturado arriba.
    await signOut(getAuth(getFirebaseApp()))
    pendingConfirmation = null

    if (recaptchaVerifierInstance) {
      try {
        recaptchaVerifierInstance.clear()
      } catch {
        // ignorar error de limpieza
      }
      recaptchaVerifierInstance = null
    }

    return idToken
  },
}
