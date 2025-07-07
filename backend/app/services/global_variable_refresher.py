import threading
import time
from datetime import datetime, timedelta
from backend.storage.global_variable_storage import load_global_variables, save_global_variables

def eval_python_code(expr):
    import io, sys
    output = io.StringIO()
    value = None
    try:
        sys_stdout = sys.stdout
        sys.stdout = output
        local_vars = {}
        exec(expr, {}, local_vars)
        sys.stdout = sys_stdout
        if "result" in local_vars:
            value = local_vars["result"]
        else:
            val = output.getvalue()
            value = val.strip() if val else "Code executed. No output."
    except Exception as e:
        sys.stdout = sys_stdout
        value = f"Error: {e}"
    return value

def refresh_all_global_variables():
    variables = load_global_variables()
    updated = False
    for v in variables:
        if v.get("type") == "dynamic" and v.get("expression"):
            value = eval_python_code(v["expression"])
            if not str(value).startswith("Error:"):
                v["value"] = str(value)
                updated = True
    if updated:
        save_global_variables(variables)
    print(f"[{datetime.now()}] Refreshed global variables.")

def run_daily_global_variable_refresh():
    while True:
        now = datetime.now()
        # Next run at 12:01 AM
        next_run = now.replace(hour=0, minute=1, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        sleep_seconds = (next_run - now).total_seconds()
        print(f"[{now}] Sleeping for {int(sleep_seconds)} seconds until next global variable refresh at {next_run}")
        time.sleep(sleep_seconds)
        refresh_all_global_variables()
               
def start_global_variable_refresher():
    t = threading.Thread(target=run_daily_global_variable_refresh, daemon=True)
    t.start()