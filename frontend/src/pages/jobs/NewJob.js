import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { validateJob } from "../../utils/jobValidation";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function NewJob() {
  const [form, setForm] = useState({
    name: "",
    source: "",
    target: "",
    sourceType: "",
    targetType: "",
    sourceFileMask: "",
    targetFileMask: "",
    sourceAzureId: "",
    targetAzureId: "",
    sourceContainer: "",
    targetContainer: "",
  });
  const [azureSources, setAzureSources] = useState([]);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    axios.get("/datasources?type=azure").then((res) => {
      setAzureSources(res.data || []);
    });
    axios.get("/jobs").then((res) => {
      setJobs(res.data || []);
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const getContainers = (azureId) => {
    const ds = azureSources.find((d) => d.id === azureId);
    return ds && ds.containers ? ds.containers : [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateJob(form);

    // Unique name validation
    if (
      jobs.some(
        (job) =>
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
      await axios.post("/jobs", payload, {
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

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={3}>
          Add New Job
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={5} mb={3}>
            {/* Source Section */}
            <Box flex={1}>
              <Typography variant="h6" mb={2}>
                Source Details
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Job Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                  fullWidth
                />
                <FormControl fullWidth required error={!!errors.sourceType}>
                  <InputLabel>Source Type</InputLabel>
                  <Select
                    name="sourceType"
                    value={form.sourceType}
                    label="Source Type"
                    onChange={handleChange}
                  >
                    <MenuItem value="">Select Source Type</MenuItem>
                    <MenuItem value="azure">Azure Data Lake Storage</MenuItem>
                    <MenuItem value="local">Local Folder</MenuItem>
                    <MenuItem value="shared">Shared Folder</MenuItem>
                  </Select>
                  {errors.sourceType && (
                    <FormHelperText>{errors.sourceType}</FormHelperText>
                  )}
                </FormControl>
                {form.sourceType === "azure" && (
                  <>
                    <FormControl fullWidth required>
                      <InputLabel>Azure Data Lake Source</InputLabel>
                      <Select
                        name="sourceAzureId"
                        value={form.sourceAzureId}
                        label="Azure Data Lake Source"
                        onChange={handleChange}
                      >
                        <MenuItem value="">
                          Select Azure Data Lake Source
                        </MenuItem>
                        {azureSources.map((ds) => (
                          <MenuItem key={ds.id} value={ds.id}>
                            {ds.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {form.sourceAzureId && (
                      <TextField
                        label="Container"
                        name="sourceContainer"
                        value={form.sourceContainer}
                        onChange={handleChange}
                        required={
                          getContainers(form.sourceAzureId).length === 0
                        }
                        placeholder={
                          getContainers(form.sourceAzureId).length > 0
                            ? getContainers(form.sourceAzureId)[0]
                            : "Enter container name"
                        }
                        fullWidth
                        InputProps={{
                          style: { color: "#888" },
                        }}
                      />
                    )}
                  </>
                )}
                <TextField
                  label="Source Folder"
                  name="source"
                  placeholder="Source Folder"
                  value={form.source}
                  onChange={handleChange}
                  required
                  error={!!errors.source}
                  helperText={errors.source}
                  fullWidth
                />
                <TextField
                  label="File Mask"
                  name="sourceFileMask"
                  placeholder="File Mask (e.g. *.csv)"
                  value={form.sourceFileMask}
                  onChange={handleChange}
                  error={!!errors.sourceFileMask}
                  helperText={errors.sourceFileMask}
                  fullWidth
                />
              </Stack>
            </Box>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: "none", md: "block" } }}
            />
            {/* Target Section */}
            <Box flex={1}>
              <Typography variant="h6" mb={2}>
                Target Details
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth required error={!!errors.targetType}>
                  <InputLabel>Target Type</InputLabel>
                  <Select
                    name="targetType"
                    value={form.targetType}
                    label="Target Type"
                    onChange={handleChange}
                  >
                    <MenuItem value="">Select Target Type</MenuItem>
                    <MenuItem value="azure">Azure Data Lake</MenuItem>
                    <MenuItem value="local">Local Folder</MenuItem>
                    <MenuItem value="shared">Shared Folder</MenuItem>
                  </Select>
                  {errors.targetType && (
                    <FormHelperText>{errors.targetType}</FormHelperText>
                  )}
                </FormControl>
                {form.targetType === "azure" && (
                  <>
                    <FormControl fullWidth required>
                      <InputLabel>Azure Data Lake Target</InputLabel>
                      <Select
                        name="targetAzureId"
                        value={form.targetAzureId}
                        label="Azure Data Lake Target"
                        onChange={handleChange}
                      >
                        <MenuItem value="">
                          Select Azure Data Lake Target
                        </MenuItem>
                        {azureSources.map((ds) => (
                          <MenuItem key={ds.id} value={ds.id}>
                            {ds.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {form.targetAzureId && (
                      <TextField
                        label="Container"
                        name="targetContainer"
                        value={form.targetContainer}
                        onChange={handleChange}
                        required={
                          getContainers(form.targetAzureId).length === 0
                        }
                        placeholder={
                          getContainers(form.targetAzureId).length > 0
                            ? getContainers(form.targetAzureId)[0]
                            : "Enter container name"
                        }
                        fullWidth
                        InputProps={{
                          style: { color: "#888" },
                        }}
                      />
                    )}
                  </>
                )}
                <TextField
                  label="Target Folder"
                  name="target"
                  placeholder="Target Folder"
                  value={form.target}
                  onChange={handleChange}
                  required
                  error={!!errors.target}
                  helperText={errors.target}
                  fullWidth
                />
                <TextField
                  label="File Mask"
                  name="targetFileMask"
                  placeholder="File Mask (e.g. *.csv)"
                  value={form.targetFileMask}
                  onChange={handleChange}
                  error={!!errors.targetFileMask}
                  helperText={errors.targetFileMask}
                  fullWidth
                />
              </Stack>
            </Box>
          </Stack>
          {/* Time Travel */}
          <FormGroup sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="time_travel_enabled"
                  checked={!!form.time_travel_enabled}
                  onChange={handleChange}
                />
              }
              label="Enable Time Travel Run"
            />
          </FormGroup>
          {form.time_travel_enabled && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mt={1}>
              <TextField
                label="From"
                type="date"
                name="time_travel_from"
                value={form.time_travel_from || ""}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                sx={{ flex: 1 }}
              />
              <TextField
                label="To"
                type="date"
                name="time_travel_to"
                value={form.time_travel_to || ""}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                sx={{ flex: 1 }}
              />
            </Stack>
          )}
          <Stack direction="row" spacing={2} mt={4}>
            <Button type="submit" variant="contained" color="primary">
              Save Job
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/jobs")}
              variant="outlined"
              color="secondary"
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}

export default NewJob;
