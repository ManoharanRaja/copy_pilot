import os
import json
from filelock import FileLock

DATA_SOURCE_FILE = "backend/data/data_sources.json"

def load_data_sources():
    if not os.path.exists(DATA_SOURCE_FILE):
        return []
    with open(DATA_SOURCE_FILE, "r") as f:
        data_sources = json.load(f)
    # Migrate any string configs to dicts
    updated = False
    for ds in data_sources:
        config = ds.get("config")
        if isinstance(config, str):
            try:
                ds["config"] = json.loads(config)
                updated = True
            except Exception:
                pass  # Leave as is if not JSON
    if updated:
        save_data_sources(data_sources)
    return data_sources

def save_data_sources(data_sources):
    with FileLock(DATA_SOURCE_FILE+".lock"):
        with open(DATA_SOURCE_FILE, "w") as f:
            json.dump(data_sources, f, indent=2)
        
        
def load_data_source_by_name(name):
    with open(DATA_SOURCE_FILE, "r") as f:
        sources = json.load(f)
    for src in sources:
        if src["name"] == name:
            return src
    raise ValueError(f"Data source '{name}' not found.")

def load_data_source_by_id(id):
    with open(DATA_SOURCE_FILE, "r") as f:
        sources = json.load(f)
    for src in sources:
        if str(src["id"]) == str(id):
            return src
    raise ValueError(f"Data source with id '{id}' not found.")