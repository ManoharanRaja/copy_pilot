import os
import shutil
import io
import sys
from fastapi import Body, Path, FastAPI, HTTPException, Request
from backend.models.copy_job import CopyJob
from backend.models.data_source import DataSource
from backend.storage.data_source_storage import load_data_sources, save_data_sources
from backend.storage.job_details_storage import load_jobs, save_jobs
from fastapi.responses import JSONResponse
from backend.utils.crypto import encrypt,ENCRYPTION_KEY
from backend.jobs.runner import router as job_router
from backend.jobs.scheduler import router as scheduler_router
from backend.jobs.scheduler_runner import start_scheduler
from backend.jobs.runner import router as job_router
from fastapi.concurrency import run_in_threadpool
from backend.utils.azure_utils import test_adls_connection
from backend.models.global_variables import GlobalVariable
from backend.storage.global_variable_storage import load_global_variables, save_global_variables
from backend.utils.python_exec_utils import safe_exec, unsafe_exec


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

@app.get("/global-variables")
def list_global_variables():
    return load_global_variables()

@app.post("/global-variables")
def add_global_variable(var: GlobalVariable):
    vars = load_global_variables()
    if any(v["name"] == var.name for v in vars):
        raise HTTPException(status_code=400, detail="Variable name already exists.")
    vars.append(var.dict())
    save_global_variables(vars)
    return var

@app.put("/global-variables/{var_id}")
def update_global_variable(var_id: str, var: GlobalVariable):
    vars = load_global_variables()
    for idx, v in enumerate(vars):
        if v["id"] == var_id:
            if any(other["name"] == var.name and other["id"] != var_id for other in vars):
                raise HTTPException(status_code=400, detail="Variable name already exists.")
            vars[idx] = var.dict()
            save_global_variables(vars)
            return var
    raise HTTPException(status_code=404, detail="Variable not found.")

@app.delete("/global-variables/{var_id}")
def delete_global_variable(var_id: str):
    vars = load_global_variables()
    new_vars = [v for v in vars if v["id"] != var_id]
    if len(new_vars) == len(vars):
        raise HTTPException(status_code=404, detail="Variable not found.")
    save_global_variables(new_vars)
    return {"detail": "Deleted"}

@app.post("/global-variables/eval")
def eval_global_variable(payload: dict = Body(...)):
    code = payload.get("expr", "")
    name = payload.get("name", "")
    value = None

    import io, sys
    output = io.StringIO()
    try:
        sys_stdout = sys.stdout
        sys.stdout = output
        local_vars = {}
        exec(code, {}, local_vars)
        sys.stdout = sys_stdout
        if "result" in local_vars:
            value = local_vars["result"]
        else:
            val = output.getvalue()
            value = val.strip() if val else "Code executed. No output."
    except Exception as e:
        sys.stdout = sys_stdout
        value = f"Error: {e}"

    # Update value in JSON if successful
    if name and not str(value).startswith("Error:"):
        variables = load_global_variables()
        updated = False
        for v in variables:
            if v["name"] == name and v["type"] == "dynamic":
                v["value"] = str(value)
                updated = True
                print(f"Updated variable '{v['name']}' with value: {value}")  # Debug
                break
        if updated:
            save_global_variables(variables)

    return {"value": value}

@app.get("/jobs/{job_id}/local-variables")
def list_local_variables(job_id: str):
    jobs = load_jobs()
    job = next((j for j in jobs if str(j.get("id")) == str(job_id)), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.get("local_variables", [])

@app.post("/jobs/{job_id}/local-variables")
def add_local_variable(job_id: str, var: dict = Body(...)):
    jobs = load_jobs()
    for job in jobs:
        if str(job.get("id")) == str(job_id):
            local_vars = job.get("local_variables", [])
            if any(v["name"] == var["name"] for v in local_vars):
                raise HTTPException(status_code=400, detail="Variable name already exists.")
            local_vars.append(var)
            job["local_variables"] = local_vars
            save_jobs(jobs)
            return var
    raise HTTPException(status_code=404, detail="Job not found")

@app.put("/jobs/{job_id}/local-variables/{var_id}")
def update_local_variable(job_id: str, var_id: str, var: dict = Body(...)):
    jobs = load_jobs()
    for job in jobs:
        if str(job.get("id")) == str(job_id):
            local_vars = job.get("local_variables", [])
            for idx, v in enumerate(local_vars):
                if v["id"] == var_id:
                    local_vars[idx] = var
                    job["local_variables"] = local_vars
                    save_jobs(jobs)
                    return var
            raise HTTPException(status_code=404, detail="Variable not found")
    raise HTTPException(status_code=404, detail="Job not found")

@app.delete("/jobs/{job_id}/local-variables/{var_id}")
def delete_local_variable(job_id: str, var_id: str):
    jobs = load_jobs()
    for job in jobs:
        if str(job.get("id")) == str(job_id):
            local_vars = job.get("local_variables", [])
            new_vars = [v for v in local_vars if v["id"] != var_id]
            if len(new_vars) == len(local_vars):
                raise HTTPException(status_code=404, detail="Variable not found")
            job["local_variables"] = new_vars
            save_jobs(jobs)
            return {"detail": "Deleted"}
    raise HTTPException(status_code=404, detail="Job not found")

@app.post("/jobs/{job_id}/local-variables/eval")
def eval_local_variable(job_id: str, payload: dict = Body(...)):
    code = payload.get("expr", "")
    name = payload.get("name", "")
    value = None

    import io, sys
    output = io.StringIO()
    try:
        sys_stdout = sys.stdout
        sys.stdout = output
        local_vars = {}
        exec(code, {}, local_vars)
        sys.stdout = sys_stdout
        if "result" in local_vars:
            value = local_vars["result"]
        else:
            val = output.getvalue()
            value = val.strip() if val else "Code executed. No output."
    except Exception as e:
        sys.stdout = sys_stdout
        value = f"Error: {e}"

    # Update value in the job's local_variables if successful
    if name and not str(value).startswith("Error:"):
        from backend.storage.job_details_storage import load_jobs, save_jobs
        jobs = load_jobs()
        for job in jobs:
            if str(job.get("id")) == str(job_id):
                local_vars_list = job.get("local_variables", [])
                updated = False
                for v in local_vars_list:
                    if v["name"] == name and v["type"] == "dynamic":
                        v["value"] = str(value)
                        updated = True
                        break
                if updated:
                    job["local_variables"] = local_vars_list
                    save_jobs(jobs)
                break

    return {"value": value}