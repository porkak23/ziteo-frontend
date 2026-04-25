// src/features/auth/constants/authConstants.ts
import type { UserRole } from '../types/authTypes';

// ─── Ciudades de Bolivia ───────────────────────────────────────────────────────

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
] as const;

export type BolivianCity = (typeof BOLIVIAN_CITIES)[number];

// ─── Roles de usuario ─────────────────────────────────────────────────────────
// USER_ROLE_VALUES es un tuple mutable-to-const para poder pasarlo a z.enum()

export const USER_ROLE_VALUES = [
  'constructor',
  'proveedor',
  'maestro',
  'chofer',
] as const satisfies [UserRole, ...UserRole[]];

/** Labels de display por rol, para UI */
export const USER_ROLES: Record<UserRole, string> = {
  constructor: 'Constructor',
  proveedor:   'Proveedor / Ferretero',
  maestro:     'Maestro de obra',
  chofer:      'Chofer / Transportista',
};

// ─── Mensajes de error de la API ───────────────────────────────────────────────

export const AUTH_ERRORS: Record<string, string> = {
  PHONE_ALREADY_REGISTERED:
    'Ese número ya está registrado. Intenta ingresar o recupera tu cuenta.',
  INVALID_PIN:
    'El PIN ingresado es incorrecto. Vuelve a intentarlo.',
  INVALID_OTP:
    'El código de verificación no es válido. Fíjate bien o solicita uno nuevo.',
  OTP_EXPIRED:
    'El código expiró. Solicita un código nuevo e inténtalo de nuevo.',
  INVALID_PHONE_FORMAT:
    'El formato del número no es válido. Debe ser +591 seguido de 8 dígitos.',
  USER_NOT_FOUND:
    'No encontramos una cuenta con ese número. ¿Quieres registrarte?',
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

// ─── Constantes de PIN / OTP ───────────────────────────────────────────────────

export const PIN_LENGTH          = 4  as const;
export const OTP_LENGTH          = 6  as const;
export const OTP_EXPIRY_SECONDS  = 300 as const; // 5 minutos
