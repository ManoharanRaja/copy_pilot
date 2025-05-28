import os
import shutil
from fastapi import Path
from fastapi import FastAPI, HTTPException
from backend.models.copy_job import CopyJob
from backend.models.data_source import DataSource
from backend.storage.data_source_storage import load_data_sources, save_data_sources
from fastapi import Request
from fastapi.responses import JSONResponse
from backend.utils.crypto import encrypt,ENCRYPTION_KEY

app = FastAPI()
jobs = []
job_id_counter = 1
connections = []
connection_id_counter = 1

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
    if ds.type == "adls" and "account_key" in ds.config:
        ds.config["account_key"] = encrypt(ds.config["account_key"], ENCRYPTION_KEY)
    # Dynamically assign the next id
    ds.id = max([d.get("id", 0) for d in data_sources], default=0) + 1
    data_sources.append(ds.dict())
    save_data_sources(data_sources)
    return ds

@app.delete("/datasources/{ds_id}")
def delete_data_source(ds_id: int = Path(..., description="The ID of the data source to delete")):
    data_sources = load_data_sources()
    new_sources = [ds for ds in data_sources if ds.get("id") != ds_id]
    if len(new_sources) == len(data_sources):
        raise HTTPException(status_code=404, detail="Data source not found")
    save_data_sources(new_sources)
    return {"detail": "Deleted"}

@app.put("/datasources/{ds_id}")
def update_data_source(ds_id: int, ds: DataSource):
    data_sources = load_data_sources()
    found = False
    for idx, existing in enumerate(data_sources):
        if existing.get("id") == ds_id:
            # Prevent name duplication (except for itself)
            if any(d["name"].lower() == ds.name.lower() and d["id"] != ds_id for d in data_sources):
                raise HTTPException(status_code=400, detail="Data source name already exists.")
            # Encrypt account_key if present and changed
            if ds.type == "adls" and "account_key" in ds.config:
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
    # Here you would use Azure SDK to test the connection.
    # For now, we'll mock success if all fields are non-empty.
    if (
        config.get("account_name")
        and config.get("account_key")
        and config.get("container")
    ):
        # TODO: Replace with real ADLS connection test
        return JSONResponse({"success": True})
    return JSONResponse({"success": False})

@app.get("/jobs")
def list_jobs():
    return jobs

@app.post("/jobs")
def add_job(job: CopyJob):
    global job_id_counter
    job.id = job_id_counter
    job_id_counter += 1
    jobs.append(job)
    return job

@app.put("/jobs/{job_id}")
def edit_job(job_id: int, job: CopyJob):
    for idx, j in enumerate(jobs):
        if j.id == job_id:
            jobs[idx] = job
            jobs[idx].id = job_id
            return jobs[idx]
    raise HTTPException(status_code=404, detail="Job not found")

@app.delete("/jobs/{job_id}")
def delete_job(job_id: int):
    global jobs
    jobs = [j for j in jobs if j.id != job_id]
    return {"detail": "Deleted"}

@app.post("/jobs/{job_id}/run")
def run_job(job_id: int):
    job = next((j for j in jobs if j.id == job_id), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # Simple copy logic: copy all files from source to target
    if not os.path.exists(job.source):
        raise HTTPException(status_code=400, detail="Source folder does not exist")
    if not os.path.exists(job.target):
        os.makedirs(job.target)
    for filename in os.listdir(job.source):
        src_file = os.path.join(job.source, filename)
        dst_file = os.path.join(job.target, filename)
        if os.path.isfile(src_file):
            shutil.copy2(src_file, dst_file)
    return {"detail": f"Job {job_id} completed"}