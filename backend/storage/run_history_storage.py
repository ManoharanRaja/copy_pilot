import json
import os
from datetime import datetime

def load_run_history(job_id):
    history_file = f"backend/data/run_history/run_history_{job_id}.json"
    if os.path.exists(history_file):
        with open(history_file, "r") as f:
            return json.load(f)
    return []

def save_run_history(job_id, history):
    history_file = f"backend/data/run_history/run_history_{job_id}.json"
    with open(history_file, "w") as f:
        json.dump(history, f, indent=2)

def write_run_status(
    job_id,
    run_id,
    status,
    message="",
    trigger_type="manual",
    scheduler_id=None,
    file_mask_used="",
    source_files=None,
    copied_files=None,
    extra_details=None
):
    """
    Write a new run record with the given run_id and status to the run history file.
    extra_details: dict, any additional info to log (e.g., time_travel_date, error_detail, etc.)
    """
    history = load_run_history(job_id)
    run_record = {
        "run_id": run_id,
        "timestamp": datetime.utcnow().isoformat(),
        "status": status,
        "message": message,
        "file_mask_used": file_mask_used or "",
        "source_files": source_files if source_files is not None else [],
        "copied_files": copied_files if copied_files is not None else [],
        "trigger_type": trigger_type
    }
    if scheduler_id is not None:
        run_record["scheduler_id"] = scheduler_id
    if extra_details and isinstance(extra_details, dict):
        run_record.update(extra_details)
    history.append(run_record)
    save_run_history(job_id, history)

def update_run_status(
    job_id,
    run_id,
    status,
    message,
    file_mask,
    source_files,
    copied_files,
    trigger_type="manual",
    scheduler_id=None,
    extra_details=None
):
    """
    Update the run record with the given run_id in the run history file.
    extra_details: dict, any additional info to log (e.g., time_travel_date, error_detail, etc.)
    """
    history = load_run_history(job_id)
    for record in history:
        if record.get("run_id") == run_id:
            record.update({
                "timestamp": datetime.utcnow().isoformat(),
                "status": status,
                "message": message,
                "file_mask_used": file_mask,
                "source_files": source_files,
                "copied_files": copied_files,
                "trigger_type": trigger_type
            })
            if scheduler_id is not None:
                record["scheduler_id"] = scheduler_id
            if extra_details and isinstance(extra_details, dict):
                record.update(extra_details)
            break
    save_run_history(job_id, history)