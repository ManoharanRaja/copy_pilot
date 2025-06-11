import threading
import time
import json
import os
from datetime import datetime
import pytz
import requests

SCHEDULE_FILE = "backend/data/schedules.json"
API_URL = "http://localhost:8000"  # Adjust if your FastAPI runs elsewhere

def load_schedules():
    if not os.path.exists(SCHEDULE_FILE):
        return []
    with open(SCHEDULE_FILE, "r") as f:
        return json.load(f)

def check_and_run_jobs():
    while True:
        schedules = load_schedules()
        now_utc = datetime.utcnow()
        for sch in schedules:
            tz = pytz.timezone(sch.get("timezone", "UTC"))
            now = now_utc.replace(tzinfo=pytz.utc).astimezone(tz)
            weekday = now.strftime("%A")
            time_str = now.strftime("%H:%M")
            # Check if today and time match
            if (
                weekday in sch.get("weekdays", [])
                and time_str == sch.get("time", "")
            ):
                # Optionally: avoid running multiple times in the same minute
                # Trigger the job
                try:
                    requests.post(
    f"{API_URL}/jobs/{sch['jobId']}/run",
    json={"trigger_type": "scheduled"},
    timeout=5
                    )
                    print(f"Triggered job {sch['jobId']} at {now}")
                except Exception as e:
                    print(f"Failed to trigger job {sch['jobId']}: {e}")
        time.sleep(60)  # Check every minute

def start_scheduler():
    t = threading.Thread(target=check_and_run_jobs, daemon=True)
    t.start()