const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cWJ1YmpmaG11enRrbm1oeXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE1NDQsImV4cCI6MjA5MTA4NzU0NH0.8rKE4q-x3VhZMpJGThQFHXBlmEFM2Xj6dm63yF_3ZBo';
const BASE_URL = 'https://yvqbubjfhmuztknmhyvd.supabase.co/functions/v1';

const usersToCreate = [
  {
    phone: '+59170000001',
    pin: '12345678',
    name: 'Carlos Constructor',
    city: 'Santa Cruz',
    initial_role: 'constructor'
  },
  {
    phone: '+59170000002',
    pin: '12345678',
    name: 'Pedro Proveedor',
    city: 'Santa Cruz',
    initial_role: 'proveedor'
  },
  {
    phone: '+59170000003',
    pin: '12345678',
    name: 'Mario Maestro',
    city: 'Santa Cruz',
    initial_role: 'maestro'
  },
  {
    phone: '+59170000004',
    pin: '12345678',
    name: 'Tomas Transportista',
    city: 'Santa Cruz',
    initial_role: 'chofer'
  }
];

async function registerAndVerify(user) {
  console.log(`\n=== Procesando usuario: ${user.name} (${user.phone}) [${user.initial_role}] ===`);
  
  // 1. Registro
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      },
      body: JSON.stringify(user)
    });
    
    const regData = await regRes.json();
    
    if (regRes.status === 409 || (regData.error && regData.error === 'PHONE_ALREADY_REGISTERED')) {
      console.log(`[INFO] El teléfono ${user.phone} ya está registrado.`);
      return;
    }
    
    if (!regRes.ok) {
      console.error(`[ERROR] Error en registro de ${user.phone}:`, regData);
      return;
    }
    
    console.log(`[REGISTRO] Exitoso! Requires OTP: ${regData.requires_otp}, Debug OTP: ${regData.debug_otp}`);
    
    if (regData.requires_otp && regData.debug_otp) {
      // 2. Verificación de OTP
      console.log(`[OTP] Verificando OTP ${regData.debug_otp} para ${user.phone}...`);
      const verifyRes = await fetch(`${BASE_URL}/auth/otp-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY
        },
        body: JSON.stringify({
          phone: user.phone,
          otp: regData.debug_otp
        })
      });
      
      const verifyData = await verifyRes.json();
      if (verifyRes.ok) {
        console.log(`[OTP] Cuenta verificada con éxito para ${user.phone}!`);
      } else {
        console.error(`[OTP ERROR] Error verificando OTP para ${user.phone}:`, verifyData);
      }
    }
  } catch (error) {
    console.error(`[ERROR GENERAL] Para ${user.phone}:`, error);
  }
}

async function run() {
  for (const user of usersToCreate) {
    await registerAndVerify(user);
  }
  console.log('\n=== Proceso finalizado ===');
}

run();
