import json
import os

FILE = "backend/data/global_variables.json"

def load_global_variables():
    if not os.path.exists(FILE):
        return []
    with open(FILE, "r") as f:
        return json.load(f)

def save_global_variables(vars):
    with open(FILE, "w") as f:
        json.dump(vars, f, indent=2)