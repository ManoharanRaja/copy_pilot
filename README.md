# File Mover Tool

## Overview

The File Mover Tool is a utility application designed to facilitate the movement and copying of files across various sources and targets. It features a user-friendly interface and supports multiple storage options, including local folders, on-premises file shares, and cloud storage solutions like Azure Data Lake.

## Features

- **File Operations**: Move and copy files between various sources and targets.
- **Supported Locations**: On-prem file shares, local folders, Azure Data Lake, and more.
- **User Interface**: Intuitive UI for configuring sources, targets, and scheduled tasks.
- **Configuration Management**: Add, view, edit, and remove copy/move configurations with options to save locally or in a database.
- **Scheduling**: Schedule tasks for one-time or recurring execution, with manual run support.
- **Extensibility**: Future support for additional storage providers (e.g., AWS S3, Google Cloud Storage).
- **Logging & Monitoring**: Track job history, status (success/failure), and error logs.

## Project Structure

```
copy-pilot/
├── backend/
│   ├── main.py
│   ├── jobs/
│   │   └── scheduler.py
│   ├── storage/
│   │   ├── local_adapter.py
│   │   ├── smb_adapter.py
│   │   └── adls_adapter.py
│   ├── models/
│   │   └── __init__.py
│   ├── config/
│   │   └── settings.py
│   ├── utils/
│   │   └── encryption.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── README.md
├── configs/
│   ├── sample_config.yaml
│   └── sample_config.json
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.7 or higher
- Node.js and npm

### Backend Setup

1. Navigate to the `backend` directory.
2. Install the required Python packages:
   ```
   pip install -r requirements.txt
   ```
3. Run the FastAPI application:
   ```
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the `frontend` directory.
2. Install the required npm packages:
   ```
   npm install
   ```
3. Start the React application:
   ```
   npm start
   ```

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
