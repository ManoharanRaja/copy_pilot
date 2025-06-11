import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

function Scheduler() {
  const [jobs, setJobs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const history = useHistory();

  useEffect(() => {
    axios.get("/jobs").then((res) => setJobs(res.data || []));
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    const res = await axios.get("/schedules");
    setSchedules(res.data || []);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/schedules/${id}`);
    fetchSchedules();
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Scheduler</h2>
        <button
          onClick={() => history.push("/scheduler/new")}
          style={{ marginLeft: "auto" }}
        >
          Add New Scheduler
        </button>
      </div>
      <table border="1" cellPadding="8" style={{ width: "100%" }}>
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Job Name</th>
            <th>Schedule</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {schedules.length === 0 && (
            <tr>
              <td colSpan={4}>No schedules yet.</td>
            </tr>
          )}
          {schedules.map((sch) => {
            const job = jobs.find((j) => String(j.id) === String(sch.jobId));
            return (
              <tr key={sch.id}>
                <td>{sch.jobId}</td>
                <td>{job ? job.name : <i>Job not found</i>}</td>
                <td>
                  {sch.weekdays && sch.weekdays.length > 0
                    ? sch.weekdays.join(", ")
                    : "—"}
                  <br />
                  <b>Time:</b> {sch.time || "—"}
                  <br />
                  <b>Timezone:</b> {sch.timezone || "—"}
                </td>
                <td>
                  <button onClick={() => handleDelete(sch.id)}>Delete</button>
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => history.push(`/scheduler/edit/${sch.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => history.push(`/jobs/${sch.jobId}/history`)}
                  >
                    View Run History
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Scheduler;
