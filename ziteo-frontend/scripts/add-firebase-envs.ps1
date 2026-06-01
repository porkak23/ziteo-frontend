# Script to add Firebase environment variables to Vercel
Write-Host "Adding Firebase environment variables..."

$envs = @("production", "preview", "development")
foreach ($envName in $envs) {
  Write-Host "Setting environment variables for $envName..."
  
  # API Key
  npx vercel env add VITE_FIREBASE_API_KEY $envName --value "AIzaSyClRQwdvbkehMZscVgb13GGVH1ezAahWas" --yes --force
  
  # Auth Domain
  npx vercel env add VITE_FIREBASE_AUTH_DOMAIN $envName --value "ziteo-a08f4.firebaseapp.com" --yes --force
  
  # Project ID
  npx vercel env add VITE_FIREBASE_PROJECT_ID $envName --value "ziteo-a08f4" --yes --force
  
  # Storage Bucket
  npx vercel env add VITE_FIREBASE_STORAGE_BUCKET $envName --value "ziteo-a08f4.firebasestorage.app" --yes --force
  
  # Messaging Sender ID
  npx vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID $envName --value "916382762393" --yes --force
  
  # App ID
  npx vercel env add VITE_FIREBASE_APP_ID $envName --value "1:916382762393:web:b03de2dbdf00975a967f08" --yes --force
}

Write-Host "All Firebase environment variables added successfully!"
