import type { UserRole } from '../types/authTypes'
import { CIUDADES_ACTIVAS } from '../../../shared/constants/geography'
export type { CiudadActiva as BolivianCity } from '../../../shared/constants/geography'

export const PIN_LENGTH = 8
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
  INVALID_PIN_FORMAT: 'La contraseña debe tener exactamente 8 dígitos',
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
  'auth/quota-exceeded': 'Límite de mensajes alcanzado, intenta más tarde',
  'auth/captcha-check-failed': 'Verificación de seguridad fallida, intenta de nuevo',
  'auth/web-storage-unsupported': 'Tu navegador no soporta esta función',
  'auth/session-expired': 'La sesión expiró, solicita un nuevo código',
}
