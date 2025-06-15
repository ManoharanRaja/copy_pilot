import os
import json
import traceback
import uuid

from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime
from backend.app.services.copy_manager import dispatch_copy
from backend.storage.run_history_storage import write_run_status, update_run_status
from backend.storage.global_variable_storage import load_global_variables
from backend.utils.replace_placeholders import resolve_placeholders, find_missing_placeholders
from backend.storage.job_details_storage import load_jobs

router = APIRouter()
RUN_HISTORY_DIR = "backend/data/run_history"
os.makedirs(RUN_HISTORY_DIR, exist_ok=True)

@router.post("/jobs/{job_id}/run")
async def run_job(job_id: str, request: Request):
    run_id = str(uuid.uuid4())
    try:
        data = await request.json() if request.headers.get("content-type") else {}
        trigger_type = data.get("trigger_type", "manual")
        scheduler_id = data.get("scheduler_id")
        jobs = load_jobs()
        job = next((j for j in jobs if str(j.get("id")) == str(job_id)), None)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        global_vars = {v["name"]: v["value"] for v in load_global_variables()}
        local_vars = data.get("local_vars", job.get("local_vars", {}))

        # List all fields to check for placeholders
        fields_to_check = [
            "source", "target", "sourceFileMask", "targetFileMask",
            "sourceContainer", "targetContainer"
        ]
        error_detail = {}
        error_msg_lines = []

        # Validate all fields and collect errors
        for field in fields_to_check:
            if field in job and isinstance(job[field], str):
                errors = find_missing_placeholders(job[field], global_vars, local_vars)
                if errors:
                    error_detail[field] = errors
                    error_msg_lines.append(f"{field}: " + "; ".join(errors))

        if error_detail:
            error_msg = "\n".join(error_msg_lines)
            write_run_status(job_id, run_id, "Failed", error_msg, trigger_type, scheduler_id)
            return JSONResponse({"success": False, "error": error_detail}, status_code=400)

        # If no errors, do the replacements
        for field in fields_to_check:
            if field in job and isinstance(job[field], str):
                job[field] = resolve_placeholders(job[field], global_vars, local_vars)
    
        # 1. Immediately write a "Started" run record with run_id
        write_run_status(
            job_id,
            run_id,
            status="Started",
            message="Job started and is in progress.",
            trigger_type=trigger_type,
            scheduler_id=scheduler_id
        )

        # 2. Perform the copy logic in a thread pool
        try:
            copied_files, source_files = await run_in_threadpool(dispatch_copy, job)
            status = "Success"
            message = f"Copied {len(copied_files)} files."
        except NotImplementedError as nie:
            copied_files = []
            source_files = []
            status = "Failed"
            message = f"Copy logic not implemented: {nie}"
        except Exception as copy_exc:
            copied_files = []
            source_files = []
            status = "Failed"
            message = f"Copy failed: {repr(copy_exc)}\nTraceback:\n{traceback.format_exc()}"

        # 3. Update the same run record with the final status and details
        update_run_status(
            job_id,
            run_id,
            status,
            message,
            job.get("sourceFileMask", "*"),
            source_files,
            copied_files,
            trigger_type=trigger_type,
            scheduler_id=scheduler_id
        )

        return JSONResponse({"success": status == "Success", "status": status, "message": message, "run_id": run_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

@router.get("/jobs/{job_id}/run-history")
def get_run_history(job_id: str):
    history_file = os.path.join(RUN_HISTORY_DIR, f"run_history_{job_id}.json")
    try:
        if os.path.exists(history_file):
            with open(history_file, "r") as f:
                history = json.load(f)
        else:
            history = []
        return JSONResponse(history)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to read run history.")