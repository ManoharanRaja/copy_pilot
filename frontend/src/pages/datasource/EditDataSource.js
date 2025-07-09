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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  FormControl,
} from "@mui/material";

function EditDataSource() {
  const { id } = useParams();
  const [form, setForm] = useState({
    name: "",
    type: "Azure Data Lake Storage",
    account_name: "",
    account_key: "",
    sas_token: "",
    container: "",
  });
  const [credentialType, setCredentialType] = useState("account_key");
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
          sas_token: ds.config.sas_token || "",
          container: ds.config.container || "",
        });
        // Set credential type based on which credential is present
        if (ds.config.sas_token && ds.config.sas_token !== "") {
          setCredentialType("sas_token");
        } else {
          setCredentialType("account_key");
        }
      }
    });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setTestStatus(null);
    setErrors({});
  };

  const handleCredentialTypeChange = (e) => {
    const value = e.target.value;
    setCredentialType(value);
    setForm({
      ...form,
      account_key: value === "account_key" ? form.account_key : "",
      sas_token: value === "sas_token" ? form.sas_token : "",
    });
    setErrors({});
    setTestStatus(null);
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.account_name) errs.account_name = "Account Name is required";
    if (credentialType === "account_key" && !form.account_key)
      errs.account_key = "Account Key is required";
    if (credentialType === "sas_token" && !form.sas_token)
      errs.account_key = "SAS Token is required";
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
        account_key: credentialType === "account_key" ? form.account_key : "",
        sas_token: credentialType === "sas_token" ? form.sas_token : "",
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
          account_key: credentialType === "account_key" ? form.account_key : "",
          sas_token: credentialType === "sas_token" ? form.sas_token : "",
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
          <FormControl>
            <FormLabel>Authentication Method</FormLabel>
            <RadioGroup
              row
              value={credentialType}
              onChange={handleCredentialTypeChange}
            >
              <FormControlLabel
                value="account_key"
                control={<Radio />}
                label="Access Key"
              />
              <FormControlLabel
                value="sas_token"
                control={<Radio />}
                label="SAS Token"
              />
            </RadioGroup>
          </FormControl>
          <TextField
            label="Account Key"
            name="account_key"
            type="password"
            value={form.account_key}
            onChange={handleChange}
            required={credentialType === "account_key"}
            disabled={credentialType !== "account_key"}
            error={!!errors.account_key && credentialType === "account_key"}
            helperText={
              credentialType === "account_key" ? errors.account_key : ""
            }
          />
          <TextField
            label="SAS Token"
            name="sas_token"
            type="password"
            value={form.sas_token}
            onChange={handleChange}
            required={credentialType === "sas_token"}
            disabled={credentialType !== "sas_token"}
            error={!!errors.account_key && credentialType === "sas_token"}
            helperText={
              credentialType === "sas_token" ? errors.account_key : ""
            }
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
