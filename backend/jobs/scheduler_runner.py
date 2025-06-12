import threading
import time
import json
import os
from datetime import datetime
import pytz
import requests
import holidays

uk_holidays = holidays.country_holidays('GB', subdiv='England', years=range(datetime.now().year, datetime.now().year + 2))
SCHEDULE_FILE = "backend/data/schedules.json"
API_URL = "http://localhost:8000"  # Adjust if your FastAPI runs elsewhere


def load_schedules():
    if not os.path.exists(SCHEDULE_FILE):
        return []
    with open(SCHEDULE_FILE, "r") as f:
        return json.load(f)

def is_business_day(dt):
    # dt should be a datetime object
    # Check if it's a weekday and not a UK holiday
    return dt.weekday() < 5 and dt.date() not in uk_holidays

def nth_business_day_of_month(dt, n):
    count = 0
    for day in range(1, 32):
        try:
            d = dt.replace(day=day)
        except ValueError:
            break
        if is_business_day(d):
            count += 1
            if count == n:
                return d
    return None

def nth_day_of_month(dt, n):
    try:
        return dt.replace(day=n)
    except ValueError:
        return None

def nth_business_day_of_quarter(dt, n, q):
    year = dt.year
    month = 3 * (q - 1) + 1
    count = 0
    for m in range(month, month + 3):
        for day in range(1, 32):
            try:
                d = datetime(year, m, day, tzinfo=dt.tzinfo)
            except ValueError:
                break
            if is_business_day(d):
                count += 1
                if count == n:
                    return d
    return None

def nth_day_of_quarter(dt, n, q):
    year = dt.year
    month = 3 * (q - 1) + 1
    days = []
    for m in range(month, month + 3):
        for day in range(1, 32):
            try:
                d = datetime(year, m, day, tzinfo=dt.tzinfo)
                days.append(d)
            except ValueError:
                break
    if 0 < n <= len(days):
        return days[n - 1]
    return None

def nth_business_day_of_halfyear(dt, n, h):
    year = dt.year
    month = 1 if h == 1 else 7
    count = 0
    for m in range(month, month + 6):
        for day in range(1, 32):
            try:
                d = datetime(year, m, day, tzinfo=dt.tzinfo)
            except ValueError:
                break
            if is_business_day(d):
                count += 1
                if count == n:
                    return d
    return None

def nth_day_of_halfyear(dt, n, h):
    year = dt.year
    month = 1 if h == 1 else 7
    days = []
    for m in range(month, month + 6):
        for day in range(1, 32):
            try:
                d = datetime(year, m, day, tzinfo=dt.tzinfo)
                days.append(d)
            except ValueError:
                break
    if 0 < n <= len(days):
        return days[n - 1]
    return None

def nth_business_day_of_annually(dt, n, y):
    # y is always 1 for annually
    year = dt.year
    count = 0
    for m in range(1, 13):
        for day in range(1, 32):
            try:
                d = datetime(year, m, day, tzinfo=dt.tzinfo)
            except ValueError:
                break
            if is_business_day(d):
                count += 1
                if count == n:
                    return d
    return None

def nth_day_of_annually(dt, n, y):
    # y is always 1 for annually
    year = dt.year
    days = []
    for m in range(1, 13):
        for day in range(1, 32):
            try:
                d = datetime(year, m, day, tzinfo=dt.tzinfo)
                days.append(d)
            except ValueError:
                break
    if 0 < n <= len(days):
        return days[n - 1]
    return None

def check_and_run_jobs():
    while True:
        schedules = load_schedules()
        now_utc = datetime.utcnow()
        for sch in schedules:
            tz = pytz.timezone(sch.get("timezone", "UTC"))
            now = now_utc.replace(tzinfo=pytz.utc).astimezone(tz)
            time_str = now.strftime("%H:%M")
            custom = sch.get("customScheduler")
            should_run = False

            if custom:
                ctype = custom.get("type")
                x = int(custom.get("x", 1))
                y = int(custom.get("y", 1)) if custom.get("y") else 1

                if ctype == "business_day_month":
                    target = nth_business_day_of_month(now, x)
                elif ctype == "day_month":
                    target = nth_day_of_month(now, x)
                elif ctype == "business_day_quarter":
                    target = nth_business_day_of_quarter(now, x, y)
                elif ctype == "day_quarter":
                    target = nth_day_of_quarter(now, x, y)
                elif ctype == "business_day_halfyear":
                    target = nth_business_day_of_halfyear(now, x, y)
                elif ctype == "day_halfyear":
                    target = nth_day_of_halfyear(now, x, y)
                elif ctype == "business_day_annually":
                    target = nth_business_day_of_annually(now, x, y)
                elif ctype == "day_annually":
                    target = nth_day_of_annually(now, x, y)
                else:
                    target = None

                if target and target.date() == now.date() and time_str == sch.get("time", ""):
                    should_run = True
            else:
                weekday = now.strftime("%A")
                if (
                    weekday in sch.get("weekdays", [])
                    and time_str == sch.get("time", "")
                ):
                    should_run = True

            if should_run:
                try:
                    requests.post(
                        f"{API_URL}/jobs/{sch['jobId']}/run",
                        json={
                            "trigger_type": "scheduled",
                            "scheduler_id": sch.get("id")
                        },
                        timeout=5
                    )
                    print(f"Triggered job {sch['jobId']} (Scheduler ID: {sch.get('id')}) at {now}")
                except Exception as e:
                    print(f"Failed to trigger job {sch['jobId']}: {e}")
        time.sleep(60)  # Check every minute
        
def start_scheduler():
    t = threading.Thread(target=check_and_run_jobs, daemon=True)
    t.start()