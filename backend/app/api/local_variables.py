from fastapi import APIRouter, Body, HTTPException
from backend.storage.job_details_storage import load_jobs, save_jobs

router = APIRouter()

@router.get("/jobs/{job_id}/local-variables")
def list_local_variables(job_id: str):
    jobs = load_jobs()
    job = next((j for j in jobs if str(j.get("id")) == str(job_id)), None)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.get("local_variables", [])

@router.post("/jobs/{job_id}/local-variables")
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

@router.put("/jobs/{job_id}/local-variables/{var_id}")
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

@router.delete("/jobs/{job_id}/local-variables/{var_id}")
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

@router.post("/jobs/{job_id}/local-variables/eval")
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