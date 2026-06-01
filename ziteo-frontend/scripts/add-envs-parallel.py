import subprocess
import time
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

print("Launching RM processes in parallel...", flush=True)
rm_procs = []
for env in envs:
    for name in vars.keys():
        cmd = f'vercel env rm "{name}" "{env}" --yes'
        p = subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        rm_procs.append(p)

print("Waiting 15 seconds for RM processes to complete...", flush=True)
time.sleep(15)

print("Launching ADD processes in parallel...", flush=True)
add_procs = []
for env in envs:
    for name, value in vars.items():
        cmd = f'vercel env add "{name}" "{env}" --value "{value}" --yes'
        p = subprocess.Popen(cmd, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        add_procs.append(p)

print("Waiting 15 seconds for ADD processes to complete...", flush=True)
time.sleep(15)

print("All parallel operations completed successfully!", flush=True)
