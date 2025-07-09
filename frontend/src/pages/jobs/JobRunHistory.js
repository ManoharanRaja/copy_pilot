import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Collapse,
  Alert,
  Menu,
  MenuItem,
} from "@mui/material";

function JobRunHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isPolling, setIsPolling] = useState(false);
  const [runHistory, setRunHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [expandedDateRun, setExpandedDateRun] = useState(null);
  const [jobName, setJobName] = useState("");
  const [schedulers, setSchedulers] = useState([]);
  const [archives, setArchives] = useState([]);
  const [selectedArchive, setSelectedArchive] = useState("main");
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Fetch schedulers for mapping ID to name
  const fetchSchedulers = async () => {
    try {
      const res = await axios.get("/schedules");
      setSchedulers(res.data || []);
    } catch {
      setSchedulers([]);
    }
  };

  const fetchArchives = async () => {
    try {
      const res = await axios.get(`/jobs/${id}/run-history-archives`);
      setArchives(res.data.archives || []);
    } catch {
      setArchives([]);
    }
  };

  const fetchHistory = async (archive = selectedArchive) => {
    let url = `/jobs/${id}/run-history`;
    if (archive !== "main") {
      url += `?archive=${archive}`;
    }
    const res = await axios.get(url);
    setRunHistory(res.data || []);
  };

  const fetchJobName = async () => {
    const res = await axios.get("/jobs");
    const job = res.data.find((j) => String(j.id) === String(id));
    setJobName(job ? job.name : id);
  };

  useEffect(() => {
    fetchHistory();
    fetchJobName();
    fetchSchedulers();
    fetchArchives();
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    fetchHistory(selectedArchive);
    // eslint-disable-next-line
  }, [selectedArchive]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("triggerRun") === "1") {
      setIsPolling(true);
    }
  }, [location.search]);

  useEffect(() => {
    let pollInterval = null;
    if (isPolling) {
      pollInterval = setInterval(() => {
        fetchHistory(selectedArchive);
      }, 3000);
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isPolling, selectedArchive]);

  useEffect(() => {
    if (isPolling && runHistory.length > 0) {
      const running = runHistory.find(
        (r) =>
          r.status === "executing" ||
          r.status === "Running..." ||
          r.status === "In Progress"
      );
      if (!running) {
        setIsPolling(false);
      }
    }
  }, [runHistory, isPolling]);

  // Helper to get scheduler name by ID (case-insensitive, trims whitespace)
  const getSchedulerName = (schedulerId) => {
    if (!schedulerId) return "-";
    const scheduler = schedulers.find(
      (s) =>
        String(s.id).trim().toLowerCase() ===
        String(schedulerId).trim().toLowerCase()
    );
    return scheduler ? scheduler.name : schedulerId;
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
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <img
          src="/runhistory.png"
          alt="Run History"
          style={{ width: 80, height: 80, marginRight: 12 }} // doubled from 40 to 80
        />
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
          Run History for Job: {jobName}
        </Typography>
      </Box>

      {/* Flex row for Back button and Archive dropdown */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate("/jobs")}
          sx={{ mr: 2 }}
        >
          Back to Jobs
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          sx={{ ml: 2 }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          {selectedArchive === "main"
            ? "Latest Runs"
            : `Archive ${selectedArchive}`}
        </Button>
        <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
          <MenuItem
            selected={selectedArchive === "main"}
            onClick={() => {
              setSelectedArchive("main");
              setAnchorEl(null);
            }}
          >
            Main (Latest Runs)
          </MenuItem>
          {archives.map((a) => (
            <MenuItem
              key={String(a)}
              selected={selectedArchive === String(a)}
              onClick={() => {
                setSelectedArchive(String(a));
                setAnchorEl(null);
              }}
            >
              Archive {a}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {isPolling && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Running... Please wait.
        </Alert>
      )}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>RunId</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Trigger Type</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {runHistory.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>No run history yet.</TableCell>
              </TableRow>
            )}
            {[...runHistory]
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .map((run, idx) => (
                <React.Fragment key={idx}>
                  <TableRow>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{run.timestamp}</TableCell>
                    <TableCell
                      sx={{
                        color:
                          run.status === "Success"
                            ? "green"
                            : run.status === "Failed"
                            ? "red"
                            : "orange",
                        fontWeight: "bold",
                      }}
                    >
                      {run.status}
                    </TableCell>
                    <TableCell>{run.message}</TableCell>
                    <TableCell>
                      {run.trigger_type === "scheduled" ? (
                        run.scheduler_id ? (
                          <>
                            Scheduled Run - Scheduler Name:{" "}
                            <b>{getSchedulerName(run.scheduler_id)}</b>
                          </>
                        ) : (
                          "Scheduled Run"
                        )
                      ) : (
                        "Manual Trigger"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() =>
                          setExpanded(expanded === idx ? null : idx)
                        }
                      >
                        {expanded === idx ? "Hide" : "Show"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                      <Collapse
                        in={expanded === idx}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box sx={{ p: 2 }}>
                          {Array.isArray(run.date_runs) &&
                          run.date_runs.length > 1 ? (
                            (() => {
                              const passCount = run.date_runs.filter(
                                (dr) => dr.status === "Success"
                              ).length;
                              const failCount = run.date_runs.filter(
                                (dr) => dr.status === "Failed"
                              ).length;
                              const overallStatus =
                                failCount > 0
                                  ? "Completed with Failure"
                                  : "Success";
                              return (
                                <Box>
                                  <Typography>
                                    <b>
                                      Time Travel Run Details:{" "}
                                      <span
                                        style={{
                                          color:
                                            overallStatus === "Success"
                                              ? "green"
                                              : "red",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        {overallStatus}
                                      </span>
                                    </b>
                                  </Typography>
                                  <Typography>
                                    <span style={{ color: "green" }}>
                                      Passed: {passCount}
                                    </span>
                                    {" | "}
                                    <span style={{ color: "red" }}>
                                      Failed: {failCount}
                                    </span>
                                  </Typography>
                                  <Table size="small" sx={{ mt: 1 }}>
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Message</TableCell>
                                        <TableCell>Details</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {run.date_runs.map((dateRun, dIdx) => (
                                        <React.Fragment key={dIdx}>
                                          <TableRow>
                                            <TableCell>
                                              {dateRun.date}
                                            </TableCell>
                                            <TableCell
                                              sx={{
                                                color:
                                                  dateRun.status === "Success"
                                                    ? "green"
                                                    : dateRun.status ===
                                                      "Failed"
                                                    ? "red"
                                                    : "orange",
                                                fontWeight: "bold",
                                              }}
                                            >
                                              {dateRun.status}
                                            </TableCell>
                                            <TableCell>
                                              {dateRun.message}
                                            </TableCell>
                                            <TableCell>
                                              <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() =>
                                                  setExpandedDateRun(
                                                    expandedDateRun ===
                                                      `${idx}-${dIdx}`
                                                      ? null
                                                      : `${idx}-${dIdx}`
                                                  )
                                                }
                                              >
                                                {expandedDateRun ===
                                                `${idx}-${dIdx}`
                                                  ? "Hide"
                                                  : "Show"}
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell
                                              colSpan={4}
                                              sx={{ p: 0, border: 0 }}
                                            >
                                              <Collapse
                                                in={
                                                  expandedDateRun ===
                                                  `${idx}-${dIdx}`
                                                }
                                                timeout="auto"
                                                unmountOnExit
                                              >
                                                <Box sx={{ p: 2 }}>
                                                  <Typography>
                                                    <b>File Mask Used:</b>{" "}
                                                    {dateRun.file_mask_used ||
                                                      "-"}
                                                  </Typography>
                                                  <Typography>
                                                    <b>
                                                      Matching Source Files:
                                                    </b>
                                                  </Typography>
                                                  <ul>
                                                    {dateRun.source_files?.map(
                                                      (f, i) => (
                                                        <li key={i}>{f}</li>
                                                      )
                                                    )}
                                                  </ul>
                                                  <Typography>
                                                    <b>Copied Files:</b>
                                                  </Typography>
                                                  <ul>
                                                    {dateRun.copied_files?.map(
                                                      (f, i) => (
                                                        <li key={i}>{f}</li>
                                                      )
                                                    )}
                                                  </ul>
                                                </Box>
                                              </Collapse>
                                            </TableCell>
                                          </TableRow>
                                        </React.Fragment>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </Box>
                              );
                            })()
                          ) : (
                            // For normal runs or single-date runs, show only copied file details
                            <Box>
                              <Typography>
                                <b>File Mask Used:</b>{" "}
                                {run.date_runs && run.date_runs[0]
                                  ? run.date_runs[0].file_mask_used || "-"
                                  : run.file_mask_used || "-"}
                              </Typography>
                              <Typography>
                                <b>Matching Source Files:</b>
                              </Typography>
                              <ul>
                                {(run.date_runs && run.date_runs[0]
                                  ? run.date_runs[0].source_files
                                  : run.source_files
                                )?.map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                              <Typography>
                                <b>Copied Files:</b>
                              </Typography>
                              <ul>
                                {(run.date_runs && run.date_runs[0]
                                  ? run.date_runs[0].copied_files
                                  : run.copied_files
                                )?.map((f, i) => (
                                  <li key={i}>{f}</li>
                                ))}
                              </ul>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default JobRunHistory;
