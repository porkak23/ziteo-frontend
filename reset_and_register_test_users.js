const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cWJ1YmpmaG11enRrbm1oeXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE1NDQsImV4cCI6MjA5MTA4NzU0NH0.8rKE4q-x3VhZMpJGThQFHXBlmEFM2Xj6dm63yF_3ZBo';
const BASE_URL = 'https://yvqbubjfhmuztknmhyvd.supabase.co/functions/v1';

const testUsers = [
  {
    phone: '+59179999901',
    pin: '12345678',
    name: 'Carlos Constructor',
    city: 'Santa Cruz',
    initial_role: 'constructor'
  },
  {
    phone: '+59179999902',
    pin: '12345678',
    name: 'Pedro Proveedor',
    city: 'Santa Cruz',
    initial_role: 'proveedor'
  },
  {
    phone: '+59179999903',
    pin: '12345678',
    name: 'Mario Maestro',
    city: 'Santa Cruz',
    initial_role: 'maestro'
  },
  {
    phone: '+59179999904',
    pin: '12345678',
    name: 'Tomas Transportista',
    city: 'Santa Cruz',
    initial_role: 'chofer'
  }
];

async function createCleanUser(user) {
  console.log(`\n=== Creando usuario: ${user.name} (${user.phone}) ===`);
  try {
    // Intentar registrar
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
      console.log(`[INFO] El teléfono ${user.phone} ya está registrado, intentaremos loguear...`);
      return;
    }
    
    if (!regRes.ok) {
      console.error(`[ERROR] No se pudo registrar a ${user.phone}:`, regData);
      return;
    }
    
    console.log(`[REGISTRO] Exitoso! Requires OTP: ${regData.requires_otp}, Debug OTP: ${regData.debug_otp}`);
    
    if (regData.requires_otp && regData.debug_otp) {
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
  } catch (err) {
    console.error(`[EXCEPCIÓN] Para ${user.phone}:`, err);
  }
}

async function run() {
  for (const user of testUsers) {
    await createCleanUser(user);
  }
  console.log('\n=== Creación de usuarios de prueba limpia finalizada ===');
}

run();
