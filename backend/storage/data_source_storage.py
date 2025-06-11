import os
import json

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
    with open(DATA_SOURCE_FILE, "w") as f:
        json.dump(data_sources, f, indent=2)