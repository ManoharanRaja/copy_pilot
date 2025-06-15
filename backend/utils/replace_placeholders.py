import re

def resolve_placeholders(path: str, global_vars: dict, local_vars: dict) -> str:
    def replacer(match):
        prefix = match.group(1)
        var_name = match.group(2)
        if prefix == "$":
            if var_name not in global_vars:
                raise ValueError(f"Global variable '{var_name}' not found for placeholder [${var_name}]")
            return str(global_vars[var_name])
        elif prefix == "#":
            if var_name not in local_vars:
                raise ValueError(f"Local variable '{var_name}' not found for placeholder [#{var_name}]")
            return str(local_vars[var_name])
        else:
            return match.group(0)
    # Matches [$Var] or [#Var]
    return re.sub(r"\[(\$|#)(\w+)\]", replacer, path)

def find_missing_placeholders(path: str, global_vars: dict, local_vars: dict):
    errors = []
    for match in re.finditer(r"\[(\$|#)(\w+)\]", path):
        prefix, var_name = match.group(1), match.group(2)
        if prefix == "$" and var_name not in global_vars:
            errors.append(f"Global variable '{var_name}' not found for placeholder [${var_name}]")
        elif prefix == "#" and var_name not in local_vars:
            errors.append(f"Local variable '{var_name}' not found for placeholder [#{var_name}]")
    return errors