from datetime import datetime
from fastapi import APIRouter, HTTPException, Request
from backend.models.copy_job import CopyJob
from backend.storage.job_details_storage import load_jobs, save_jobs
from backend.storage.run_history_storage import load_run_history

router = APIRouter()

@router.get("/jobs")
def list_jobs():
    jobs = load_jobs()
    for job in jobs:
        run_history = load_run_history(job["id"])
        if run_history:
            latest_run = run_history[-1]
            job["latest_run_result"] = {
                "status": latest_run.get("status"),
                "message": latest_run.get("message"),
                "copied_files_count": (
                    sum(len(dr.get("copied_files", [])) for dr in latest_run.get("date_runs", []))
                    if "date_runs" in latest_run
                    else len(latest_run.get("copied_files", []))
                ),
                "timestamp": latest_run.get("timestamp"),
            }
        else:
            job["latest_run_result"] = None
    return jobs

@router.post("/jobs")
def add_job(job: CopyJob, request: Request):
    jobs = load_jobs()
    if any(j["name"].strip().lower() == job.name.strip().lower() for j in jobs):
        raise HTTPException(status_code=400, detail="A job with this name already exists.")
    now = datetime.now().isoformat()
    job.created_on = now
    job.updated_on = now
    # Get machine name from custom header
    machine_name = request.headers.get("x-machine-name")
    job.created_by = machine_name
    job.updated_by = machine_name
    jobs.append(job.dict())
    save_jobs(jobs)
    return job

@router.put("/jobs/{job_id}")
def edit_job(job_id: str, job: CopyJob, request: Request):
    jobs = load_jobs()
    for idx, j in enumerate(jobs):
        if str(j.get("id")) == str(job_id):
            job.id = job_id
            job.created_on = j.get("created_on")  # Preserve original
            job.created_by = j.get("created_by")
            job.updated_on = datetime.now().isoformat()
            # Get machine name from custom header
            machine_name = request.headers.get("x-machine-name")
            job.updated_by = machine_name
            jobs[idx] = job.dict()
            save_jobs(jobs)
            return job
    raise HTTPException(status_code=404, detail="Job not found")

@router.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    jobs = load_jobs()
    new_jobs = [j for j in jobs if str(j.get("id")) != str(job_id)]
    if len(new_jobs) == len(jobs):
        raise HTTPException(status_code=404, detail="Job not found")
    save_jobs(new_jobs)
    return {"detail": "Deleted"}