# Configuration settings for the file mover tool

DATABASE_URL = "sqlite:///./database.db"  # Example database URL
API_KEY = "your_api_key_here"  # Placeholder for API key
LOG_LEVEL = "INFO"  # Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
SCHEDULER_INTERVAL = 60  # Interval for the scheduler in seconds

# Storage configurations
STORAGE_CONFIG = {
    "local": {
        "base_path": "/path/to/local/storage"
    },
    "smb": {
        "server": "smb://your_smb_server",
        "username": "your_username",
        "password": "your_password"
    },
    "adls": {
        "account_name": "your_account_name",
        "account_key": "your_account_key",
        "container_name": "your_container_name"
    }
}

# Security settings
ENCRYPTION_KEY = "your_encryption_key_here"  # Key for encrypting credentials
