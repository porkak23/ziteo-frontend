const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = "https://yvqbubjfhmuztknmhyvd.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cWJ1YmpmaG11enRrbm1oeXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE1NDQsImV4cCI6MjA5MTA4NzU0NH0.8rKE4q-x3VhZMpJGThQFHXBlmEFM2Xj6dm63yF_3ZBo"

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testOnboarding() {
  console.log('Testing provider onboarding and product creation...')
  
  // 1. Create a test provider
  const randomDigits = Math.floor(1000000 + Math.random() * 9000000)
  const phone = `+5917${randomDigits}`
  const email = `${randomDigits}@gmail.com`
  const password = `ZiteoBeta_${randomDigits}_2026!`

  console.log(`Signing up test provider with email ${email}...`)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    console.error('Sign up failed:', signUpError.message)
    return
  }

  const userId = signUpData.user.id
  const session = signUpData.session

  if (!session) {
    console.error('No session returned. Please disable email confirmation in Supabase.')
    return
  }

  console.log('User signed up successfully. UID:', userId)

  // Initialize profile with role provider
  console.log('Creating profile...')
  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: userId,
    name: 'Test Provider User',
    phone: phone,
    city: 'Sucre',
    active_role: 'proveedor',
    pin_hash: '',
    terms_accepted_at: new Date().toISOString(),
  })

  if (profileError) {
    console.error('Profile creation failed:', profileError.message)
    return
  }
  console.log('Profile created successfully.')

  // Create role row in user_roles
  console.log('Creating user_roles row for proveedor...')
  const { error: roleError } = await supabase.from('user_roles').insert({
    user_id: userId,
    role: 'proveedor',
    onboarding_completed: false,
    is_verified: false,
  })

  if (roleError) {
    console.error('Role creation failed:', roleError.message)
    return
  }
  console.log('Role row created successfully.')

  // Log in as provider to get the authenticated client
  const authenticatedSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  })
  await authenticatedSupabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })

  // Try to update user_roles (Onboarding Step 1)
  console.log('Updating user_roles with store information...')
  const { error: updateRoleError } = await authenticatedSupabase
    .from('user_roles')
    .update({
      store_name: 'Ferretería El Sol',
      store_description: 'Venta de cemento y herramientas',
    })
    .eq('user_id', userId)
    .eq('role', 'proveedor')

  if (updateRoleError) {
    console.error('Updating user_roles failed:', updateRoleError.message)
  } else {
    console.log('user_roles updated successfully.')
  }

  // Try to query categories to find one ID
  console.log('Querying categories...')
  const { data: categories, error: catError } = await authenticatedSupabase
    .from('categories')
    .select('id, name')
  
  if (catError) {
    console.error('Querying categories failed:', catError.message)
    return
  }
  console.log('Categories found:', categories)

  const firstCatId = categories && categories.length > 0 ? categories[0].id : null

  // Try to insert product (Onboarding Step 3) using incorrect fields (what ProveedorOnboardingWizard is doing)
  console.log('Inserting product using incorrect fields (price, stock, category_name)...')
  const { error: badProdError } = await authenticatedSupabase.from('products').insert({
    provider_id: userId,
    name: 'Cemento IP-30 50kg (Bad)',
    price: 55,
    stock: 10,
    category_name: 'Cemento',
    active: true,
  })

  if (badProdError) {
    console.error('Bad product insert failed (as expected):', badProdError.message)
  } else {
    console.log('Bad product insert unexpectedly succeeded!')
  }

  // Try to insert product using correct fields (what it should do)
  if (firstCatId) {
    console.log('Inserting product using correct fields (price_unit, stock_quantity, category_id)...')
    const { data: prodData, error: goodProdError } = await authenticatedSupabase.from('products').insert({
      provider_id: userId,
      name: 'Cemento IP-30 50kg (Good)',
      price_unit: 55,
      stock_quantity: 10,
      category_id: firstCatId,
      unit_type: 'unidad',
      active: true,
    }).select()

    if (goodProdError) {
      console.error('Good product insert failed:', goodProdError.message)
    } else {
      console.log('Good product insert succeeded:', prodData)
    }
  }

  // Check if products are visible
  console.log('Querying products like TiendaTab...')
  const { data: activeProducts, error: queryProdError } = await supabase
    .from('products')
    .select('id, name, price_unit, active, provider:profiles!products_provider_id_fkey(name, user_roles(store_name))')
    .eq('active', true)
  
  if (queryProdError) {
    console.error('Querying products failed:', queryProdError.message)
  } else {
    console.log('Active products visible in store:', activeProducts)
  }
}

testOnboarding()
