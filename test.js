async function test() {
  const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cWJ1YmpmaG11enRrbm1oeXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MTE1NDQsImV4cCI6MjA5MTA4NzU0NH0.8rKE4q-x3VhZMpJGThQFHXBlmEFM2Xj6dm63yF_3ZBo';
  const url = 'https://yvqbubjfhmuztknmhyvd.supabase.co/functions/v1/auth/register';
  console.log('Fetching', url);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        phone: '+59173401469',
        pin: '12345678',
        name: 'Test Pereyra',
        city: 'Sucre',
        initial_role: 'constructor'
      })
    });
    console.log(res.status, res.statusText);
    const text = await res.text();
    console.log(text);
  } catch(e) {
    console.error(e);
  }
}
test();
