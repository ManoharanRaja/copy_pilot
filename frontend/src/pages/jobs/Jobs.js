import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Stack,
} from "@mui/material";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    fetchDataSources();
    // eslint-disable-next-line
  }, []);

  const fetchJobs = async () => {
    const res = await axios.get("/jobs");
    setJobs(res.data);
  };

  const fetchDataSources = async () => {
    const res = await axios.get("/datasources");
    setDataSources(res.data);
  };

  // Helper to get Azure account name by ID
  const getAzureAccountName = (azureId) => {
    const ds = dataSources.find(
      (d) => d.id === azureId && d.type === "Azure Data Lake Storage"
    );
    return ds ? ds.config.account_name : "-";
  };

  const handleDelete = async (id) => {
    await axios.delete(`/jobs/${id}`);
    fetchJobs();
  };

  const handleRun = async (id) => {
    let machineName = localStorage.getItem("machineName");
    if (!machineName) {
      machineName = prompt("Please enter your user name:") || "unknown";
      localStorage.setItem("machineName", machineName);
    }
    // Redirect immediately
    navigate(`/jobs/${id}/run-history?triggerRun=1`);
    // Fire and forget the run request
    axios.post(
      `/jobs/${id}/run`,
      { trigger_type: "manual" },
      {
        headers: {
          "X-Machine-Name": machineName,
        },
      }
    );
  };

  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        bgcolor: "transparent",
        px: 0,
        py: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          px: { xs: 2, md: 6 },
          pt: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1 }}>
          Copy Jobs
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/jobs/new")}
        >
          Add New Job
        </Button>
      </Box>
      <TableContainer sx={{ px: { xs: 0, md: 6 } }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Job Name</TableCell>
              <TableCell>Job Details</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Time Travel Run</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} hover>
                <TableCell sx={{ verticalAlign: "top", minWidth: 160 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, mb: 1 }}
                  >
                    {job.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", minWidth: 220 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <b>Created By:</b> {job.created_by || "-"}
                    </Typography>
                    <Typography variant="body2">
                      <b>Created On:</b>{" "}
                      {job.created_on
                        ? new Date(job.created_on).toLocaleString()
                        : "-"}
                    </Typography>
                    <Typography variant="body2">
                      <b>Last Updated By:</b> {job.updated_by || "-"}
                    </Typography>
                    <Typography variant="body2">
                      <b>Last Updated On:</b>{" "}
                      {job.updated_on
                        ? new Date(job.updated_on).toLocaleString()
                        : "-"}
                    </Typography>
                    <Typography variant="body2">
                      <b>Last Run:</b>{" "}
                      {job.latest_run_result ? (
                        <span
                          style={{
                            color:
                              job.latest_run_result.status === "Success"
                                ? "green"
                                : job.latest_run_result.status === "Failed"
                                ? "red"
                                : "orange",
                            fontWeight: "bold",
                          }}
                        >
                          Status: {job.latest_run_result.status}
                        </span>
                      ) : (
                        <span style={{ color: "gray", fontWeight: "bold" }}>
                          No runs
                        </span>
                      )}
                      {job.latest_run_result && (
                        <>
                          <span>
                            , Files Copied:{" "}
                            {job.latest_run_result.copied_files_count}, At:{" "}
                            {job.latest_run_result.timestamp
                              ? new Date(
                                  job.latest_run_result.timestamp
                                ).toLocaleString()
                              : "-"}
                          </span>
                        </>
                      )}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", minWidth: 180 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <b>Type:</b> {job.sourceType}
                    </Typography>
                    {job.sourceType === "azure" && (
                      <Typography variant="body2">
                        <b>Account:</b> {getAzureAccountName(job.sourceAzureId)}
                      </Typography>
                    )}
                    {job.sourceContainer && (
                      <Typography variant="body2">
                        <b>Container:</b> {job.sourceContainer}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <b>Folder:</b> {job.source}
                    </Typography>
                    {job.sourceFileMask && (
                      <Typography variant="body2">
                        <b>File Mask:</b> {job.sourceFileMask}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", minWidth: 180 }}>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <b>Type:</b> {job.targetType}
                    </Typography>
                    {job.targetType === "azure" && (
                      <Typography variant="body2">
                        <b>Account:</b> {getAzureAccountName(job.targetAzureId)}
                      </Typography>
                    )}
                    {job.targetContainer && (
                      <Typography variant="body2">
                        <b>Container:</b> {job.targetContainer}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <b>Folder:</b> {job.target}
                    </Typography>
                    {job.targetFileMask && (
                      <Typography variant="body2">
                        <b>File Mask:</b> {job.targetFileMask}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", minWidth: 120 }}>
                  {job.time_travel && job.time_travel.enabled ? (
                    <Stack spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Enabled
                      </Typography>
                      <Typography variant="body2">
                        From: {job.time_travel.from_date || "-"}
                      </Typography>
                      <Typography variant="body2">
                        To: {job.time_travel.to_date || "-"}
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2">Disabled</Typography>
                  )}
                </TableCell>
                <TableCell sx={{ verticalAlign: "top", minWidth: 180 }}>
                  <Stack direction="column" spacing={1}>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/jobs/${job.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDelete(job.id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="success"
                        onClick={() => handleRun(job.id)}
                      >
                        Run
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/jobs/${job.id}/clone`)}
                      >
                        Clone
                      </Button>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/jobs/${job.id}/run-history`)}
                      >
                        View run history
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          navigate(`/jobs/${job.id}/local-variables`)
                        }
                      >
                        Define Job Variables
                      </Button>
                    </Stack>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No jobs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default Jobs;
