import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom";

function JobRunHistory() {
  const { id } = useParams();
  const history = useHistory();
  const [runHistory, setRunHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [expandedDateRun, setExpandedDateRun] = useState(null);
  const [jobName, setJobName] = useState("");

  const fetchHistory = async () => {
    const res = await axios.get(`/jobs/${id}/run-history`);
    setRunHistory(res.data || []);
  };

  const fetchJobName = async () => {
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
              {/* If this run is expanded */}
              {expanded === idx && (
                <tr>
                  <td colSpan={6}>
                    {/* Only show time travel details if there are multiple date_runs */}
                    {Array.isArray(run.date_runs) &&
                    run.date_runs.length > 1 ? (
                      <div>
                        <b>Time Travel Run Details:</b>
                        <table
                          border="1"
                          cellPadding="6"
                          style={{ marginTop: "10px", width: "100%" }}
                        >
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Message</th>
                              <th>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {run.date_runs.map((dateRun, dIdx) => (
                              <React.Fragment key={dIdx}>
                                <tr>
                                  <td>{dateRun.date}</td>
                                  <td>{dateRun.status}</td>
                                  <td>{dateRun.message}</td>
                                  <td>
                                    <button
                                      onClick={() =>
                                        setExpandedDateRun(
                                          expandedDateRun === `${idx}-${dIdx}`
                                            ? null
                                            : `${idx}-${dIdx}`
                                        )
                                      }
                                    >
                                      {expandedDateRun === `${idx}-${dIdx}`
                                        ? "Hide"
                                        : "Show"}
                                    </button>
                                  </td>
                                </tr>
                                {expandedDateRun === `${idx}-${dIdx}` && (
                                  <tr>
                                    <td colSpan={4}>
                                      <div>
                                        <b>File Mask Used:</b>{" "}
                                        {dateRun.file_mask_used || "-"}
                                        <br />
                                        <br />
                                        <b>Matching Source Files:</b>
                                        <ul>
                                          {dateRun.source_files?.map((f, i) => (
                                            <li key={i}>{f}</li>
                                          ))}
                                        </ul>
                                        <b>Copied Files:</b>
                                        <ul>
                                          {dateRun.copied_files?.map((f, i) => (
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
                    ) : (
                      // For normal runs or single-date runs, show only copied file details
                      <div>
                        <b>File Mask Used:</b>{" "}
                        {run.date_runs && run.date_runs[0]
                          ? run.date_runs[0].file_mask_used || "-"
                          : run.file_mask_used || "-"}
                        <br />
                        <br />
                        <b>Matching Source Files:</b>
                        <ul>
                          {(run.date_runs && run.date_runs[0]
                            ? run.date_runs[0].source_files
                            : run.source_files
                          )?.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                        <b>Copied Files:</b>
                        <ul>
                          {(run.date_runs && run.date_runs[0]
                            ? run.date_runs[0].copied_files
                            : run.copied_files
                          )?.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
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
