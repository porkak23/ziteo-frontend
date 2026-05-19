const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cWJ1YmpmaG11enRrbm1oeXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE1NDQsImV4cCI6MjA5MTA4NzU0NH0.8rKE4q-x3VhZMpJGThQFHXBlmEFM2Xj6dm63yF_3ZBo';
const BASE_URL = 'https://yvqbubjfhmuztknmhyvd.supabase.co/functions/v1/auth/login';

const testPhones = [
  { phone: '+59179999901', expectedRole: 'constructor' },
  { phone: '+59179999902', expectedRole: 'proveedor' },
  { phone: '+59179999903', expectedRole: 'maestro' },
  { phone: '+59179999904', expectedRole: 'chofer' }
];

async function loginTest() {
  console.log('=== Verificando Credenciales y Roles Nuevos (Login) ===');
  
  for (const item of testPhones) {
    try {
      const res = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY
        },
        body: JSON.stringify({
          phone: item.phone,
          pin: '12345678'
        })
      });
      
      const status = res.status;
      const data = await res.json();
      
      if (res.ok) {
        console.log(`[OK] Login exitoso para ${item.phone}`);
        console.log(`     - Nombre: ${data.name}`);
        console.log(`     - Rol Activo: ${data.active_role} (Esperado: ${item.expectedRole})`);
        console.log(`     - Roles asignados: ${data.roles.join(', ')}`);
        console.log(`     - Ciudad: ${data.city}`);
      } else {
        console.error(`[ERROR] Login fallido para ${item.phone} (Status ${status}):`, data);
      }
    } catch (err) {
      console.error(`[EXCEPCIÓN] Para ${item.phone}:`, err);
    }
  }
}

loginTest();
