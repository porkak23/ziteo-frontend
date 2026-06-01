const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = "https://yvqbubjfhmuztknmhyvd.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cWJ1YmpmaG11enRrbm1oeXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE1NDQsImV4cCI6MjA5MTA4NzU0NH0.8rKE4q-x3VhZMpJGThQFHXBlmEFM2Xj6dm63yF_3ZBo"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testMaestro() {
  console.log('Testing maestro onboarding...')

  const randomDigits = Math.floor(1000000 + Math.random() * 9000000)
  const phone = `+5917${randomDigits}`
  const email = `${randomDigits}@gmail.com`
  const password = `ZiteoBeta_${randomDigits}_2026!`

  console.log(`Signing up test maestro...`)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password })
  if (signUpError) {
    console.error('Sign up failed:', signUpError.message)
    return
  }
  const userId = signUpData.user.id
  const session = signUpData.session

  // Initialize profile with role maestro
  console.log('Creating profile...')
  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: userId,
    name: 'Test Maestro User',
    phone: phone,
    city: 'Sucre',
    active_role: 'maestro',
    pin_hash: '',
    terms_accepted_at: new Date().toISOString(),
  })
  if (profileError) {
    console.error('Profile creation failed:', profileError.message)
    return
  }

  // Create role row in user_roles
  console.log('Creating user_roles row for maestro...')
  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role: 'maestro',
    onboarding_completed: false,
    is_verified: false,
  })
  if (roleError) {
    console.error('Role creation failed:', roleError.message)
    return
  }

  // Log in as maestro
  const authenticatedSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  await authenticatedSupabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })

  // Try to update user_roles (Onboarding Step 3)
  console.log('Completing onboarding (updating user_roles with specialties, rates, availability)...')
  const updates = {
    is_available: true,
    onboarding_complete: true,
    onboarding_completed: true,
    specialty: 'Albanileria, Electricidad',
    years_experience: 5,
    rate_type: 'hora',
    hourly_rate: 150,
  }

  const { error: updateRoleError } = await authenticatedSupabase
    .from('user_roles')
    .update(updates)
    .eq('user_id', userId)
    .eq('role', 'maestro')

  if (updateRoleError) {
    console.error('Updating user_roles failed:', updateRoleError.message)
    return
  }
  console.log('user_roles updated successfully.')

  // Check if maestro_profiles row exists or was created automatically
  console.log('Checking maestro_profiles table...')
  const { data: mProfile, error: mProfileError } = await supabase
    .from('maestro_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (mProfileError) {
    console.error('Querying maestro_profiles failed:', mProfileError.message)
  } else {
    console.log('maestro_profiles row:', mProfile)
  }

  // Check if visible via fallbackTwoQueryMaestros
  console.log('Querying via fallbackTwoQueryMaestros logic...')
  const { data: roleRows, error: rError } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'maestro')
  if (rError) {
    console.error('user_roles query failed:', rError.message)
    return
  }
  const ids = roleRows.map(r => r.user_id)
  
  const { data: profilesWithMaestro, error: pError } = await supabase
    .from('profiles')
    .select(`
      user_id, name, city, avatar_url,
      maestro_profiles!maestro_profiles_user_id_fkey(
        specialties, rate_type, rate_amount, available, experience_years
      )
    `)
    .in('user_id', [userId])

  if (pError) {
    console.error('Profiles query failed:', pError.message)
  } else {
    console.log('Profiles with maestro:', JSON.stringify(profilesWithMaestro, null, 2))
  }
}

testMaestro()
