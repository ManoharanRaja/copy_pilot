import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory, useParams } from "react-router-dom";

const CUSTOM_OPTIONS = [
  { value: "business_day_month", label: "x Business Day of the month" },
  { value: "day_month", label: "x Day of the month" },
  { value: "business_day_quarter", label: "x Business Day of Quarter y" },
  { value: "day_quarter", label: "x Day of Quarter y" },
  { value: "business_day_halfyear", label: "x Business Day of Half yearly y" },
  { value: "day_halfyear", label: "x Day of Half yearly y" },
  { value: "business_day_annually", label: "x Business Day of annually y" },
  { value: "day_annually", label: "x Day of annually y" },
];

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

const getMaxX = (customType) => {
  switch (customType) {
    case "business_day_month":
      return 23;
    case "day_month":
      return 31;
    case "business_day_quarter":
      return 62;
    case "day_quarter":
      return 92;
    case "business_day_halfyear":
      return 125;
    case "day_halfyear":
      return 184;
    case "business_day_annually":
      return 255;
    case "day_annually":
      return 366;
    default:
      return 31;
  }
};

function EditScheduler() {
  const { id } = useParams();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    jobId: "",
    weekdays: [],
    time: "",
    timezone: "UTC",
  });
  const [isCustom, setIsCustom] = useState(false);
  const [customType, setCustomType] = useState("");
  const [customX, setCustomX] = useState("");
  const [customY, setCustomY] = useState("");
  const [error, setError] = useState("");
  const history = useHistory();

  useEffect(() => {
    axios.get("/jobs").then((res) => setJobs(res.data || []));
    axios.get("/schedules").then((res) => {
      const sch = (res.data || []).find((s) => String(s.id) === String(id));
      if (sch) {
        setForm({
          jobId: sch.jobId || "",
          weekdays: sch.weekdays || [],
          time: sch.time || "",
          timezone: sch.timezone || "UTC",
        });
        if (sch.customScheduler) {
          setIsCustom(true);
          setCustomType(sch.customScheduler.type || "");
          setCustomX(
            sch.customScheduler.x ? String(sch.customScheduler.x) : ""
          );
          setCustomY(
            sch.customScheduler.y ? String(sch.customScheduler.y) : ""
          );
        }
      }
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
    if (!form.jobId || !form.time || !form.timezone) {
      setError("Please select a job, time, and timezone.");
      return;
    }
    if (isCustom) {
      if (
        !customType ||
        !customX ||
        ([
          "business_day_quarter",
          "day_quarter",
          "business_day_halfyear",
          "day_halfyear",
          "business_day_annually",
          "day_annually",
        ].includes(customType) &&
          !customY)
      ) {
        setError("Please fill all custom scheduler fields.");
        return;
      }
      const x = parseInt(customX, 10);
      const y = customY ? parseInt(customY, 10) : null;
      const maxX = getMaxX(customType);

      if (isNaN(x) || x < 1 || x > maxX) {
        setError(`x must be between 1 and ${maxX} for the selected type.`);
        return;
      }
      // y validation for types that require y
      if (
        ["business_day_quarter", "day_quarter"].includes(customType) &&
        (isNaN(y) || y < 1 || y > 4)
      ) {
        setError("Quarter (y) must be between 1 and 4.");
        return;
      }
      if (
        ["business_day_halfyear", "day_halfyear"].includes(customType) &&
        (isNaN(y) || y < 1 || y > 2)
      ) {
        setError("Half yearly (y) must be 1 or 2.");
        return;
      }
      if (
        ["business_day_annually", "day_annually"].includes(customType) &&
        (isNaN(y) || y !== 1)
      ) {
        setError("Annually (y) must be 1.");
        return;
      }
      // Save custom scheduler
      await axios.put(`/schedules/${id}`, {
        ...form,
        weekdays: [],
        customScheduler: {
          type: customType,
          x,
          y: y || null,
        },
      });
      history.push("/scheduler");
      return;
    }
    if (form.weekdays.length === 0) {
      setError("Please select at least one weekday.");
      return;
    }
    // Save normal scheduler
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
          <div
            style={{
              marginBottom: 16,
              opacity: isCustom ? 0.5 : 1,
              pointerEvents: isCustom ? "none" : "auto",
            }}
          >
            {WEEKDAYS.map((day) => (
              <label key={day.value} style={{ marginRight: 10 }}>
                <input
                  type="checkbox"
                  checked={form.weekdays.includes(day.value)}
                  onChange={() => handleWeekdayChange(day.value)}
                  disabled={isCustom}
                />
                {day.label}
              </label>
            ))}
          </div>
        </label>
        <label>
          <input
            type="checkbox"
            checked={isCustom}
            onChange={(e) => {
              setIsCustom(e.target.checked);
              setError("");
            }}
            style={{ marginRight: 10 }}
          />
          Custom Scheduler
        </label>
        {isCustom && (
          <div
            style={{
              border: "1px solid #ccc",
              padding: 12,
              marginBottom: 24,
              marginTop: 16,
            }}
          >
            <label>
              Custom Type
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                style={{ display: "block", marginBottom: 8, width: "100%" }}
                required
              >
                <option value="">Select Type</option>
                {CUSTOM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            <br />
            <label>
              x:&nbsp;
              <input
                type="number"
                min="1"
                max={getMaxX(customType)}
                value={customX}
                onChange={(e) => setCustomX(e.target.value)}
                style={{ width: 60, marginRight: 10 }}
                required
              />
              <span style={{ fontSize: "0.9em", color: "#888" }}>
                &nbsp;(Max: {getMaxX(customType)})
              </span>
            </label>
            {[
              "business_day_quarter",
              "day_quarter",
              "business_day_halfyear",
              "day_halfyear",
              "business_day_annually",
              "day_annually",
            ].includes(customType) && (
              <>
                <label>
                  y:&nbsp;
                  <input
                    type="number"
                    min="1"
                    max={
                      customType.includes("quarter")
                        ? 4
                        : customType.includes("halfyear")
                        ? 2
                        : 1
                    }
                    value={customY}
                    onChange={(e) => setCustomY(e.target.value)}
                    style={{ width: 60 }}
                    required
                  />
                  <span style={{ fontSize: "0.9em", color: "#888" }}>
                    &nbsp;{customType.includes("quarter")
                      ? "(1-4: Q1-Q4)"
                      : customType.includes("halfyear")
                      ? "(1-2: H1-H2)"
                      : "(1: Annually)"}
                  </span>
                </label>
                <br />
              </>
            )}
          </div>
        )}
        <br />
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