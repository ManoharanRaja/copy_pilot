import io
import sys

def safe_exec(code):
    allowed_globals = {
        "__builtins__": {},
        "datetime": __import__("datetime").datetime,
        "date": __import__("datetime").date,
    }
    output = io.StringIO()
    try:
        # Redirect stdout to capture print statements
        sys_stdout = sys.stdout
        sys.stdout = output
        local_vars = {}
        exec(code, allowed_globals, local_vars)
        sys.stdout = sys_stdout
        # If user sets a variable named 'result', return it, else return printed output
        if "result" in local_vars:
            return local_vars["result"]
        val = output.getvalue()
        return val if val else "Code executed. No output."
    except Exception as e:
        sys.stdout = sys_stdout
        return f"Error: {e}"
    
    
def unsafe_exec(code):
    output = io.StringIO()
    try:
        sys_stdout = sys.stdout
        sys.stdout = output
        local_vars = {}
        exec(code, {}, local_vars)  # No restrictions
        sys.stdout = sys_stdout
        if "result" in local_vars:
            return local_vars["result"]
        val = output.getvalue()
        # Strip ALL leading/trailing whitespace including newlines
        return val.rstrip() if val else "Code executed. No output."
    except Exception as e:
        sys.stdout = sys_stdout
        return f"Error: {e}"