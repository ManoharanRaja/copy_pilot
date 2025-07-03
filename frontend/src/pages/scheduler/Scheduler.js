import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import DeleteIcon from "@mui/icons-material/Delete";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function Scheduler() {
  const [jobs, setJobs] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/jobs").then((res) => setJobs(res.data || []));
    fetchSchedules();
    // eslint-disable-next-line
  }, []);

  const fetchSchedules = async () => {
    const res = await axios.get("/schedules");
    setSchedules(res.data || []);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/schedules/${id}`);
    fetchSchedules();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h4" fontWeight={700}>
            Scheduler
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/scheduler/new")}
            sx={{ fontWeight: 600 }}
          >
            Add New Scheduler
          </Button>
        </Stack>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Scheduler Name</TableCell>
                <TableCell>Job Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Schedule</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No schedules yet.
                  </TableCell>
                </TableRow>
              )}
              {schedules.map((sch) => {
                const job = jobs.find(
                  (j) => String(j.id) === String(sch.jobId)
                );
                return (
                  <TableRow key={sch.id}>
                    <TableCell>{sch.name}</TableCell>
                    <TableCell>
                      {job ? job.name : <i>Job not found</i>}
                    </TableCell>
                    <TableCell>
                      {sch.paused ? (
                        <Chip label="Paused" color="warning" />
                      ) : (
                        <Chip label="Active" color="success" />
                      )}
                    </TableCell>
                    <TableCell>
                      {sch.customScheduler ? (
                        <>
                          <b>
                            {(() => {
                              const { type, x, y } = sch.customScheduler;
                              const ordX = ordinal(x);
                              switch (type) {
                                case "business_day_month":
                                  return `${ordX} Business Day of the month`;
                                case "day_month":
                                  return `${ordX} Day of the month`;
                                case "business_day_quarter":
                                  return `${ordX} Business Day of Quarter ${y}`;
                                case "day_quarter":
                                  return `${ordX} Day of Quarter ${y}`;
                                case "business_day_halfyear":
                                  return `${ordX} Business Day of Half yearly ${y}`;
                                case "day_halfyear":
                                  return `${ordX} Day of Half yearly ${y}`;
                                case "business_day_annually":
                                  return `${ordX} Business Day of annually ${y}`;
                                case "day_annually":
                                  return `${ordX} Day of annually ${y}`;
                                default:
                                  return "-";
                              }
                            })()}
                          </b>
                          <br />
                        </>
                      ) : sch.weekdays && sch.weekdays.length > 0 ? (
                        sch.weekdays.join(", ")
                      ) : (
                        "—"
                      )}
                      <br />
                      <b>Time:</b> {sch.time || "—"}
                      <br />
                      <b>Timezone:</b> {sch.timezone || "—"}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        {sch.paused ? (
                          <Button
                            size="small"
                            color="success"
                            startIcon={<PlayArrowIcon />}
                            onClick={async () => {
                              await axios.post(`/schedules/${sch.id}/resume`);
                              fetchSchedules();
                            }}
                          >
                            Resume
                          </Button>
                        ) : (
                          <Button
                            size="small"
                            color="warning"
                            startIcon={<PauseIcon />}
                            onClick={async () => {
                              await axios.post(`/schedules/${sch.id}/pause`);
                              fetchSchedules();
                            }}
                          >
                            Pause
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(sch.id)}
                        >
                          Delete
                        </Button>
                        <Button
                          size="small"
                          color="primary"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/scheduler/edit/${sch.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="secondary"
                          startIcon={<HistoryIcon />}
                          onClick={() =>
                            navigate(`/jobs/${sch.jobId}/run-history`)
                          }
                        >
                          Run History
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default Scheduler;
