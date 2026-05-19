const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cWJ1YmpmaG11enRrbm1oeXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE1NDQsImV4cCI6MjA5MTA4NzU0NH0.8rKE4q-x3VhZMpJGThQFHXBlmEFM2Xj6dm63yF_3ZBo';
const BASE_URL = 'https://yvqbubjfhmuztknmhyvd.supabase.co/rest/v1';

async function fetchDb() {
  console.log('=== Verificando Perfiles en Base de Datos ===');
  const phones = ['+59170000001', '+59170000002', '+59170000003', '+59170000004'];
  
  try {
    const url = `${BASE_URL}/profiles?phone=in.(${phones.map(p => `"${p}"`).join(',')})&select=user_id,phone,name,city,active_role`;
    const res = await fetch(url, {
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      }
    });
    
    if (!res.ok) {
      console.error('Error fetching profiles:', res.status, await res.text());
      return;
    }
    
    const profiles = await res.json();
    console.log(`Perfiles encontrados: ${profiles.length}`);
    profiles.forEach(p => {
      console.log(`- Nombre: ${p.name} | Teléfono: ${p.phone} | Rol Activo: ${p.active_role} | Ciudad: ${p.city} | UUID: ${p.user_id}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  }
}

fetchDb();
