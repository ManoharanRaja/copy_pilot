import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter()
SCHEDULE_FILE = "backend/data/schedules.json"

def load_schedules():
    if not os.path.exists(SCHEDULE_FILE):
        return []
    with open(SCHEDULE_FILE, "r") as f:
        return json.load(f)

def save_schedules(schedules):
    with open(SCHEDULE_FILE, "w") as f:
        json.dump(schedules, f, indent=2)

@router.get("/schedules")
def get_schedules():
    return load_schedules()

@router.post("/schedules")
def add_schedule(schedule: dict):
    schedules = load_schedules()
    # Assign a unique id
    schedule["id"] = max([s.get("id", 0) for s in schedules] or [0]) + 1
    schedules.append(schedule)
    save_schedules(schedules)
    return schedule

@router.put("/schedules/{schedule_id}")
def update_schedule(schedule_id: int, updated: dict):
    schedules = load_schedules()
    found = False
    for idx, sch in enumerate(schedules):
        if sch.get("id") == schedule_id:
            updated["id"] = schedule_id  # Ensure ID stays the same
            schedules[idx] = updated
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Schedule not found")
    save_schedules(schedules)
    return updated

@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id: int):
    schedules = load_schedules()
    new_schedules = [s for s in schedules if s.get("id") != schedule_id]
    if len(new_schedules) == len(schedules):
        raise HTTPException(status_code=404, detail="Schedule not found")
    save_schedules(new_schedules)
    return {"detail": "Deleted"}