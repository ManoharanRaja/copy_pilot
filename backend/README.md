# File: backend/README.md

# File Mover Tool - Backend Documentation

## Overview

The File Mover Tool is a utility application designed to facilitate the movement and copying of files across various storage solutions, including local folders, on-premises file shares, and cloud storage like Azure Data Lake. This backend component is built using FastAPI and provides the necessary APIs to support the frontend interface.

## Features

- Move and copy files between different sources and targets.
- Support for local storage, SMB shares, and Azure Data Lake.
- Configuration management for file operations.
- Task scheduling for automated file operations.
- Logging and monitoring of job statuses.

## Setup Instructions

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd copy-pilot/backend
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

### Running the Application

To start the FastAPI application, run:

```
uvicorn main:app --reload
```

The application will be accessible at `http://127.0.0.1:8000`.

### API Endpoints

- **GET /api/jobs**: Retrieve the list of scheduled jobs.
- **POST /api/jobs**: Create a new copy/move job.
- **GET /api/jobs/{job_id}**: Get the status of a specific job.
- **DELETE /api/jobs/{job_id}**: Cancel a scheduled job.

## Directory Structure

- `main.py`: Entry point of the FastAPI application.
- `jobs/scheduler.py`: Contains the scheduling logic for tasks.
- `storage/`: Adapters for different storage solutions.
- `models/`: Data models used in the application.
- `config/`: Configuration settings for the application.
- `utils/`: Utility functions, including encryption for credentials.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
