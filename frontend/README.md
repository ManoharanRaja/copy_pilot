# Frontend Utility Tool for File Moving and Copying

## Overview

This project is a utility tool designed to facilitate the moving and copying of files across various sources and targets, including on-premises file shares, local folders, and Azure Data Lake. The application features a user-friendly interface built with React, allowing users to configure, schedule, and manage file operations seamlessly.

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd copy-pilot/frontend
   ```

2. Install the dependencies:
   ```
   npm install
   ```

### Running the Application

To start the development server, run:

```
npm start
```

This will launch the application in your default web browser at `http://localhost:3000`.

### Project Structure

- `src/components`: Contains reusable React components for the application.
- `src/pages`: Contains page components for different views in the application.
- `src/App.jsx`: The main component that sets up routing and layout.
- `src/index.js`: The entry point for the React application.

### Features

- User interface for configuring sources and targets.
- Scheduling capabilities for copy/move tasks.
- Monitoring and management of ongoing jobs.

### Future Enhancements

- Support for additional storage providers (e.g., AWS S3, Google Cloud Storage).
- Enhanced logging and monitoring features.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
