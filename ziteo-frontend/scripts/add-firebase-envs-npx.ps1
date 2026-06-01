$envs = @("production", "development")
$vars = @{
    "VITE_FIREBASE_API_KEY" = "AIzaSyClRQwdvbkehMZscVgb13GGVH1ezAahWas"
    "VITE_FIREBASE_AUTH_DOMAIN" = "ziteo-a08f4.firebaseapp.com"
    "VITE_FIREBASE_PROJECT_ID" = "ziteo-a08f4"
    "VITE_FIREBASE_STORAGE_BUCKET" = "ziteo-a08f4.firebasestorage.app"
    "VITE_FIREBASE_MESSAGING_SENDER_ID" = "916382762393"
    "VITE_FIREBASE_APP_ID" = "1:916382762393:web:b03de2dbdf00975a967f08"
}

foreach ($envName in $envs) {
    Write-Host "Setting environment variables for $envName..."
    foreach ($key in $vars.Keys) {
        $val = $vars[$key]
        Write-Host "Setting $key for $envName..."
        # 1. Remove if exists (discard output to keep it clean and prevent handle hanging)
        npx vercel env rm $key $envName --yes *>$null
        
        # 2. Add fresh
        npx vercel env add $key $envName --value $val --yes
    }
}
Write-Host "All done!"
