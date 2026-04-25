import type { UserRole } from '../types/authTypes'

export const PIN_LENGTH = 8
export const OTP_LENGTH = 6
export const OTP_EXPIRY_SECONDS = 300

export const BOLIVIAN_CITIES = [
  'La Paz',
  'Santa Cruz de la Sierra',
  'Cochabamba',
  'Sucre',
  'Oruro',
  'Potosí',
  'Tarija',
  'Trinidad',
  'Cobija',
  'El Alto',
  'Sacaba',
] as const

export type BolivianCity = (typeof BOLIVIAN_CITIES)[number]

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
  WHATSAPP_SEND_FAILED: 'No se pudo enviar el código, intenta de nuevo',
  HTTP_404: 'Servicio no disponible en este momento',
  HTTP_500: 'Error del servidor, intenta de nuevo',
  UNKNOWN: 'Ocurrió un error, intenta de nuevo',
}
