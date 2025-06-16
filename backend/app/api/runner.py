import os
import json
import traceback
import uuid
import io
import sys

from fastapi.concurrency import run_in_threadpool
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from backend.app.services.copy_manager import dispatch_copy
from backend.storage.run_history_storage import write_run_status, update_run_status
from backend.storage.global_variable_storage import load_global_variables
from backend.utils.replace_placeholders import resolve_placeholders, find_missing_placeholders
from backend.storage.job_details_storage import load_jobs, save_jobs

router = APIRouter(prefix="/jobs")
RUN_HISTORY_DIR = "backend/data/run_history"
os.makedirs(RUN_HISTORY_DIR, exist_ok=True)

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
        local_vars = {v["name"]: v["value"] for v in local_vars_list}

        # Check for time travel config
        time_travel = job.get("time_travel", {})
        time_travel_enabled = time_travel.get("enabled", False)
        from_date = time_travel.get("from_date")
        to_date = time_travel.get("to_date")

        # Helper to run the job for a specific date (for time travel)
        async def run_for_date(run_id, run_date_str):
            error_message = ""
            # Refresh dynamic local variables for this date
            updated = False
            for v in local_vars_list:
                if v["type"] == "dynamic":
                    code = v.get("expression", "")
                    value = None
                    output = io.StringIO()
                    try:
                        sys_stdout = sys.stdout
                        sys.stdout = output
                        # Inject run_date as the date being processed
                        exec(code, {}, {})
                        sys.stdout = sys_stdout
                        val = output.getvalue()
                        value = val.strip() if val else "Code executed. No output."
                    except Exception as e:
                        sys.stdout = sys_stdout
                        value = f"Error: {e}"
                        error_message += f"Dynamic variable error ({v['name']}): {e}\n"
                    v["value"] = str(value)
                    updated = True
            if updated:
                for job_obj in jobs:
                    if str(job_obj.get("id")) == str(job_id):
                        job_obj["local_variables"] = local_vars_list
                        break
                save_jobs(jobs)
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
                message = f"Copy failed: {repr(copy_exc)}\nTraceback:\n{traceback.format_exc()}"
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
                result = await run_for_date(run_id_date, this_date.strftime('%Y-%m-%d'))
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
            return JSONResponse({
                "success": all(r["success"] for r in date_runs),
                "parent_run_id": parent_run_id,
                "date_runs": date_runs
            })
        else:
            # Normal run for today's date
            today_str = datetime.now().strftime('%Y-%m-%d')
            result = await run_for_date(parent_run_id, today_str)
            write_run_status(
                job_id,
                parent_run_id,
                status=result.get("status", "Failed"),
                message=result.get("message", ""),
                trigger_type=trigger_type,
                scheduler_id=scheduler_id,
                extra_details={"date_runs": [result]}
            )
            return JSONResponse(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")

@router.get("/{job_id}/run-history")
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