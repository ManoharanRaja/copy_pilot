import os
import json
from filelock import FileLock

JOBS_FILE = "backend/data/job_details.json"

def load_jobs():
    if os.path.exists(JOBS_FILE):
        with open(JOBS_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

def save_jobs(jobs):
    with FileLock(JOBS_FILE + ".lock"):
        with open(JOBS_FILE, "w") as f:
            json.dump(jobs, f, indent=2)