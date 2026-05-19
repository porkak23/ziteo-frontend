// generate-vapid-keys.mjs — genera las VAPID keys para Web Push
// MANUAL SETUP REQUIRED:
//   1. Ejecutar UNA SOLA VEZ: node scripts/generate-vapid-keys.mjs
//   2. Copiar VITE_VAPID_PUBLIC_KEY al archivo .env.local (y variables de entorno de produccion)
//   3. Agregar VAPID_PRIVATE_KEY a los Supabase secrets via:
//        supabase secrets set VAPID_PRIVATE_KEY=<valor>
//      NUNCA commitear la clave privada al repo.
//   4. Agregar tambien VAPID_SUBJECT a los Supabase secrets:
//        supabase secrets set VAPID_SUBJECT=mailto:admin@ziteo.bo

import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log('\n=== VAPID Keys generadas ===\n')
console.log('Agregar a .env.local:')
console.log('VITE_VAPID_PUBLIC_KEY=' + keys.publicKey)
console.log('\nAgregar a Supabase secrets (NO al repo):')
console.log('VAPID_PRIVATE_KEY=' + keys.privateKey)
console.log('\nPara subir a Supabase:')
console.log('  supabase secrets set VAPID_PRIVATE_KEY="' + keys.privateKey + '"')
console.log('  supabase secrets set VAPID_SUBJECT="mailto:admin@ziteo.bo"')
console.log('\n============================\n')
