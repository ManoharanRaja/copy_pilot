import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
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

function EditDataSource() {
  const { id } = useParams();
  const [form, setForm] = useState({
    name: "",
    type: "Azure Data Lake Storage",
    account_name: "",
    account_key: "",
    container: "",
  });
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState({});
  const [testError, setTestError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/datasources`).then((res) => {
      const ds = (res.data || []).find((d) => String(d.id) === String(id));
      if (ds) {
        setForm({
          name: ds.name,
          type: ds.type,
          account_name: ds.config.account_name || "",
          account_key: ds.config.account_key || "",
          container: ds.config.container || "",
        });
      }
    });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setTestStatus(null);
    setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.account_name) errs.account_name = "Account Name is required";
    if (!form.account_key) errs.account_key = "Account Key is required";
    return errs;
  };

  const handleTest = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setTesting(true);
    setTestStatus(null);
    setTestError("");
    try {
      const config = {
        account_name: form.account_name,
        account_key: form.account_key,
        container: form.container,
      };
      const res = await axios.post("/datasources/test", {
        type: form.type,
        config,
      });
      if (res.data && res.data.success) {
        setTestStatus("success");
        setTestError("");
      } else {
        setTestStatus("fail");
        setTestError(
          res.data && res.data.message
            ? res.data.message
            : "Connection failed. Please check your details."
        );
      }
    } catch (err) {
      setTestStatus("fail");
      setTestError(
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Connection failed. Please check your details."
      );
    }
    setTesting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    try {
      await axios.put(`/datasources/${id}`, {
        name: form.name,
        type: form.type,
        config: {
          account_name: form.account_name,
          account_key: form.account_key,
          container: form.container,
        },
      });
      navigate("/datasource");
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.detail === "Data source name already exists."
      ) {
        setErrors({ ...errs, name: "Data source name already exists." });
      } else {
        alert("An error occurred. Please try again.");
      }
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Edit Data Source
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            mt: 2,
          }}
        >
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            label="Account Name"
            name="account_name"
            value={form.account_name}
            onChange={handleChange}
            required
            error={!!errors.account_name}
            helperText={
              errors.account_name ||
              `https://${
                form.account_name || "{account_name}"
              }.dfs.core.windows.net/`
            }
          />
          <TextField
            label="Account Key"
            name="account_key"
            type="password"
            value={form.account_key}
            onChange={handleChange}
            required
            error={!!errors.account_key}
            helperText={errors.account_key}
          />
          <TextField
            label="Container (Optional)"
            name="container"
            value={form.container}
            onChange={handleChange}
          />
          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={handleTest}
              disabled={testing}
            >
              {testing ? (
                <>
                  <CircularProgress size={18} sx={{ mr: 1 }} />
                  Testing...
                </>
              ) : (
                "Test"
              )}
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={testStatus !== "success"}
            >
              Save
            </Button>
            <Button
              type="button"
              variant="outlined"
              color="secondary"
              onClick={() => navigate("/datasource")}
            >
              Cancel
            </Button>
          </Stack>
          {testStatus === "success" && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Connection successful!
            </Alert>
          )}
          {testStatus === "fail" && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {testError}
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default EditDataSource;
