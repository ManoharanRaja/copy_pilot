import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { validateJob } from "../../utils/jobValidation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";

function CloneJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/jobs").then((res) => {
      setJobs(res.data || []);
      const job = (res.data || []).find((j) => String(j.id) === String(id));
      if (job) {
        // Remove id and set name to "Copy of ..."
        const { id, name, ...rest } = job;
        setForm({
          ...rest,
          name: `Copy of ${name}`,
        });
      }
      setLoading(false);
    });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
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

    try {
      await axios.post("/jobs", form);
      navigate("/jobs");
    } catch (error) {
      const detail =
        error.response?.data?.detail ||
        (typeof error.response?.data === "string"
          ? error.response.data
          : error.message);
      alert("Failed to clone job: " + detail);
    }
  };

  if (loading || !form)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img
            src="/clonejobs.png"
            alt="Clone Jobs"
            style={{ width: 80, height: 80, marginRight: 12 }} // doubled from 40 to 80
          />
          <Typography variant="h5" gutterBottom>
            Clone Job
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
        >
          <TextField
            label="Job Name"
            name="name"
            placeholder="Job Name"
            value={form.name}
            onChange={handleChange}
            required
            error={!!errors.name}
            helperText={errors.name}
          />
          {/* Add other job fields here as in NewJob.js, e.g. source, target, etc. */}
          {/* Example: */}
          {/* <TextField
            label="Source"
            name="source"
            value={form.source}
            onChange={handleChange}
            required
          /> */}
          {/* ...repeat for other fields... */}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" color="primary">
              Save Cloned Job
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
      </Paper>
    </Container>
  );
}

export default CloneJob;
