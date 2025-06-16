import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const history = useHistory();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const res = await axios.get("/jobs");
    setJobs(res.data);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/jobs/${id}`);
    fetchJobs();
  };

  const handleRun = async (id) => {
    try {
      await axios.post(`/jobs/${id}/run`, { trigger_type: "manual" });
    } catch (err) {
      // Do nothing: errors will be shown in run history
    } finally {
      history.push(`/jobs/${id}/run-history`);
    }
  };

  // Helper to render details vertically in a cell
  const renderSourceDetails = (job) => (
    <div>
      <strong>Type:</strong> {job.sourceType}
      <br />
      {job.sourceContainer && (
        <>
          <strong>Container:</strong> {job.sourceContainer}
          <br />
        </>
      )}
      <strong>Folder:</strong> {job.source}
      <br />
      {job.sourceFileMask && (
        <>
          <strong>File Mask:</strong> {job.sourceFileMask}
          <br />
        </>
      )}
    </div>
  );

  const renderTargetDetails = (job) => (
    <div>
      <strong>Type:</strong> {job.targetType}
      <br />
      {job.targetContainer && (
        <>
          <strong>Container:</strong> {job.targetContainer}
          <br />
        </>
      )}
      <strong>Folder:</strong> {job.target}
      <br />
      {job.targetFileMask && (
        <>
          <strong>File Mask:</strong> {job.targetFileMask}
          <br />
        </>
      )}
    </div>
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Copy Jobs</h2>
        <button
          onClick={() => history.push("/jobs/new")}
          style={{ marginLeft: "auto" }}
        >
          Add New Job
        </button>
      </div>
      <table
        border="1"
        cellPadding="8"
        cellSpacing="0"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Job Name</th>
            <th>Source</th>
            <th>Target</th>
            <th>Time Travel Run</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.name}</td>
              <td>{renderSourceDetails(job)}</td>
              <td>{renderTargetDetails(job)}</td>
              <td>
                {job.time_travel && job.time_travel.enabled ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>Enabled</div>
                    <div>
                      <span style={{ display: "block" }}>
                        From: {job.time_travel.from_date || "-"}
                      </span>
                      <span style={{ display: "block" }}>
                        To: {job.time_travel.to_date || "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span>Disabled</span>
                )}
              </td>
              <td>
                {/* First row: Edit, Delete, Run */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                    width: "100%",
                    gap: 0,
                  }}
                >
                  <button
                    style={{ flex: 1, margin: "0 4px" }}
                    onClick={() => history.push(`/jobs/${job.id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ flex: 1, margin: "0 4px" }}
                    onClick={() => handleDelete(job.id)}
                  >
                    Delete
                  </button>
                  <button
                    style={{ flex: 1, margin: "0 4px" }}
                    onClick={() => handleRun(job.id)}
                  >
                    Run
                  </button>
                </div>
                {/* Second row: View run history, Define Job Variables */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    gap: 0,
                  }}
                >
                  <button
                    style={{ flex: 1, margin: "0 4px" }}
                    onClick={() => history.push(`/jobs/${job.id}/run-history`)}
                  >
                    View run history
                  </button>
                  <button
                    style={{ flex: 1, margin: "0 4px" }}
                    onClick={() =>
                      history.push(`/jobs/${job.id}/local-variables`)
                    }
                  >
                    Define Job Variables
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Jobs;
