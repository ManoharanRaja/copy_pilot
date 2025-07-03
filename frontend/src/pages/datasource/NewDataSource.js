import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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

function NewDataSource() {
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "Azure Data Lake Storage",
    account_name: "",
    account_key: "",
    container: "",
  });
  const [testStatus, setTestStatus] = useState(null); // null | "success" | "fail"
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState({});
  const [testError, setTestError] = useState("");
  const navigate = useNavigate();

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setForm({ ...form, type });
    setTestStatus(null);
    setErrors({});
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setTestStatus(null); // Reset test status on change
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
    setTestError(""); // Reset error
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
      await axios.post("/datasources", {
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
          Add New Data Source
        </Typography>
        {!selectedType ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Data Source Type
            </Typography>
            <Button
              variant="contained"
              onClick={() => handleTypeSelect("Azure Data Lake Storage")}
            >
              Azure Data Lake Storage
            </Button>
          </Box>
        ) : (
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
                Add
              </Button>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => setSelectedType("")}
              >
                Back
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
        )}
      </Paper>
    </Container>
  );
}

export default NewDataSource;
