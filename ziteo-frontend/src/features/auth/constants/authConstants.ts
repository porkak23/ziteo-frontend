import type { UserRole } from '../types/authTypes'
import { CIUDADES_ACTIVAS } from '../../../shared/constants/geography'
export type { CiudadActiva as BolivianCity } from '../../../shared/constants/geography'

export const PIN_LENGTH = 6
export const OTP_LENGTH = 6
export const OTP_EXPIRY_SECONDS = 300

// Re-exportado desde la fuente canónica para no romper importaciones existentes.
export const BOLIVIAN_CITIES = CIUDADES_ACTIVAS

export const USER_ROLES: Record<UserRole, string> = {
  constructor: 'Constructor',
  proveedor: 'Proveedor',
  maestro: 'Maestro de Obra',
  chofer: 'Chofer',
}

export const AUTH_ERRORS: Record<string, string> = {
  PHONE_ALREADY_REGISTERED: 'Este número ya tiene una cuenta',
  INVALID_PIN: 'Contraseña incorrecta',
  INVALID_PIN_FORMAT: 'La contraseña debe tener exactamente 6 dígitos',
  INVALID_EMAIL: 'El correo electrónico no es válido',
  INVALID_OTP: 'El código no es válido',
  OTP_EXPIRED: 'El código expiró, solicita uno nuevo',
  INVALID_PHONE_FORMAT: 'El número no es válido, debe ser boliviano',
  USER_NOT_FOUND: 'No encontramos una cuenta con ese número',
  PROFILE_UPDATE_FAILED: 'No se pudo guardar el perfil, intenta de nuevo',
  RESET_FAILED: 'No se pudo actualizar la contraseña, intenta de nuevo',
  HTTP_404: 'Servicio no disponible en este momento',
  HTTP_500: 'Error del servidor, intenta de nuevo',
  UNKNOWN: 'Ocurrió un error, intenta de nuevo',
}

export const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-phone-number': 'El número de teléfono no es válido',
  'auth/too-many-requests': 'Demasiados intentos, espera unos minutos',
  'auth/invalid-verification-code': 'El código de verificación no es válido',
  'auth/code-expired': 'El código expiró, solicita uno nuevo',
  'auth/missing-phone-number': 'Ingresa un número de teléfono',
  'auth/network-request-failed': 'Error de conexión, intenta de nuevo',
  'auth/quota-exceeded': 'Límite de mensajes alcanzado en Firebase, intenta más tarde',
  'auth/captcha-check-failed': 'Verificación de reCAPTCHA fallida, intenta de nuevo',
  'auth/web-storage-unsupported': 'Tu navegador no soporta esta función',
  'auth/session-expired': 'La sesión expiró, solicita un nuevo código',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Console (Authentication > Settings > Authorized Domains)',
  'auth/operation-not-allowed': 'El inicio de sesión por teléfono no está activado en Firebase Console',
  'auth/invalid-app-credential': 'Credencial de aplicación o API Key no válida en Firebase',
  'auth/app-not-authorized': 'Aplicación no autorizada para autenticación telefónica en Firebase',
  'auth/popup-closed-by-user': 'Se cerró la ventana de verificación',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada en Firebase',
  'auth/internal-error': 'Error interno de Firebase. Inténtalo de nuevo',
  'auth/argument-error': 'Error en la configuración de verificación de teléfono',
  // Firebase bloquea el SMS a números reales con este código cuando la protección
  // anti-fraude (SMS Toll Fraud Protection) rechaza el envío. Los números de prueba
  // no pasan por ese control, por eso "funcionan" y dan una señal falsa.
  // Se apaga en Google Cloud → Identity Platform → Settings → Security.
  'auth/error-code:-39': 'No pudimos enviar el SMS a este número. Intenta más tarde o contacta soporte.',
  'auth/error-code': 'No pudimos enviar el SMS a este número. Intenta más tarde o contacta soporte.',
}

