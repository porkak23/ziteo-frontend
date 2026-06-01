@echo off
echo Adding Firebase environment variables to Vercel...

set VAL_API_KEY=AIzaSyClRQwdvbkehMZscVgb13GGVH1ezAahWas
set VAL_AUTH_DOMAIN=ziteo-a08f4.firebaseapp.com
set VAL_PROJECT_ID=ziteo-a08f4
set VAL_STORAGE_BUCKET=ziteo-a08f4.firebasestorage.app
set VAL_MESSAGING_SENDER_ID=916382762393
set VAL_APP_ID=1:916382762393:web:b03de2dbdf00975a967f08

for %%E in (production preview development) do (
    echo Setting environment variables for %%E...
    call vercel env add VITE_FIREBASE_API_KEY %%E --value "%VAL_API_KEY%" --yes --force
    call vercel env add VITE_FIREBASE_AUTH_DOMAIN %%E --value "%VAL_AUTH_DOMAIN%" --yes --force
    call vercel env add VITE_FIREBASE_PROJECT_ID %%E --value "%VAL_PROJECT_ID%" --yes --force
    call vercel env add VITE_FIREBASE_STORAGE_BUCKET %%E --value "%VAL_STORAGE_BUCKET%" --yes --force
    call vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID %%E --value "%VAL_MESSAGING_SENDER_ID%" --yes --force
    call vercel env add VITE_FIREBASE_APP_ID %%E --value "%VAL_APP_ID%" --yes --force
)

echo Done!
