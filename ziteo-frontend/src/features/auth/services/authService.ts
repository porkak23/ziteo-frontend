import type {
  RegisterPayload,
  RegisterApiResponse,
  LoginPayload,
  AuthApiResponse,
  OtpVerifyPayload,
  OAuthSetupPayload,
  AuthError,
} from '../types/authTypes'
import { supabase } from '../../../lib/supabaseClient'

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  apikey: ANON_KEY,
}

export class AuthServiceError extends Error {
  code: string

  constructor(code: string, message?: string) {
    super(message ?? code)
    this.code = code
    this.name = 'AuthServiceError'
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let code = `HTTP_${res.status}`
    try {
      const body = (await res.json()) as AuthError
      if (body.error) code = body.error
    } catch {
      // ignore parse error, use default code
    }
    throw new AuthServiceError(code)
  }
  return res.json() as Promise<T>
}

export async function registerUser(payload: RegisterPayload): Promise<RegisterApiResponse> {
  const res = await fetch(`${BASE_URL}/auth-register`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  })
  return handleResponse<RegisterApiResponse>(res)
}

export async function loginUser(payload: LoginPayload): Promise<AuthApiResponse> {
  const res = await fetch(`${BASE_URL}/auth-login`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  })
  return handleResponse<AuthApiResponse>(res)
}

export async function verifyOtp(payload: OtpVerifyPayload): Promise<{ phone_confirmed: boolean }> {
  const res = await fetch(`${BASE_URL}/auth-otp-verify`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  })
  return handleResponse<{ phone_confirmed: boolean }>(res)
}

export async function resendOtp(phone: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth-otp-resend`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ phone }),
  })
  return handleResponse<void>(res)
}

export async function forgotPin(phone: string): Promise<{ sent: boolean; debug_otp?: string }> {
  const res = await fetch(`${BASE_URL}/auth-forgot-pin`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ phone }),
  })
  return handleResponse<{ sent: boolean; debug_otp?: string }>(res)
}

export async function resetPin(payload: { phone: string; otp: string; new_pin: string }): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth-reset-pin`, {
    method: 'POST',
    headers: DEFAULT_HEADERS,
    body: JSON.stringify(payload),
  })
  return handleResponse<void>(res)
}

export async function setupOAuthProfile(
  accessToken: string,
  payload: OAuthSetupPayload
): Promise<void> {
  const res = await fetch(`${BASE_URL}/auth-oauth-setup`, {
    method: 'POST',
    headers: { ...DEFAULT_HEADERS, Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify(payload),
  })
  return handleResponse<void>(res)
}

export async function updateProfile(
  userId: string,
  data: { name: string; city: string; active_role: string; avatar_url?: string }
): Promise<void> {
  const payload: Record<string, unknown> = { name: data.name, city: data.city, active_role: data.active_role }
  if (data.avatar_url) payload.avatar_url = data.avatar_url

  const { error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('user_id', userId)
  if (error) {
    throw new AuthServiceError('PROFILE_UPDATE_FAILED', error.message)
  }
}
