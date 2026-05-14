import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendWhatsAppOtp } from '../_shared/whatsapp.ts'
import { safeError } from '../_shared/safeError.ts'
import { log } from '../_shared/logger.ts'

// ─── Shared constants ───────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? 'https://ziteo-frontend.vercel.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PHONE_REGEX = /^\+591[678]\d{7}$/
const PIN_REGEX = /^\d{8}$/
const OTP_REGEX = /^\d{6}$/

const VALID_ROLES = ['constructor', 'proveedor', 'maestro', 'chofer'] as const
type Role = typeof VALID_ROLES[number]

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function phoneToEmail(phone: string): string {
  return `${phone.replace('+', '')}@phone.ziteo.bo`
}

// ─── Handlers ────────────────────────────────────────────────────────────────

async function handleLogin(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  let body: { phone?: string; pin?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400)
  }

  const { phone, pin } = body

  if (!phone || !PHONE_REGEX.test(phone)) {
    return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
  }
  if (!pin || !PIN_REGEX.test(pin)) {
    return jsonResponse({ error: 'INVALID_PIN_FORMAT' }, 400)
  }

  // Rate-limit: max 5 login attempts per phone per 15 min
  const { data: throttled, error: throttleErr } = await supabaseAdmin.rpc('check_throttle', {
    p_identifier: phone,
    p_max_attempts: 5,
    p_window_minutes: 15,
  })
  if (!throttleErr && throttled === true) {
    return jsonResponse({ error: 'RATE_LIMITED' }, 429)
  }

  // Check if user exists in profiles
  const { data: profileCheck } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profileCheck) {
    return jsonResponse({ error: 'USER_NOT_FOUND' }, 404)
  }

  // Sign in using anon client with user credentials
  const supabaseAnon = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
  )

  const email = phoneToEmail(phone)
  const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
    email,
    password: pin,
  })

  if (signInError || !signInData.session || !signInData.user) {
    log('error', 'auth.login.signin_failed', { message: signInError?.message })
    return jsonResponse({ error: 'INVALID_PIN' }, 401)
  }

  const user_id = signInData.user.id
  const access_token = signInData.session.access_token
  const refresh_token = signInData.session.refresh_token

  // Fetch profile data
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('name, phone, city, active_role, avatar_url')
    .eq('user_id', user_id)
    .single()

  if (profileError || !profile) {
    log('error', 'auth.login.profile_not_found', { message: profileError?.message })
    return jsonResponse({ error: 'PROFILE_NOT_FOUND' }, 404)
  }

  // Fetch user roles
  const { data: rolesData, error: rolesError } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', user_id)

  if (rolesError) {
    log('error', 'auth.login.roles_failed', { message: rolesError?.message })
    return jsonResponse({ error: 'ROLES_FETCH_FAILED' }, 500)
  }

  const roles = rolesData?.map((r) => r.role) ?? []

  return jsonResponse({
    user_id,
    name: profile.name,
    phone: profile.phone,
    city: profile.city ?? null,
    active_role: profile.active_role,
    roles,
    access_token,
    refresh_token,
    avatar_url: profile.avatar_url ?? null,
  })
}

async function handleRegister(req: Request, supabase: SupabaseClient): Promise<Response> {
  let body: { phone?: string; name?: string; email?: string; city?: string; pin?: string; initial_role?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400)
  }

  const { phone, name, email: userEmail, city, pin, initial_role } = body

  if (!phone || !PHONE_REGEX.test(phone)) {
    return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
  }
  if (!pin || !PIN_REGEX.test(pin)) {
    return jsonResponse({ error: 'INVALID_PIN_FORMAT' }, 400)
  }
  if (!name || name.trim().length < 2) {
    return jsonResponse({ error: 'INVALID_NAME' }, 400)
  }
  if (!initial_role || !VALID_ROLES.includes(initial_role as Role)) {
    return jsonResponse({ error: 'INVALID_ROLE' }, 400)
  }

  // Rate-limit: max 5 registration attempts per phone per 15 min
  const { data: throttled, error: throttleErr } = await supabase.rpc('check_throttle', {
    p_identifier: phone,
    p_max_attempts: 5,
    p_window_minutes: 15,
  })
  if (!throttleErr && throttled === true) {
    return jsonResponse(safeError('RATE_LIMITED'), 429)
  }

  // Check if phone already registered
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (existingProfile) {
    return jsonResponse({ error: 'PHONE_ALREADY_REGISTERED' }, 409)
  }

  // Create user in Supabase Auth
  const email = phoneToEmail(phone)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    log('error', 'auth.register.create_user_failed', { message: authError?.message })
    return jsonResponse(safeError('REGISTRATION_FAILED'), 500)
  }

  const user_id = authData.user.id

  // Insert into profiles
  const profileData: Record<string, unknown> = {
    user_id,
    name: name.trim(),
    phone,
    city: city ?? null,
    active_role: initial_role,
    pin_hash: 'managed_by_supabase_auth',
  }
  if (userEmail) profileData.email = userEmail

  const { error: profileError } = await supabase.from('profiles').insert(profileData)

  if (profileError) {
    log('error', 'auth.register.profile_insert_failed', { message: profileError?.message })
    await supabase.auth.admin.deleteUser(user_id)
    return jsonResponse(safeError('PROFILE_CREATION_FAILED'), 500)
  }

  // Insert into user_roles
  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id,
    role: initial_role,
    onboarding_completed: false,
  })

  if (roleError) {
    log('error', 'auth.register.role_insert_failed', { message: roleError?.message })
    await supabase.auth.admin.deleteUser(user_id)
    return jsonResponse(safeError('ROLE_CREATION_FAILED'), 500)
  }

  // Generate OTP
  const otp_code = String(Math.floor(100000 + Math.random() * 900000))
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error: otpError } = await supabase.from('otps').insert({
    phone,
    code: otp_code,
    expires_at,
    used: false,
  })

  if (otpError) {
    log('error', 'auth.register.otp_insert_failed', { message: otpError?.message })
    return jsonResponse(safeError('OTP_CREATE_FAILED'), 500)
  }

  // Send OTP via WhatsApp
  try {
    await sendWhatsAppOtp(phone, otp_code)
  } catch (waErr) {
    log('error', 'auth.register.whatsapp_send_failed', { message: String(waErr) })
    const isNotConfigured = String(waErr).includes('WHATSAPP_NOT_CONFIGURED')
    if (!isNotConfigured) {
      return jsonResponse({ error: 'WHATSAPP_SEND_FAILED' }, 500)
    }
    return jsonResponse({ user_id, phone, requires_otp: true, debug_otp: otp_code }, 201)
  }

  return jsonResponse({ user_id, phone, requires_otp: true }, 201)
}

async function handleOtpVerify(req: Request, supabase: SupabaseClient): Promise<Response> {
  let body: { phone?: string; otp?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400)
  }

  const { phone, otp } = body

  if (!phone || !PHONE_REGEX.test(phone)) {
    return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
  }
  if (!otp || !OTP_REGEX.test(otp)) {
    return jsonResponse({ error: 'INVALID_OTP_FORMAT' }, 400)
  }

  // Check if phone exists in profiles
  const { data: profileCheck } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profileCheck) {
    return jsonResponse({ error: 'PHONE_NOT_FOUND' }, 404)
  }

  const user_id = profileCheck.user_id

  // Find the most recent valid (unused, not expired) OTP for this phone
  const now = new Date().toISOString()
  const { data: otpRecord, error: otpFetchError } = await supabase
    .from('otps')
    .select('id, code, expires_at, used')
    .eq('phone', phone)
    .eq('used', false)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (otpFetchError) {
    log('error', 'auth.otp_verify.otp_fetch_failed', { message: otpFetchError?.message })
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }

  if (!otpRecord) {
    const { data: expiredOtp } = await supabase
      .from('otps')
      .select('id')
      .eq('phone', phone)
      .eq('used', false)
      .lte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (expiredOtp) {
      return jsonResponse({ error: 'OTP_EXPIRED' }, 410)
    }

    return jsonResponse({ error: 'INVALID_OTP' }, 400)
  }

  if (otpRecord.code !== otp) {
    return jsonResponse({ error: 'INVALID_OTP' }, 400)
  }

  // Mark OTP as used
  const { error: otpUpdateError } = await supabase
    .from('otps')
    .update({ used: true })
    .eq('id', otpRecord.id)

  if (otpUpdateError) {
    log('error', 'auth.otp_verify.otp_update_failed', { message: otpUpdateError?.message })
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }

  // Confirm the phone in Supabase Auth
  const { error: confirmError } = await supabase.auth.admin.updateUserById(user_id, {
    phone_confirm: true,
  })

  if (confirmError) {
    log('error', 'auth.otp_verify.phone_confirm_failed', { message: confirmError?.message })
    return jsonResponse({ error: 'PHONE_CONFIRM_FAILED' }, 500)
  }

  // Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('name, phone, city, active_role, avatar_url')
    .eq('user_id', user_id)
    .single()

  if (profileError || !profile) {
    log('error', 'auth.otp_verify.profile_not_found', { message: profileError?.message })
    return jsonResponse({ error: 'PROFILE_NOT_FOUND' }, 404)
  }

  // Fetch user roles
  const { data: rolesData, error: rolesError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user_id)

  if (rolesError) {
    log('error', 'auth.otp_verify.roles_failed', { message: rolesError?.message })
    return jsonResponse({ error: 'ROLES_FETCH_FAILED' }, 500)
  }

  const roles = rolesData?.map((r) => r.role) ?? []

  // Generate magic link attempt (same approach as original — access_token remains null)
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: phoneToEmail(phone),
  })

  let access_token: string | null = null
  if (!linkError && linkData?.properties?.hashed_token) {
    access_token = null
  }

  return jsonResponse({
    user_id,
    name: profile.name,
    phone: profile.phone,
    active_role: profile.active_role,
    roles,
    access_token,
    avatar_url: profile.avatar_url ?? null,
    phone_confirmed: true,
  })
}

async function handleOtpResend(req: Request, supabase: SupabaseClient): Promise<Response> {
  let body: { phone?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400)
  }

  const { phone } = body
  if (!phone || !PHONE_REGEX.test(phone)) {
    return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
  }

  // Check phone exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return jsonResponse({ error: 'USER_NOT_FOUND' }, 404)
  }

  // Invalidate previous unused OTPs for this phone
  await supabase.from('otps').update({ used: true }).eq('phone', phone).eq('used', false)

  // Generate new OTP
  const otp_code = String(Math.floor(100000 + Math.random() * 900000))
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error: otpError } = await supabase.from('otps').insert({
    phone,
    code: otp_code,
    expires_at,
    used: false,
  })

  if (otpError) {
    log('error', 'auth.otp_resend.otp_insert_failed', { message: otpError?.message })
    return jsonResponse({ error: 'OTP_CREATE_FAILED' }, 500)
  }

  try {
    await sendWhatsAppOtp(phone, otp_code)
  } catch (waErr) {
    log('error', 'auth.otp_resend.whatsapp_send_failed', { message: String(waErr) })
    const isNotConfigured = String(waErr).includes('WHATSAPP_NOT_CONFIGURED')
    if (!isNotConfigured) {
      return jsonResponse({ error: 'WHATSAPP_SEND_FAILED' }, 500)
    }
    return jsonResponse({ sent: true, debug_otp: otp_code })
  }

  return jsonResponse({ sent: true })
}

async function handleForgotPin(req: Request, supabase: SupabaseClient): Promise<Response> {
  let body: { phone?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400)
  }

  const { phone } = body
  if (!phone || !PHONE_REGEX.test(phone)) {
    return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
  }

  // Rate-limit: max 5 reset attempts per phone per 15 min
  const { data: throttled, error: throttleErr } = await supabase.rpc('check_throttle', {
    p_identifier: phone,
    p_max_attempts: 5,
    p_window_minutes: 15,
  })
  if (!throttleErr && throttled === true) {
    return jsonResponse({ error: 'RATE_LIMITED' }, 429)
  }

  // Verify the phone belongs to a registered account
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return jsonResponse({ error: 'USER_NOT_FOUND' }, 404)
  }

  // Invalidate previous unused OTPs for this phone
  await supabase.from('otps').update({ used: true }).eq('phone', phone).eq('used', false)

  // Generate reset OTP
  const otp_code = String(Math.floor(100000 + Math.random() * 900000))
  const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const { error: otpError } = await supabase.from('otps').insert({
    phone,
    code: otp_code,
    expires_at,
    used: false,
  })

  if (otpError) {
    log('error', 'auth.forgot_pin.otp_insert_failed', { message: otpError?.message })
    return jsonResponse({ error: 'OTP_CREATE_FAILED' }, 500)
  }

  try {
    await sendWhatsAppOtp(phone, otp_code)
  } catch (waErr) {
    log('error', 'auth.forgot_pin.whatsapp_send_failed', { message: String(waErr) })
    const isNotConfigured = String(waErr).includes('WHATSAPP_NOT_CONFIGURED')
    if (!isNotConfigured) {
      return jsonResponse({ error: 'WHATSAPP_SEND_FAILED' }, 500)
    }
    return jsonResponse({ sent: true, debug_otp: otp_code })
  }

  return jsonResponse({ sent: true })
}

async function handleResetPin(req: Request, supabase: SupabaseClient): Promise<Response> {
  let body: { phone?: string; otp?: string; new_pin?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400)
  }

  const { phone, otp, new_pin } = body

  if (!phone || !PHONE_REGEX.test(phone)) {
    return jsonResponse({ error: 'INVALID_PHONE_FORMAT' }, 400)
  }
  if (!otp || !OTP_REGEX.test(otp)) {
    return jsonResponse({ error: 'INVALID_OTP_FORMAT' }, 400)
  }
  if (!new_pin || !PIN_REGEX.test(new_pin)) {
    return jsonResponse({ error: 'INVALID_PIN_FORMAT' }, 400)
  }

  // Fetch the profile to get user_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('phone', phone)
    .maybeSingle()

  if (!profile) {
    return jsonResponse({ error: 'USER_NOT_FOUND' }, 404)
  }

  // Validate OTP
  const now = new Date().toISOString()
  const { data: otpRecord } = await supabase
    .from('otps')
    .select('id, code, expires_at, used')
    .eq('phone', phone)
    .eq('used', false)
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!otpRecord) {
    const { data: expiredOtp } = await supabase
      .from('otps')
      .select('id')
      .eq('phone', phone)
      .eq('used', false)
      .lte('expires_at', now)
      .limit(1)
      .maybeSingle()

    return jsonResponse({ error: expiredOtp ? 'OTP_EXPIRED' : 'INVALID_OTP' }, 400)
  }

  if (otpRecord.code !== otp) {
    return jsonResponse({ error: 'INVALID_OTP' }, 400)
  }

  // Mark OTP as used FIRST — prevents replay even if password update fails
  const { data: otpUpdateData, error: otpUpdateError } = await supabase
    .from('otps')
    .update({ used: true })
    .eq('id', otpRecord.id)
    .select()

  if (otpUpdateError || !otpUpdateData || otpUpdateData.length === 0) {
    log('error', 'auth.reset_pin.otp_mark_used_failed', { message: otpUpdateError?.message })
    return jsonResponse({ error: 'INVALID_OTP' }, 400)
  }

  // Update the password in Supabase Auth only after OTP is consumed
  const { error: updateError } = await supabase.auth.admin.updateUserById(profile.user_id, {
    password: new_pin,
  })

  if (updateError) {
    log('error', 'auth.reset_pin.password_update_failed', { message: updateError?.message })
    return jsonResponse(safeError('RESET_FAILED'), 500)
  }

  return jsonResponse({ reset: true })
}

async function handleOAuthSetup(req: Request, supabaseAdmin: SupabaseClient): Promise<Response> {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return jsonResponse({ error: 'UNAUTHORIZED' }, 401)

  // Verify the caller's JWT to get their user_id
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) return jsonResponse({ error: 'UNAUTHORIZED' }, 401)

  let body: { name?: string; city?: string; initial_role?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'INVALID_JSON' }, 400)
  }

  const { name, city, initial_role } = body

  if (!name || name.trim().length < 2) {
    return jsonResponse({ error: 'INVALID_NAME' }, 400)
  }
  if (!initial_role || !VALID_ROLES.includes(initial_role as Role)) {
    return jsonResponse({ error: 'INVALID_ROLE' }, 400)
  }

  // Idempotency: skip if profile already exists
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return jsonResponse({ error: 'PROFILE_ALREADY_EXISTS' }, 409)

  // Create profile
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    user_id: user.id,
    name: name.trim(),
    phone: '',
    email: user.email ?? null,
    city: city ?? null,
    active_role: initial_role,
    pin_hash: 'oauth_user',
  })

  if (profileError) {
    log('error', 'auth.oauth_setup.profile_insert_failed', { message: profileError?.message })
    return jsonResponse({ error: 'PROFILE_CREATE_FAILED' }, 500)
  }

  // Create user_role
  const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
    user_id: user.id,
    role: initial_role,
    onboarding_completed: false,
  })

  if (roleError) {
    log('error', 'auth.oauth_setup.role_insert_failed', { message: roleError?.message })
    await supabaseAdmin.from('profiles').delete().eq('user_id', user.id)
    return jsonResponse({ error: 'ROLE_CREATE_FAILED' }, 500)
  }

  return jsonResponse({ success: true, user_id: user.id })
}

// ─── Router ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Body size limit
  const contentLength = Number(req.headers.get('content-length') ?? '0')
  if (contentLength > 65536) {
    return jsonResponse({ error: 'PAYLOAD_TOO_LARGE' }, 413)
  }

  // Extract action from URL path: /functions/v1/auth/login → 'login'
  const action = new URL(req.url).pathname.split('/').pop()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    switch (action) {
      case 'login':
        return await handleLogin(req, supabase)
      case 'register':
        return await handleRegister(req, supabase)
      case 'otp-verify':
        return await handleOtpVerify(req, supabase)
      case 'otp-resend':
        return await handleOtpResend(req, supabase)
      case 'forgot-pin':
        return await handleForgotPin(req, supabase)
      case 'reset-pin':
        return await handleResetPin(req, supabase)
      case 'oauth-setup':
        return await handleOAuthSetup(req, supabase)
      default:
        return jsonResponse({ error: 'NOT_FOUND' }, 404)
    }
  } catch (err) {
    log('error', 'auth.router.unexpected_error', { message: String(err) })
    return jsonResponse({ error: 'INTERNAL_SERVER_ERROR' }, 500)
  }
})
