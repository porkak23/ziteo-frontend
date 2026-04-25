// src/features/auth/schemas/authSchemas.ts
import { z } from 'zod';
import { USER_ROLE_VALUES } from '../constants/authConstants';

// ─── Primitivos reutilizables ──────────────────────────────────────────────────

const bolivianPhoneSchema = z
  .string({ required_error: 'El número de celular es obligatorio' })
  .regex(
    /^\+591[678]\d{7}$/,
    'El celular debe tener formato boliviano válido: +591 seguido de 7 u 8 y 7 dígitos más'
  );

const pinSchema = z
  .string({ required_error: 'El PIN es obligatorio' })
  .regex(/^\d{4}$/, 'El PIN debe tener exactamente 4 dígitos numéricos');

const userRoleSchema = z.enum(USER_ROLE_VALUES, {
  required_error: 'Debes elegir un rol',
  invalid_type_error: 'El rol seleccionado no es válido',
});

// ─── registerSchema ────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  phone: bolivianPhoneSchema,
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 letras')
    .max(100, 'El nombre no puede pasar de 100 caracteres')
    .regex(
      /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/,
      'El nombre solo puede tener letras y espacios'
    ),
  city: z
    .string({ required_error: 'La ciudad es obligatoria' })
    .min(2, 'La ciudad debe tener al menos 2 caracteres')
    .max(100, 'La ciudad no puede pasar de 100 caracteres'),
  pin: pinSchema,
  pin_confirm: pinSchema,
  initial_role: userRoleSchema,
}).refine((data) => data.pin === data.pin_confirm, {
  message: 'Los PINes no coinciden, fíjate bien',
  path: ['pin_confirm'],
});

// ─── loginSchema ───────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  phone: bolivianPhoneSchema,
  pin: pinSchema,
});

// ─── otpSchema ─────────────────────────────────────────────────────────────────

export const otpSchema = z.object({
  phone: bolivianPhoneSchema,
  otp: z
    .string({ required_error: 'El código OTP es obligatorio' })
    .regex(/^\d{6}$/, 'El código debe tener exactamente 6 dígitos'),
});

// ─── switchRoleSchema ──────────────────────────────────────────────────────────

export const switchRoleSchema = z.object({
  new_role: userRoleSchema,
});

// ─── Tipos inferidos ───────────────────────────────────────────────────────────

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData    = z.infer<typeof loginSchema>;
export type OtpFormData      = z.infer<typeof otpSchema>;
export type SwitchRoleData   = z.infer<typeof switchRoleSchema>;
