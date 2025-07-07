import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { validateJob } from "../../utils/jobValidation";
import {
  Typography,
  TextField,
  Button,
  Box,
  Stack,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  MenuItem,
} from "@mui/material";

function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [azureSources, setAzureSources] = useState([]);
  const [errors, setErrors] = useState({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [azureRes, jobsRes] = await Promise.all([
          axios.get("/datasources?type=azure"),
          axios.get("/jobs"),
        ]);
        if (!isMounted) return;
        setAzureSources(azureRes.data || []);
        setJobs(jobsRes.data || []);
        const job = (jobsRes.data || []).find(
          (j) => String(j.id) === String(id)
        );
        if (job) {
          setForm({
            ...job,
            time_travel_enabled: job?.time_travel?.enabled || false,
            time_travel_from: job?.time_travel?.from_date || "",
            time_travel_to: job?.time_travel?.to_date || "",
          });
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const getContainers = (azureId) => {
    const ds = azureSources.find((d) => d.id === azureId);
    return ds && ds.containers ? ds.containers : [];
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTimeTravelCheckbox = (e) => {
    setForm((prev) => ({
      ...prev,
      time_travel_enabled: e.target.checked,
      ...(e.target.checked ? {} : { time_travel_from: "", time_travel_to: "" }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;

    const validationErrors = validateJob(form);

    // Unique name validation (exclude current job)
    if (
      jobs.some(
        (job) =>
          job.id !== form.id &&
          job.name.trim().toLowerCase() === form.name.trim().toLowerCase()
      )
    ) {
      validationErrors.name = "A job with this name already exists.";
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    // Build the payload with time_travel object
    const payload = {
      ...form,
      time_travel: {
        enabled: !!form.time_travel_enabled,
        from_date: form.time_travel_from || null,
        to_date: form.time_travel_to || null,
      },
    };
    // Remove UI-only fields
    delete payload.time_travel_enabled;
    delete payload.time_travel_from;
    delete payload.time_travel_to;

    // Get machine name from localStorage
    let machineName = localStorage.getItem("machineName");
    if (!machineName) {
      machineName = prompt("Please enter your user name:") || "unknown";
      localStorage.setItem("machineName", machineName);
    }

    try {
      await axios.put(`/jobs/${id}`, payload, {
        headers: {
          "X-Machine-Name": machineName,
        },
      });
      navigate("/jobs");
    } catch (error) {
      const detail =
        error.response?.data?.detail ||
        (typeof error.response?.data === "string"
          ? error.response.data
          : error.message);
      alert("Failed to save job: " + detail);
    }
  };

  if (loading || !form)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        bgcolor: "transparent",
        px: { xs: 2, md: 6 },
        py: 4,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
        Edit Job
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 4,
            width: "100%",
          }}
        >
          {/* Source Section */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              borderRight: { md: "1px solid #ccc", xs: "none" },
              pr: { md: 3, xs: 0 },
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Source Details
            </Typography>
            <TextField
              label="Job Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              error={!!errors.name}
              helperText={errors.name}
            />
            <TextField
              select
              label="Source Type"
              name="sourceType"
              value={form.sourceType}
              onChange={handleChange}
              required
            >
              <MenuItem value="">Select Source Type</MenuItem>
              <MenuItem value="azure">Azure Data Lake Storage</MenuItem>
              <MenuItem value="local">Local Folder</MenuItem>
              <MenuItem value="shared">Shared Folder</MenuItem>
            </TextField>
            {form.sourceType === "azure" && (
              <>
                <TextField
                  select
                  label="Azure Data Lake Source"
                  name="sourceAzureId"
                  value={form.sourceAzureId}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">Select Azure Data Lake Source</MenuItem>
                  {azureSources.map((ds) => (
                    <MenuItem key={ds.id} value={ds.id}>
                      {ds.name}
                    </MenuItem>
                  ))}
                </TextField>
                {form.sourceAzureId && (
                  <TextField
                    label="Container"
                    name="sourceContainer"
                    value={form.sourceContainer}
                    onChange={handleChange}
                    required={getContainers(form.sourceAzureId).length === 0}
                    placeholder={
                      getContainers(form.sourceAzureId).length > 0
                        ? getContainers(form.sourceAzureId)[0]
                        : "Enter container name"
                    }
                  />
                )}
              </>
            )}
            <TextField
              label="Source Folder"
              name="source"
              value={form.source}
              onChange={handleChange}
              required
              error={!!errors.source}
              helperText={errors.source}
              sx={{ width: { xs: "100%", md: "400px" } }}
            />
            <TextField
              label="File Mask"
              name="sourceFileMask"
              value={form.sourceFileMask}
              onChange={handleChange}
              error={!!errors.sourceFileMask}
              helperText={errors.sourceFileMask}
              sx={{ width: { xs: "100%", md: "400px" } }}
            />
          </Box>
          {/* Target Section */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              pl: { md: 3, xs: 0 },
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Target Details
            </Typography>
            <TextField
              select
              label="Target Type"
              name="targetType"
              value={form.targetType}
              onChange={handleChange}
              required
            >
              <MenuItem value="">Select Target Type</MenuItem>
              <MenuItem value="azure">Azure Data Lake</MenuItem>
              <MenuItem value="local">Local Folder</MenuItem>
              <MenuItem value="shared">Shared Folder</MenuItem>
            </TextField>
            {form.targetType === "azure" && (
              <>
                <TextField
                  select
                  label="Azure Data Lake Target"
                  name="targetAzureId"
                  value={form.targetAzureId}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="">Select Azure Data Lake Target</MenuItem>
                  {azureSources.map((ds) => (
                    <MenuItem key={ds.id} value={ds.id}>
                      {ds.name}
                    </MenuItem>
                  ))}
                </TextField>
                {form.targetAzureId && (
                  <TextField
                    label="Container"
                    name="targetContainer"
                    value={form.targetContainer}
                    onChange={handleChange}
                    required={getContainers(form.targetAzureId).length === 0}
                    placeholder={
                      getContainers(form.targetAzureId).length > 0
                        ? getContainers(form.targetAzureId)[0]
                        : "Enter container name"
                    }
                  />
                )}
              </>
            )}
            <TextField
              label="Target Folder"
              name="target"
              value={form.target}
              onChange={handleChange}
              required
              error={!!errors.target}
              helperText={errors.target}
              sx={{ width: { xs: "100%", md: "400px" } }}
            />
            <TextField
              label="File Mask"
              name="targetFileMask"
              value={form.targetFileMask}
              onChange={handleChange}
              error={!!errors.targetFileMask}
              helperText={errors.targetFileMask}
              sx={{ width: { xs: "100%", md: "400px" } }}
            />
          </Box>
        </Box>
        {/* Time Travel Section */}
        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={!!form.time_travel_enabled}
                onChange={handleTimeTravelCheckbox}
                name="time_travel_enabled"
              />
            }
            label="Enable Time Travel Run"
          />
          {form.time_travel_enabled && (
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="From"
                type="date"
                name="time_travel_from"
                value={form.time_travel_from || ""}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="To"
                type="date"
                name="time_travel_to"
                value={form.time_travel_to || ""}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Stack>
          )}
        </Box>
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button type="submit" variant="contained" color="primary">
            Save
          </Button>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/jobs")}
          >
            Cancel
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

export default EditJob;
