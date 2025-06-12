import os
import json
import threading
import time
import shutil
import fnmatch

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime

router = APIRouter()
RUN_HISTORY_DIR = "backend/data/run_history"
os.makedirs(RUN_HISTORY_DIR, exist_ok=True)

def update_run_status_later(history_file, delay=2):
    time.sleep(delay)
    if os.path.exists(history_file):
        with open(history_file, "r") as f:
            history = json.load(f)
        if history and history[-1]["status"] == "Started":
            history[-1]["status"] = "Success"
            history[-1]["message"] = "Copy completed"
            with open(history_file, "w") as f:
                json.dump(history, f, indent=2)
                
                
@router.post("/jobs/{job_id}/run")
async def run_job(job_id: int, request: Request):
    data = await request.json() if request.headers.get("content-type") else {}
    trigger_type = data.get("trigger_type", "manual")
    scheduler_id = data.get("scheduler_id")  # <-- Get scheduler_id if present
    timestamp = data.get("timestamp") or datetime.utcnow().isoformat()
    history_file = os.path.join(RUN_HISTORY_DIR, f"run_history_{job_id}.json")

    from backend.storage.job_details_storage import load_jobs
    jobs = load_jobs()
    job = next((j for j in jobs if j.get("id") == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    source = job["source"]
    target = job["target"]
    file_mask = job.get("sourceFileMask", "*")

    # --- List files in source and target ---
    source_files = []
    target_files = []
    if os.path.exists(source):
        all_files = [f for f in os.listdir(source) if os.path.isfile(os.path.join(source, f))]
        # Filter files by mask and store full path
        source_files = [os.path.join(source, f) for f in fnmatch.filter(all_files, file_mask)]
    if os.path.exists(target):
        target_files = [os.path.join(target, f) for f in os.listdir(target) if os.path.isfile(os.path.join(target, f))]

    copied_files = []

    # --- Copy files matching the mask ---
    if not os.path.exists(target):
        os.makedirs(target)
    for src_file in source_files:
        filename = os.path.basename(src_file)
        dst_file = os.path.join(target, filename)
        try:
            shutil.copy2(src_file, dst_file)
            copied_files.append(dst_file)
        except Exception as e:
            pass  # Optionally log errors

    run_record = {
        "timestamp": timestamp,
        "status": "Success",
        "message": f"Copied {len(copied_files)} files.",
        "file_mask_used": file_mask,
        "source_files": source_files,
        "copied_files": copied_files,
        "trigger_type": trigger_type
    }
    if scheduler_id is not None:
        run_record["scheduler_id"] = scheduler_id

    # --- Save run history ---
    if os.path.exists(history_file):
        with open(history_file, "r") as f:
            history = json.load(f)
    else:
        history = []
    history.append(run_record)
    with open(history_file, "w") as f:
        json.dump(history, f, indent=2)

    return JSONResponse({"success": True})

@router.get("/jobs/{job_id}/run-history")
def get_run_history(job_id: int):
    history_file = os.path.join(RUN_HISTORY_DIR, f"run_history_{job_id}.json")
    if os.path.exists(history_file):
        with open(history_file, "r") as f:
            history = json.load(f)
    else:
        history = []
    return JSONResponse(history)