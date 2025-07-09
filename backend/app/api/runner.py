import os
import json
import uuid
import io
import sys
import glob

from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from backend.app.services.copy_manager import dispatch_copy
from backend.storage.run_history_storage import write_run_status, update_run_status
from backend.storage.global_variable_storage import load_global_variables
from backend.utils.replace_placeholders import resolve_placeholders, find_missing_placeholders
from backend.storage.job_details_storage import load_jobs, save_jobs
from backend.utils.time_travel_utils import get_mocked_datetime_env, patch_datetime_calls
from backend.config.settings import MAX_RUN_HISTORY

router = APIRouter(prefix="/jobs")
RUN_HISTORY_DIR = "backend/data/run_history"
os.makedirs(RUN_HISTORY_DIR, exist_ok=True)

def rotate_run_history(job_id, run_history_dir=RUN_HISTORY_DIR):
    main_file = os.path.join(run_history_dir, f"run_history_{job_id}.json")
    if not os.path.exists(main_file):
        return

    with open(main_file, "r", encoding="utf-8") as f:
        runs = json.load(f)

    if len(runs) > MAX_RUN_HISTORY:
        # Find all archive files and their indices
        pattern = os.path.join(run_history_dir, f"run_history_{job_id}_archive_*.json")
        archives = sorted(glob.glob(pattern))
        last_archive_idx = 0
        last_archive_runs = []
        if archives:
            last_archive_file = archives[-1]
            last_archive_idx = int(os.path.splitext(os.path.basename(last_archive_file))[0].split("_archive_")[-1])
            with open(last_archive_file, "r", encoding="utf-8") as f:
                last_archive_runs = json.load(f)
        else:
            last_archive_file = None

        # Runs to archive (oldest runs)
        to_archive = runs[:-MAX_RUN_HISTORY]

        # If last archive is not full, append to it
        if last_archive_file and len(last_archive_runs) < MAX_RUN_HISTORY:
            space_left = MAX_RUN_HISTORY - len(last_archive_runs)
            to_add = to_archive[:space_left]
            last_archive_runs.extend(to_add)
            with open(last_archive_file, "w", encoding="utf-8") as f:
                json.dump(last_archive_runs, f, indent=2)
            to_archive = to_archive[space_left:]

        # If still runs left to archive, create new archive(s)
        while to_archive:
            last_archive_idx += 1
            archive_file = os.path.join(run_history_dir, f"run_history_{job_id}_archive_{last_archive_idx}.json")
            chunk = to_archive[:MAX_RUN_HISTORY]
            with open(archive_file, "w", encoding="utf-8") as f:
                json.dump(chunk, f, indent=2)
            to_archive = to_archive[MAX_RUN_HISTORY:]

        # Keep only the most recent entries in the main file
        runs = runs[-MAX_RUN_HISTORY:]
        with open(main_file, "w", encoding="utf-8") as f:
            json.dump(runs, f, indent=2)


@router.post("/{job_id}/run")
async def run_job(job_id: str, request: Request):
    parent_run_id = str(uuid.uuid4())
    try:
        data = await request.json() if request.headers.get("content-type") else {}
        trigger_type = data.get("trigger_type", "manual")
        scheduler_id = data.get("scheduler_id")
        jobs = load_jobs()
        job = next((j for j in jobs if str(j.get("id")) == str(job_id)), None)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        global_vars = {v["name"]: v["value"] for v in load_global_variables()}
        local_vars_list = job.get("local_variables", [])
        local_vars = {v["name"]: v["value"] for v in local_vars_list} if local_vars_list else {}
        
        # --- NEW: Write "executing" status at the start ---
        write_run_status(
            job_id,
            parent_run_id,
            status="executing",
            message="Job is running...",
            trigger_type=trigger_type,
            scheduler_id=scheduler_id,
            extra_details={}
        )
        rotate_run_history(job_id)  # Rotate history to keep size manageable
        # --- END NEW ---   
        
        # Check for time travel config
        time_travel = job.get("time_travel", {})
        time_travel_enabled = time_travel.get("enabled", False)
        from_date = time_travel.get("from_date")
        to_date = time_travel.get("to_date")

        # Helper to run the job for a specific date (for time travel)
        async def run_for_date(run_id, run_date_str, original_job):
            error_message = ""
            job = json.loads(json.dumps(original_job))
            updated = False
            for v in local_vars_list:
                if v["type"] == "dynamic":
                    code = v.get("expression", "")
                    value = None
                    output = io.StringIO()
                    try:
                        sys_stdout = sys.stdout
                        sys.stdout = output
                        mocked_env = get_mocked_datetime_env(datetime.strptime(run_date_str, '%Y-%m-%d').date())
                        patched_code = patch_datetime_calls(code)
                        exec(patched_code, mocked_env, {})
                        sys.stdout = sys_stdout
                        val = output.getvalue()
                        value = val.strip() if val else "Code executed. No output."
                    except Exception as e:
                        sys.stdout = sys_stdout
                        value = f"Error: {e}"
                        error_message += f"Dynamic variable error ({v['name']}): {e}\n"
                    v["value"] = str(value)
                    updated = True
            # Always assign local_vars, even if local_vars_list is empty
            local_vars = {v["name"]: v["value"] for v in local_vars_list}

            # Validate placeholders
            fields_to_check = [
                "source", "target", "sourceFileMask", "targetFileMask",
                "sourceContainer", "targetContainer"
            ]
            error_detail = {}
            error_msg_lines = []
            for field in fields_to_check:
                if field in job and isinstance(job[field], str):
                    errors = find_missing_placeholders(job[field], global_vars, local_vars)
                    if errors:
                        error_detail[field] = errors
                        error_msg_lines.append(f"{field}: " + "; ".join(errors))
            if error_detail:
                error_msg = "\n".join(error_msg_lines)
                error_message += error_msg
                return {
                    "success": False,
                    "error": error_detail,
                    "run_id": run_id,
                    "date": run_date_str,
                    "status": "Failed",
                    "message": error_message,
                    "file_mask_used": job.get("sourceFileMask", "*"),
                    "source_files": [],
                    "copied_files": []
                }

            # Do the replacements
            for field in fields_to_check:
                if field in job and isinstance(job[field], str):
                    job[field] = resolve_placeholders(job[field], global_vars, local_vars)

            # Perform the copy logic
            try:
                copied_files, source_files = await run_in_threadpool(dispatch_copy, job)
                status = "Success"
                message = f"Copied {len(copied_files)} files for date {run_date_str}."
            except NotImplementedError as nie:
                copied_files = []
                source_files = []
                status = "Failed"
                message = f"Copy logic not implemented: {nie}"
                error_message += message
            except Exception as copy_exc:
                copied_files = []
                source_files = []
                status = "Failed"
                message = f"Copy failed: {repr(copy_exc)}"
                error_message += message

            return {
                "success": status == "Success",
                "status": status,
                "message": message if status == "Success" else error_message or message,
                "run_id": run_id,
                "date": run_date_str,
                "file_mask_used": job.get("sourceFileMask", "*"),
                "source_files": source_files,
                "copied_files": copied_files
            }

        # If time travel is enabled and dates are valid, run for each date in range and store as a single parent run
        if time_travel_enabled and from_date and to_date:
            from_dt = datetime.strptime(from_date, "%Y-%m-%d")
            to_dt = datetime.strptime(to_date, "%Y-%m-%d")
            date_runs = []
            num_days = (to_dt - from_dt).days
            for n in range(num_days + 1):  # inclusive
                this_date = from_dt + timedelta(days=n)
                run_id_date = f"{parent_run_id}-{this_date.strftime('%Y%m%d')}"
                result = await run_for_date(run_id_date, this_date.strftime('%Y-%m-%d'), job)
                date_runs.append(result)
            # Write a single parent run with all date results
            write_run_status(
                job_id,
                parent_run_id,
                status="Success" if all(r["success"] for r in date_runs) else "Failed",
                message="Time travel run completed for date range.",
                trigger_type=trigger_type,
                scheduler_id=scheduler_id,
                extra_details={
                    "from_date": from_date,
                    "to_date": to_date,
                    "date_runs": date_runs
                }
            )
            # Rotate history to keep size manageable
            rotate_run_history(job_id)
            return JSONResponse({
                "success": all(r["success"] for r in date_runs),
                "parent_run_id": parent_run_id,
                "date_runs": date_runs
            })
        else:
            # Normal run for today's date
            today_str = datetime.now().strftime('%Y-%m-%d')
            result = await run_for_date(parent_run_id, today_str, job)
            write_run_status(
                job_id,
                parent_run_id,
                status=result.get("status", "Failed"),
                message=result.get("message", ""),
                trigger_type=trigger_type,
                scheduler_id=scheduler_id,
                extra_details={"date_runs": [result]}
            )
            rotate_run_history(job_id)  # Rotate history to keep size manageable
            return JSONResponse(result)
    except Exception as e:
        # Always log the failed run in run history for visibility in UI
        write_run_status(
            job_id,
            parent_run_id,
            status="Failed",
            message=f"Unexpected error: {e}",
            trigger_type="manual",
            scheduler_id=None,
            extra_details={"date_runs": [], "error_detail": str(e)}
        )
        rotate_run_history(job_id)
        # Return the error message to the frontend
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

@router.get("/{job_id}/run-history")
def get_run_history(job_id: str, archive: int = None):
    """
    Returns the main run history file by default.
    If archive=N is provided, returns the Nth archive file.
    """
    if archive is not None:
        history_file = os.path.join(RUN_HISTORY_DIR, f"run_history_{job_id}_archive_{archive}.json")
    else:
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
    
    
@router.get("/{job_id}/run-history-archives")
def list_run_history_archives(job_id: str):
    """
    Lists all archive files for a job.
    """
    pattern = os.path.join(RUN_HISTORY_DIR, f"run_history_{job_id}_archive_*.json")
    archives = sorted(glob.glob(pattern))
    archive_indices = [
        int(os.path.splitext(os.path.basename(f))[0].split("_archive_")[-1])
        for f in archives
    ]
    return JSONResponse({"archives": archive_indices})