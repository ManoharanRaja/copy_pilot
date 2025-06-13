import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom";

function JobRunHistory() {
  const { id } = useParams();
  const history = useHistory();
  const [runHistory, setRunHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [jobName, setJobName] = useState("");

  const fetchHistory = async () => {
    const res = await axios.get(`/jobs/${id}/run-history`);
    setRunHistory(res.data || []);
  };

  const fetchJobName = async () => {
    // Fetch all jobs and find the one with the matching ID
    const res = await axios.get("/jobs");
    const job = res.data.find((j) => String(j.id) === String(id));
    setJobName(job ? job.name : id);
  };

  useEffect(() => {
    fetchHistory();
    fetchJobName();
    // eslint-disable-next-line
  }, [id]);

  return (
    <div>
      <h2>Run History for Job: {jobName}</h2>
      <button onClick={() => history.push("/jobs")}>Back to Jobs</button>
      <table
        border="1"
        cellPadding="8"
        style={{ marginTop: "20px", width: "100%" }}
      >
        <thead>
          <tr>
            <th>RunId</th>
            <th>Timestamp</th>
            <th>Status</th>
            <th>Message</th>
            <th>Trigger Type</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {runHistory.length === 0 && (
            <tr>
              <td colSpan={6}>No run history yet.</td>
            </tr>
          )}
          {[...runHistory].reverse().map((run, idx) => (
            <React.Fragment key={idx}>
              <tr>
                <td>{idx + 1}</td>
                <td>{run.timestamp}</td>
                <td>{run.status}</td>
                <td>{run.message}</td>
                <td>
                  {run.trigger_type === "scheduled" ? (
                    run.scheduler_id ? (
                      <>
                        Scheduled Run - Scheduler ID: <b>{run.scheduler_id}</b>
                      </>
                    ) : (
                      "Scheduled Run"
                    )
                  ) : (
                    "Manual Trigger"
                  )}
                </td>
                <td>
                  <button
                    onClick={() => setExpanded(expanded === idx ? null : idx)}
                  >
                    {expanded === idx ? "Hide" : "Show"}
                  </button>
                </td>
              </tr>
              {expanded === idx && (
                <tr>
                  <td colSpan={6}>
                    <div>
                      <b>File Mask Used:</b> {run.file_mask_used || "-"}
                      <br />
                      <br />
                      <b>Matching Source Files:</b>
                      <ul>
                        {run.source_files?.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                      <b>Copied Files:</b>
                      <ul>
                        {run.copied_files?.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default JobRunHistory;
