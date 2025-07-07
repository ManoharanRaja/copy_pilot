import os
import json
import uuid
from fastapi import APIRouter, HTTPException
from filelock import FileLock

router = APIRouter()
SCHEDULE_FILE = "backend/data/schedules.json"

def load_schedules():
    if not os.path.exists(SCHEDULE_FILE):
        return []
    with open(SCHEDULE_FILE, "r") as f:
        return json.load(f)

def save_schedules(schedules):
    with FileLock(SCHEDULE_FILE + ".lock"):
        with open(SCHEDULE_FILE, "w") as f:
            json.dump(schedules, f, indent=2)

@router.get("/schedules")
def get_schedules():
    return load_schedules()

@router.post("/schedules")
def add_schedule(schedule: dict):
    schedules = load_schedules()
    if any(s.get("name", "").strip().lower() == schedule.get("name", "").strip().lower() for s in schedules):
        raise HTTPException(status_code=400, detail="A scheduler with this name already exists.")
    schedule["id"] = str(uuid.uuid4())
    schedule["paused"] = False  # <-- Add this line
    schedules.append(schedule)
    save_schedules(schedules)
    return schedule

@router.post("/schedules/{schedule_id}/pause")
def pause_schedule(schedule_id: str):
    schedules = load_schedules()
    found = False
    for sch in schedules:
        if sch.get("id") == schedule_id:
            sch["paused"] = True
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Schedule not found")
    save_schedules(schedules)
    return {"detail": "Paused"}

@router.post("/schedules/{schedule_id}/resume")
def resume_schedule(schedule_id: str):
    schedules = load_schedules()
    found = False
    for sch in schedules:
        if sch.get("id") == schedule_id:
            sch["paused"] = False
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Schedule not found")
    save_schedules(schedules)
    return {"detail": "Resumed"}

@router.put("/schedules/{schedule_id}")
def update_schedule(schedule_id: str, updated: dict):
    schedules = load_schedules()
    found = False
    for idx, sch in enumerate(schedules):
        if sch.get("id") == schedule_id:
            # Unique name check (case-insensitive, except for itself)
            if any(
                s.get("name", "").strip().lower() == updated.get("name", "").strip().lower() and s.get("id") != schedule_id
                for s in schedules
            ):
                raise HTTPException(status_code=400, detail="A scheduler with this name already exists.")
            updated["id"] = schedule_id
            schedules[idx] = updated
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Schedule not found")
    save_schedules(schedules)
    return updated

@router.delete("/schedules/{schedule_id}")
def delete_schedule(schedule_id: str):
    schedules = load_schedules()
    new_schedules = [s for s in schedules if s.get("id") != schedule_id]
    if len(new_schedules) == len(schedules):
        raise HTTPException(status_code=404, detail="Schedule not found")
    save_schedules(new_schedules)
    return {"detail": "Deleted"}