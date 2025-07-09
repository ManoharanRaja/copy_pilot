import os

# Configuration settings for the file mover tool

DATA_DIR = os.environ.get("FILE_MOVER_DATA_DIR", "backend/data")

SCHEDULER_INTERVAL = 60  # Interval for the scheduler in seconds
# Security settings
ENCRYPTION_KEY = "kQv3w7l9v8QvK5gkK8kQvK5gkK8kQvK5gkK8kQvK5gk="  # Key for encrypting credentials

MAX_RUN_HISTORY = 500 # Number of entries to keep in main file
