import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Box,
} from "@mui/material";

function LocalVariables() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const [vars, setVars] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    type: "static",
    value: "",
    expression: "",
  });
  const [evalValue, setEvalValue] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);

  useEffect(() => {
    fetchVars();
    // eslint-disable-next-line
  }, [jobId]);

  const fetchVars = () => {
    axios
      .get(`/jobs/${jobId}/local-variables`)
      .then((res) => setVars(res.data));
  };

  const handleRunExpression = async () => {
    if (form.expression && form.name) {
      try {
        const res = await axios.post(`/jobs/${jobId}/local-variables/eval`, {
          expr: form.expression,
          name: form.name,
        });
        setEvalValue(res.data.value);
        if (form.type === "dynamic") {
          setForm((prev) => ({ ...prev, value: String(res.data.value) }));
        }
        fetchVars();
      } catch {
        setEvalValue("Error");
      }
    }
  };

  const handleRefresh = async (v) => {
    if (v.type === "dynamic") {
      try {
        await axios.post(`/jobs/${jobId}/local-variables/eval`, {
          expr: v.expression,
          name: v.name,
        });
        fetchVars();
      } catch {
        alert("Failed to refresh variable.");
      }
    }
  };

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    const dynamicVars = vars.filter((v) => v.type === "dynamic");
    try {
      const results = await Promise.allSettled(
        dynamicVars.map((v) =>
          axios.post(`/jobs/${jobId}/local-variables/eval`, {
            expr: v.expression,
            name: v.name,
          })
        )
      );
      const failed = results
        .map((r, i) => (r.status === "rejected" ? dynamicVars[i].name : null))
        .filter(Boolean);
      if (failed.length > 0) {
        alert("Failed to refresh: " + failed.join(", "));
      }
      fetchVars();
    } finally {
      setRefreshingAll(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (
      e.target.name === "name" &&
      typeof error === "string" &&
      error.toLowerCase().includes("name")
    ) {
      setError("");
    }
    if (e.target.name === "expression" && form.type === "dynamic") {
      setEvalValue("");
      setForm((prev) => ({ ...prev, value: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name ||
      (form.type === "dynamic" && !form.expression) ||
      (form.type === "static" && !form.value)
    ) {
      setError("All required fields must be filled.");
      return;
    }
    try {
      if (editing) {
        await axios.put(`/jobs/${jobId}/local-variables/${form.id}`, form);
      } else {
        const payload = { ...form, id: uuidv4() };
        await axios.post(`/jobs/${jobId}/local-variables`, payload);
      }
      setForm({
        id: null,
        name: "",
        type: "static",
        value: "",
        expression: "",
      });
      setEvalValue("");
      setEditing(false);
      setError("");
      fetchVars();
    } catch (err) {
      const detail = err.response?.data?.detail || "Error";
      setError(detail);
    }
  };

  const handleEdit = (v) => {
    setForm({ ...v });
    setEditing(true);
    setError("");
    setEvalValue(v.type === "dynamic" ? v.value : "");
  };

  const handleDelete = async (varId) => {
    if (window.confirm("Are you sure you want to delete this variable?")) {
      await axios.delete(`/jobs/${jobId}/local-variables/${varId}`);
      fetchVars();
    }
  };

  const handleCancel = () => {
    setForm({ id: null, name: "", type: "static", value: "", expression: "" });
    setEditing(false);
    setError("");
    setEvalValue("");
  };

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
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h5" fontWeight={700}>
          Local Variables for Job
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            onClick={handleRefreshAll}
            disabled={refreshingAll}
            variant="contained"
            color="primary"
          >
            {refreshingAll ? "Refreshing..." : "Refresh All"}
          </Button>
          <Button
            onClick={() => navigate("/jobs")}
            variant="outlined"
            color="secondary"
          >
            Back to Jobs
          </Button>
        </Stack>
      </Stack>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="flex-start"
        >
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={editing}
            error={
              typeof error === "string" && error.toLowerCase().includes("name")
            }
            helperText={
              typeof error === "string" && error.toLowerCase().includes("name")
                ? error
                : ""
            }
            sx={{ minWidth: 180 }}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={form.type}
              label="Type"
              onChange={handleChange}
            >
              <MenuItem value="static">Static</MenuItem>
              <MenuItem value="dynamic">Dynamic</MenuItem>
            </Select>
          </FormControl>
          {form.type === "static" ? (
            <TextField
              label="Value"
              name="value"
              value={form.value}
              onChange={handleChange}
              required
              sx={{ minWidth: 200 }}
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <TextField
                label="Python Code"
                name="expression"
                value={form.expression}
                onChange={handleChange}
                required
                multiline
                minRows={3}
                sx={{
                  fontFamily: "monospace",
                  width: 400,
                  mb: 1,
                }}
                placeholder="Enter Python expression or code"
              />
              <Stack direction="row" alignItems="center" spacing={1}>
                <Button
                  type="button"
                  onClick={handleRunExpression}
                  variant="outlined"
                >
                  Run Code
                </Button>
                <Typography variant="body2">
                  <b>Value:</b>{" "}
                  {evalValue !== "" ? (
                    <span style={{ fontFamily: "monospace" }}>
                      {String(evalValue)}
                    </span>
                  ) : (
                    <i>Type python code and click Run Code</i>
                  )}
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button type="submit" variant="contained" color="primary">
            {editing ? "Update Variable" : "Add Variable"}
          </Button>
          {editing && (
            <Button
              type="button"
              onClick={handleCancel}
              variant="outlined"
              color="secondary"
            >
              Cancel
            </Button>
          )}
        </Stack>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Python Code</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vars.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.name}</TableCell>
                <TableCell>{v.type}</TableCell>
                <TableCell>{v.value}</TableCell>
                <TableCell>
                  {v.type === "dynamic" ? (
                    <pre
                      style={{
                        fontFamily: "monospace",
                        margin: 0,
                        background: "#f8f8f8",
                      }}
                    >
                      {v.expression}
                    </pre>
                  ) : (
                    ""
                  )}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      onClick={() => handleEdit(v)}
                      variant="outlined"
                      size="small"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(v.id)}
                      variant="outlined"
                      color="error"
                      size="small"
                    >
                      Delete
                    </Button>
                    <Button
                      onClick={() => handleRefresh(v)}
                      disabled={v.type !== "dynamic"}
                      variant="outlined"
                      color={v.type === "dynamic" ? "primary" : "inherit"}
                      size="small"
                      sx={{
                        cursor:
                          v.type === "dynamic" ? "pointer" : "not-allowed",
                      }}
                      title={
                        v.type === "dynamic"
                          ? "Refresh value"
                          : "Only available for dynamic variables"
                      }
                    >
                      Refresh
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {vars.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No local variables found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default LocalVariables;
