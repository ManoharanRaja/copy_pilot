import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    name: "",
    source: "",
    target: "",
    schedule: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const history = useHistory();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    const res = await axios.get("/jobs");
    setJobs(res.data);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await axios.put(`/jobs/${editingId}`, form);
      setEditingId(null);
    } else {
      await axios.post("/jobs", form);
    }
    setForm({ name: "", source: "", target: "", schedule: "" });
    setShowForm(false);
    fetchJobs();
  };

  const handleEdit = (job) => {
    setForm(job);
    setEditingId(job.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/jobs/${id}`);
    fetchJobs();
  };

  const handleRun = async (id) => {
    await axios.post(`/jobs/${id}/run`);
    alert("Job started!");
  };

  const handleAddNew = () => {
    setForm({ name: "", source: "", target: "", schedule: "" });
    setEditingId(null);
    setShowForm(true);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Copy Jobs</h2>
        <button
          onClick={() => history.push("/jobs/new")}
          style={{ marginLeft: "auto" }}
        >
          Add New Job
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
          <input
            name="name"
            placeholder="Job Name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="source"
            placeholder="Source Folder"
            value={form.source}
            onChange={handleChange}
            required
          />
          <input
            name="target"
            placeholder="Target Folder"
            value={form.target}
            onChange={handleChange}
            required
          />
          <input
            name="schedule"
            placeholder="Schedule (optional)"
            value={form.schedule}
            onChange={handleChange}
          />
          <button type="submit">{editingId ? "Update" : "Add"} Job</button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </form>
      )}
      <table
        border="1"
        cellPadding="8"
        cellSpacing="0"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>Name</th>
            <th>Source</th>
            <th>Target</th>
            <th>Schedule</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.name}</td>
              <td>{job.source}</td>
              <td>{job.target}</td>
              <td>{job.schedule || "Manual"}</td>
              <td>
                <button onClick={() => handleEdit(job)}>Edit</button>
                <button
                  onClick={() => handleDelete(job.id)}
                  style={{ marginLeft: "5px" }}
                >
                  Delete
                </button>
                <button
                  onClick={() => handleRun(job.id)}
                  style={{ marginLeft: "5px" }}
                >
                  Run
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Jobs;
