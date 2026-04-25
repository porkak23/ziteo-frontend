import { z } from 'zod'
import { PIN_LENGTH, OTP_LENGTH } from '../constants/authConstants'

const phoneBolivia = z
  .string()
  .regex(/^\+591[678]\d{7}$/, 'El número debe ser boliviano: +591 seguido de 8 dígitos')

const pin = z
  .string()
  .length(PIN_LENGTH, `La contraseña debe tener exactamente ${PIN_LENGTH} dígitos`)
  .regex(/^\d+$/, 'La contraseña solo puede tener números')

const email = z
  .string()
  .email('El correo electrónico no es válido')
  .optional()
  .or(z.literal(''))

export const registerSchema = z
  .object({
    phone: phoneBolivia,
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre es muy largo')
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Solo letras y espacios pues'),
    email,
    city: z.string().min(2, 'Elige tu ciudad').max(100),
    pin,
    confirmPin: pin,
    initial_role: z.enum(['constructor', 'proveedor', 'maestro', 'chofer']),
  })
  .refine((data) => data.pin === data.confirmPin, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPin'],
  })

export const loginSchema = z.object({
  phone: phoneBolivia,
  pin,
})

export const otpSchema = z.object({
  phone: phoneBolivia,
  otp: z
    .string()
    .length(OTP_LENGTH, `El código debe tener ${OTP_LENGTH} dígitos`)
    .regex(/^\d+$/, 'Solo números'),
})

export const switchRoleSchema = z.object({
  new_role: z.enum(['constructor', 'proveedor', 'maestro', 'chofer']),
})

export type RegisterFormData = z.infer<typeof registerSchema>
export type LoginFormData = z.infer<typeof loginSchema>
export type OtpFormData = z.infer<typeof otpSchema>
export type SwitchRoleData = z.infer<typeof switchRoleSchema>
