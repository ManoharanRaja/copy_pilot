from fastapi import Body, APIRouter, HTTPException
from backend.models.global_variables import GlobalVariable
from backend.storage.global_variable_storage import load_global_variables, save_global_variables

router = APIRouter()

@router.get("/global-variables")
def list_global_variables():
    return load_global_variables()

@router.post("/global-variables")
def add_global_variable(var: GlobalVariable):
    vars = load_global_variables()
    if any(v["name"] == var.name for v in vars):
        raise HTTPException(status_code=400, detail="Variable name already exists.")
    vars.append(var.dict())
    save_global_variables(vars)
    return var

@router.put("/global-variables/{var_id}")
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

@router.delete("/global-variables/{var_id}")
def delete_global_variable(var_id: str):
    vars = load_global_variables()
    new_vars = [v for v in vars if v["id"] != var_id]
    if len(new_vars) == len(vars):
        raise HTTPException(status_code=404, detail="Variable not found.")
    save_global_variables(new_vars)
    return {"detail": "Deleted"}

@router.post("/global-variables/eval")
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
