import subprocess
import sys

envs = ["production", "preview", "development"]
vars = {
    "VITE_FIREBASE_API_KEY": "AIzaSyClRQwdvbkehMZscVgb13GGVH1ezAahWas",
    "VITE_FIREBASE_AUTH_DOMAIN": "ziteo-a08f4.firebaseapp.com",
    "VITE_FIREBASE_PROJECT_ID": "ziteo-a08f4",
    "VITE_FIREBASE_STORAGE_BUCKET": "ziteo-a08f4.firebasestorage.app",
    "VITE_FIREBASE_MESSAGING_SENDER_ID": "916382762393",
    "VITE_FIREBASE_APP_ID": "1:916382762393:web:b03de2dbdf00975a967f08"
}

print("Starting to add Firebase environment variables via Python...")

for env in envs:
    for name, value in vars.items():
        print(f"Setting {name} for {env}...")
        cmd = f'vercel env add "{name}" "{env}" --value "{value}" --yes --force'
        res = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        if res.returncode != 0:
            print(f"Error setting {name} for {env}: {res.stderr or res.stdout}".strip())
        else:
            print(f"Successfully set {name} for {env}")

print("Completed!")
