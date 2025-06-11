import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory, useParams } from "react-router-dom";

const WEEKDAYS = [
  { label: "Mon", value: "Monday" },
  { label: "Tue", value: "Tuesday" },
  { label: "Wed", value: "Wednesday" },
  { label: "Thu", value: "Thursday" },
  { label: "Fri", value: "Friday" },
  { label: "Sat", value: "Saturday" },
  { label: "Sun", value: "Sunday" },
];

const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "America/New_York",
  "Europe/London",
  "Asia/Singapore",
  "Australia/Sydney",
];

function EditScheduler() {
  const { id } = useParams();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    jobId: "",
    weekdays: [],
    time: "",
    timezone: "UTC",
  });
  const [error, setError] = useState("");
  const history = useHistory();

  useEffect(() => {
    axios.get("/jobs").then((res) => setJobs(res.data || []));
    axios.get("/schedules").then((res) => {
      const sch = (res.data || []).find((s) => String(s.id) === String(id));
      if (sch) setForm(sch);
    });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleWeekdayChange = (day) => {
    setForm((prev) => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter((d) => d !== day)
        : [...prev.weekdays, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.jobId ||
      form.weekdays.length === 0 ||
      !form.time ||
      !form.timezone
    ) {
      setError(
        "Please select a job, at least one weekday, a time, and a timezone."
      );
      return;
    }
    await axios.put(`/schedules/${id}`, form);
    history.push("/scheduler");
  };

  return (
    <div>
      <h2>Edit Scheduler</h2>
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
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Days of Week
          <div style={{ marginBottom: 16 }}>
            {WEEKDAYS.map((day) => (
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
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
        {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
        <button type="submit">Save Changes</button>
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

export default EditScheduler;
