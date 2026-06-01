import subprocess
import sys

envs = ["production", "development"]
vars = {
    "VITE_FIREBASE_API_KEY": "AIzaSyClRQwdvbkehMZscVgb13GGVH1ezAahWas",
    "VITE_FIREBASE_AUTH_DOMAIN": "ziteo-a08f4.firebaseapp.com",
    "VITE_FIREBASE_PROJECT_ID": "ziteo-a08f4",
    "VITE_FIREBASE_STORAGE_BUCKET": "ziteo-a08f4.firebasestorage.app",
    "VITE_FIREBASE_MESSAGING_SENDER_ID": "916382762393",
    "VITE_FIREBASE_APP_ID": "1:916382762393:web:b03de2dbdf00975a967f08"
}

print("Starting to add Firebase environment variables directly...", flush=True)

for env in envs:
    for name, value in vars.items():
        print(f"Ensuring {name} is set for {env}...", flush=True)
        # 1. Remove if exists (discard output to keep it clean and fast)
        rm_cmd = f'vercel env rm "{name}" "{env}" --yes'
        subprocess.run(rm_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # 2. Add fresh
        add_cmd = f'vercel env add "{name}" "{env}" --value "{value}" --yes'
        subprocess.run(add_cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("Completed!", flush=True)
