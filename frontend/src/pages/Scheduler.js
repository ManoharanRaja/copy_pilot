import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

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
      <th>Scheduler ID</th>
      <th>Job ID</th>
      <th>Job Name</th>
      <th>Schedule</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {schedules.length === 0 && (
      <tr>
        <td colSpan={5}>No schedules yet.</td>
      </tr>
    )}
    {schedules.map((sch) => {
      const job = jobs.find((j) => String(j.id) === String(sch.jobId));
      return (
        <tr key={sch.id}>
          <td>{sch.id}</td>
          <td>{sch.jobId}</td>
          <td>{job ? job.name : <i>Job not found</i>}</td>
          <td>
            {sch.customScheduler ? (
              <>
                <b>
                  {(() => {
                    const { type, x, y } = sch.customScheduler;
                    const ordX = ordinal(x);
                    switch (type) {
                      case "business_day_month":
                        return `${ordX} Business Day of the month`;
                      case "day_month":
                        return `${ordX} Day of the month`;
                      case "business_day_quarter":
                        return `${ordX} Business Day of Quarter ${y}`;
                      case "day_quarter":
                        return `${ordX} Day of Quarter ${y}`;
                      case "business_day_halfyear":
                        return `${ordX} Business Day of Half yearly ${y}`;
                      case "day_halfyear":
                        return `${ordX} Day of Half yearly ${y}`;
                      case "business_day_annually":
                        return `${ordX} Business Day of annually ${y}`;
                      case "day_annually":
                        return `${ordX} Day of annually ${y}`;
                      default:
                        return "-";
                    }
                  })()}
                </b>
                <br />
              </>
            ) : sch.weekdays && sch.weekdays.length > 0 ? (
              sch.weekdays.join(", ")
            ) : (
              "—"
            )}
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
              onClick={() => history.push(`/jobs/${sch.jobId}/run-history`)}
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
