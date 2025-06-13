import os
import shutil
from fastapi import Path
from fastapi import FastAPI, HTTPException
from backend.models.copy_job import CopyJob
from backend.models.data_source import DataSource
from backend.storage.data_source_storage import load_data_sources, save_data_sources
from backend.storage.job_details_storage import load_jobs, save_jobs
from fastapi import Request
from fastapi.responses import JSONResponse
from backend.utils.crypto import encrypt,ENCRYPTION_KEY
from backend.jobs.runner import router as job_router
from backend.jobs.scheduler import router as scheduler_router
from backend.jobs.scheduler_runner import start_scheduler
from backend.jobs.runner import router as job_router
from fastapi.concurrency import run_in_threadpool
from backend.utils.azure_utils import test_adls_connection

app = FastAPI()

jobs = []
job_id_counter = 1
connections = []
connection_id_counter = 1
# Initialize the app with the job router
app.include_router(job_router)
app.include_router(scheduler_router)
app.include_router(job_router)
start_scheduler()

@app.get("/datasources")
def list_data_sources():
    return load_data_sources()

@app.post("/datasources")
def add_data_source(ds: DataSource):
    data_sources = load_data_sources()
    # Check for unique name (case-insensitive)
    if any(d["name"].lower() == ds.name.lower() for d in data_sources):
        raise HTTPException(status_code=400, detail="Data source name already exists.")
    # Encrypt account_key if present
    if ds.type == "Azure Data Lake Storage" and "account_key" in ds.config:
        ds.config["account_key"] = encrypt(ds.config["account_key"], ENCRYPTION_KEY)
    # Dynamically assign the id
    data_sources.append(ds.dict())
    save_data_sources(data_sources)
    return ds

@app.delete("/datasources/{ds_id}")
def delete_data_source(ds_id: str = Path(..., description="The ID of the data source to delete")):
    data_sources = load_data_sources()
    new_sources = [ds for ds in data_sources if str(ds.get("id")) != str(ds_id)]
    if len(new_sources) == len(data_sources):
        raise HTTPException(status_code=404, detail="Data source not found")
    save_data_sources(new_sources)
    return {"detail": "Deleted"}

@app.put("/datasources/{ds_id}")
def update_data_source(ds_id: str, ds: DataSource):
    data_sources = load_data_sources()
    found = False
    for idx, existing in enumerate(data_sources):
        if str(existing.get("id")) == str(ds_id):
            # Prevent name duplication (except for itself)
            if any(d["name"].lower() == ds.name.lower() and str(d["id"]) != str(ds_id) for d in data_sources):
                raise HTTPException(status_code=400, detail="Data source name already exists.")
            # Encrypt account_key if present and changed
            if ds.type == "Azure Data Lake Storage" and "account_key" in ds.config:
                from backend.utils.crypto import encrypt, ENCRYPTION_KEY
                ds.config["account_key"] = encrypt(ds.config["account_key"], ENCRYPTION_KEY)
            ds.id = ds_id  # Ensure ID stays the same
            data_sources[idx] = ds.dict()
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Data source not found")
    save_data_sources(data_sources)
    return ds

@app.post("/datasources/test")
async def test_data_source(request: Request):
    data = await request.json()
    config = data.get("config", {})
    ds_type = data.get("type", "")

    if ds_type == "Azure Data Lake Storage":
        def do_test():
            account_name = config.get("account_name")
            account_key = config.get("account_key")
            container = config.get("container")
            if not (account_name and account_key):
                return {"success": False, "message": "Missing required fields."}
            success, message = test_adls_connection(account_name, account_key, container)
            return {"success": success, "message": message}

        result = await run_in_threadpool(do_test)
        return JSONResponse(result)
    else:
        return JSONResponse({"success": False, "message": "Unsupported data source type."})

@app.get("/jobs")
def list_jobs():
    return load_jobs()

@app.post("/jobs")
def add_job(job: CopyJob):
    jobs = load_jobs()
    # Unique name check
    if any(j["name"].strip().lower() == job.name.strip().lower() for j in jobs):
        raise HTTPException(status_code=400, detail="A job with this name already exists.")
    jobs.append(job.dict())
    save_jobs(jobs)
    return job

@app.put("/jobs/{job_id}")
def edit_job(job_id: str, job: CopyJob):
    jobs = load_jobs()
    for idx, j in enumerate(jobs):
        if str(j.get("id")) == str(job_id):
            job.id = job_id  # Ensure ID stays the same
            jobs[idx] = job.dict()
            save_jobs(jobs)
            return job
    raise HTTPException(status_code=404, detail="Job not found")

@app.delete("/jobs/{job_id}")
def delete_job(job_id: str):
    jobs = load_jobs()
    new_jobs = [j for j in jobs if str(j.get("id")) != str(job_id)]
    if len(new_jobs) == len(jobs):
        raise HTTPException(status_code=404, detail="Job not found")
    save_jobs(new_jobs)
    return {"detail": "Deleted"}