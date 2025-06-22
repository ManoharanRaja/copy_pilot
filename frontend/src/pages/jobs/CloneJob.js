import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom";
import { validateJob } from "../../utils/jobValidation";

function CloneJob() {
  const { id } = useParams();
  const history = useHistory();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [jobs, setJobs] = useState([]);

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
      history.push("/jobs");
    } catch (error) {
      const detail =
        error.response?.data?.detail ||
        (typeof error.response?.data === "string"
          ? error.response.data
          : error.message);
      alert("Failed to clone job: " + detail);
    }
  };

  if (!form) return <div>Loading...</div>;

  return (
    <div>
      <h2>Clone Job</h2>
      <form onSubmit={handleSubmit}>
        {/* Reuse your job form fields here, similar to NewJob.js */}
        <label>
          Job Name
          <input
            name="name"
            placeholder="Job Name"
            value={form.name}
            onChange={handleChange}
            required
            style={errors.name ? { borderColor: "red" } : {}}
          />
          {errors.name && (
            <span style={{ color: "red", fontSize: "12px" }}>
              {errors.name}
            </span>
          )}
        </label>
        {/* ...repeat for other fields as in NewJob.js... */}
        <button type="submit">Save Cloned Job</button>
        <button
          type="button"
          onClick={() => history.push("/jobs")}
          style={{ marginLeft: "10px" }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default CloneJob;
