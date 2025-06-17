from fastapi import APIRouter, HTTPException
from backend.models.copy_job import CopyJob
from backend.storage.job_details_storage import load_jobs, save_jobs

router = APIRouter()

@router.get("/jobs")
def list_jobs():
    return load_jobs()

@router.post("/jobs")
def add_job(job: CopyJob):
    jobs = load_jobs()
    # Unique name check
    if any(j["name"].strip().lower() == job.name.strip().lower() for j in jobs):
        raise HTTPException(status_code=400, detail="A job with this name already exists.")
    jobs.append(job.dict())
    save_jobs(jobs)
    return job

@router.put("/jobs/{job_id}")
def edit_job(job_id: str, job: CopyJob):
    jobs = load_jobs()
    for idx, j in enumerate(jobs):
        if str(j.get("id")) == str(job_id):
            job.id = job_id  # Ensure ID stays the same
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
