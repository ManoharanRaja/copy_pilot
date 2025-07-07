import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Stack,
  Alert,
  Box,
} from "@mui/material";

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

function NewScheduler() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    name: "",
    jobId: "",
    weekdays: [],
    time: "09:00",
    timezone: "UTC",
  });
  const [isCustom, setIsCustom] = useState(false);
  const [customType, setCustomType] = useState("");
  const [customX, setCustomX] = useState("");
  const [customY, setCustomY] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/jobs").then((res) => setJobs(res.data || []));
  }, []);

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
    if (!form.name) {
      setError("Please enter a scheduler name.");
      return;
    }
    if (!form.jobId || !form.time || !form.timezone) {
      setError("Please select a job, time, and timezone.");
      return;
    }
    try {
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
        await axios.post("/schedules", {
          ...form,
          weekdays: [],
          customScheduler: {
            type: customType,
            x,
            y: y || null,
          },
        });
        navigate("/scheduler");
        return;
      }
      if (form.weekdays.length === 0) {
        setError("Please select at least one weekday.");
        return;
      }
      await axios.post("/schedules", form);
      navigate("/scheduler");
    } catch (err) {
      if (
        err.response &&
        err.response.status === 400 &&
        err.response.data.detail
      ) {
        setError(err.response.data.detail);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>
          Add New Scheduler
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Scheduler Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              inputProps={{ maxLength: 100 }}
              error={!!(error && error.toLowerCase().includes("name"))}
              helperText={
                error && error.toLowerCase().includes("name") ? error : ""
              }
            />
            <FormControl fullWidth required>
              <InputLabel>Job</InputLabel>
              <Select
                name="jobId"
                value={form.jobId}
                label="Job"
                onChange={handleChange}
              >
                <MenuItem value="">Select Job</MenuItem>
                {jobs.map((job) => (
                  <MenuItem key={job.id} value={job.id}>
                    {job.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl component="fieldset" disabled={isCustom}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Days of Week
              </Typography>
              <FormGroup row>
                {WEEKDAYS.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={form.weekdays.includes(day.value)}
                        onChange={() => handleWeekdayChange(day.value)}
                        disabled={isCustom}
                      />
                    }
                    label={day.label}
                  />
                ))}
              </FormGroup>
            </FormControl>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isCustom}
                  onChange={(e) => {
                    setIsCustom(e.target.checked);
                    setError("");
                  }}
                />
              }
              label="Custom Scheduler"
            />
            {isCustom && (
              <Box
                sx={{ border: "1px solid #ccc", borderRadius: 2, p: 2, mb: 2 }}
              >
                <FormControl fullWidth required sx={{ mb: 2 }}>
                  <InputLabel>Custom Type</InputLabel>
                  <Select
                    value={customType}
                    label="Custom Type"
                    onChange={(e) => setCustomType(e.target.value)}
                  >
                    <MenuItem value="">Select Type</MenuItem>
                    {CUSTOM_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="x"
                    type="number"
                    inputProps={{
                      min: 1,
                      max: getMaxX(customType),
                    }}
                    value={customX}
                    onChange={(e) => setCustomX(e.target.value)}
                    required
                    sx={{ width: 100 }}
                    helperText={`Max: ${getMaxX(customType)}`}
                  />
                  {[
                    "business_day_quarter",
                    "day_quarter",
                    "business_day_halfyear",
                    "day_halfyear",
                    "business_day_annually",
                    "day_annually",
                  ].includes(customType) && (
                    <TextField
                      label="y"
                      type="number"
                      inputProps={{
                        min: 1,
                        max: customType.includes("quarter")
                          ? 4
                          : customType.includes("halfyear")
                          ? 2
                          : 1,
                      }}
                      value={customY}
                      onChange={(e) => setCustomY(e.target.value)}
                      required
                      sx={{ width: 100 }}
                      helperText={
                        customType.includes("quarter")
                          ? "1-4: Q1-Q4"
                          : customType.includes("halfyear")
                          ? "1-2: H1-H2"
                          : "1: Annually"
                      }
                    />
                  )}
                </Stack>
              </Box>
            )}
            <TextField
              label="Time"
              name="time"
              type="time"
              value={form.time}
              onChange={handleChange}
              required
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth required>
              <InputLabel>Timezone</InputLabel>
              <Select
                name="timezone"
                value={form.timezone}
                label="Timezone"
                onChange={handleChange}
              >
                {TIMEZONES.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {error && !error.toLowerCase().includes("name") && (
              <Alert severity="error">{error}</Alert>
            )}
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" color="primary">
                Save Scheduler
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => navigate("/scheduler")}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

export default NewScheduler;
