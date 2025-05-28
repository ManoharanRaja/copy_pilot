import React, { useEffect, useState } from "react";
import axios from "axios";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    name: "",
    source: "",
    target: "",
    schedule: "",
  });
  const [editingId, setEditingId] = useState(null);

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
    fetchJobs();
  };

  const handleEdit = (job) => {
    setForm(job);
    setEditingId(job.id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`/jobs/${id}`);
    fetchJobs();
  };

  const handleRun = async (id) => {
    await axios.post(`/jobs/${id}/run`);
    alert("Job started!");
  };

  return (
    <div>
      <h2>Copy Jobs</h2>
      <form onSubmit={handleSubmit}>
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
      </form>
      <ul>
        {jobs.map((job) => (
          <li key={job.id}>
            <b>{job.name}</b> | {job.source} → {job.target} |{" "}
            {job.schedule || "Manual"}
            <button onClick={() => handleEdit(job)}>Edit</button>
            <button onClick={() => handleDelete(job.id)}>Delete</button>
            <button onClick={() => handleRun(job.id)}>Run</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Jobs;
