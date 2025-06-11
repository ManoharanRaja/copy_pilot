import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

const WEEKDAYS = [
  { label: "Mon", value: "Monday" },
  { label: "Tue", value: "Tuesday" },
  { label: "Wed", value: "Wednesday" },
  { label: "Thu", value: "Thursday" },
  { label: "Fri", value: "Friday" },
  { label: "Sat", value: "Saturday" },
  { label: "Sun", value: "Sunday" },
];

// You can use a static list or a library for timezones
const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "Europe/London",
  "Asia/Singapore",
  "Australia/Sydney",
  // ...add more as needed
];

function NewScheduler() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    jobId: "",
    weekdays: [],
    time: "09:00",
    timezone: "UTC",
  });
  const [error, setError] = useState("");
  const history = useHistory();

  useEffect(() => {
    axios.get("/jobs").then(res => setJobs(res.data || []));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleWeekdayChange = (day) => {
    setForm((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day],
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.jobId || form.weekdays.length === 0 || !form.time || !form.timezone) {
      setError("Please select a job, at least one weekday, a time, and a timezone.");
      return;
    }
    // Save as a readable string or as separate fields as per your backend
    await axios.post("/schedules", form);
    history.push("/scheduler");
  };

  return (
    <div>
      <h2>Add New Scheduler</h2>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }}>
        <label>
          Job
          <select
            name="jobId"
            value={form.jobId}
            onChange={handleChange}
            required
            style={{ display: "block", marginBottom: 16, width: "100%" }}
          >
            <option value="">Select Job</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Days of Week
          <div style={{ marginBottom: 16 }}>
            {WEEKDAYS.map(day => (
              <label key={day.value} style={{ marginRight: 10 }}>
                <input
                  type="checkbox"
                  checked={form.weekdays.includes(day.value)}
                  onChange={() => handleWeekdayChange(day.value)}
                />
                {day.label}
              </label>
            ))}
          </div>
        </label>
        <label>
          Time
          <input
            type="time"
            name="time"
            value={form.time}
            onChange={handleChange}
            required
            style={{ display: "block", marginBottom: 16, width: "100%" }}
          />
        </label>
        <label>
          Timezone
          <select
            name="timezone"
            value={form.timezone}
            onChange={handleChange}
            required
            style={{ display: "block", marginBottom: 16, width: "100%" }}
          >
            {TIMEZONES.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </label>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <button type="submit">Save Scheduler</button>
        <button
          type="button"
          onClick={() => history.push("/scheduler")}
          style={{ marginLeft: 10 }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default NewScheduler;