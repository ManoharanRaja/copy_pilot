import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom";
import { validateJob } from "../utils/jobValidation";

function EditJob() {
  const { id } = useParams();
  const history = useHistory();
  const [form, setForm] = useState(null);
  const [azureSources, setAzureSources] = useState([]);
  const [errors, setErrors] = useState({});
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Azure Data Lake sources
    axios.get("/datasources?type=azure").then((res) => {
      setAzureSources(res.data || []);
    });
    // Fetch all jobs for name uniqueness check and to get the job to edit
    axios.get("/jobs").then((res) => {
      setJobs(res.data || []);
      const job = (res.data || []).find((j) => String(j.id) === String(id));
      setForm(job);
      setLoading(false);
    });
  }, [id]);

  const getContainers = (azureId) => {
    const ds = azureSources.find((d) => d.id === azureId);
    return ds && ds.containers ? ds.containers : [];
  };

  if (loading || !form) return <div>Loading...</div>;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateJob(form);

    // Unique name validation (exclude current job)
    if (
      jobs.some(
        (job) =>
          job.id !== form.id &&
          job.name.trim().toLowerCase() === form.name.trim().toLowerCase()
      )
    ) {
      validationErrors.name = "A job with this name already exists.";
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    try {
      await axios.put(`/jobs/${id}`, form);
      history.push("/jobs");
    } catch (error) {
      const detail =
        error.response?.data?.detail ||
        (typeof error.response?.data === "string"
          ? error.response.data
          : error.message);
      alert("Failed to update job: " + detail);
    }
  };

  return (
    <div>
      <h2>Edit Job</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "40px", marginBottom: "20px" }}>
          {/* Source Section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              borderRight: "1px solid #ccc",
              paddingRight: "20px",
            }}
          >
            <h3>Source Details</h3>
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
            <label>
              Source Type
              <select
                name="sourceType"
                value={form.sourceType}
                onChange={handleChange}
                required
              >
                <option value="">Select Source Type</option>
                <option value="azure">Azure Data Lake Storage</option>
                <option value="local">Local Folder</option>
                <option value="shared">Shared Folder</option>
              </select>
            </label>
            {/* Azure Data Lake Source Dropdown */}
            {form.sourceType === "azure" && (
              <>
                <label>
                  Azure Data Lake Source
                  <select
                    name="sourceAzureId"
                    value={form.sourceAzureId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Azure Data Lake Source</option>
                    {azureSources.map((ds) => (
                      <option key={ds.id} value={ds.id}>
                        {ds.name}
                      </option>
                    ))}
                  </select>
                </label>
                {/* Container Text Field */}
                {form.sourceAzureId && (
                  <label>
                    Container
                    <input
                      name="sourceContainer"
                      value={form.sourceContainer}
                      onChange={handleChange}
                      required={getContainers(form.sourceAzureId).length === 0}
                      placeholder={
                        getContainers(form.sourceAzureId).length > 0
                          ? getContainers(form.sourceAzureId)[0]
                          : "Enter container name"
                      }
                      style={{ color: "#888" }}
                    />
                  </label>
                )}
              </>
            )}
            <label>
              Source Folder
              <input
                name="source"
                placeholder="Source Folder"
                value={form.source}
                onChange={handleChange}
                required
                style={errors.source ? { borderColor: "red" } : {}}
              />
              {errors.source && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {errors.source}
                </span>
              )}
            </label>
            <label>
              File Mask
              <input
                name="sourceFileMask"
                placeholder="File Mask (e.g. *.csv)"
                value={form.sourceFileMask}
                onChange={handleChange}
                style={errors.sourceFileMask ? { borderColor: "red" } : {}}
              />
              {errors.sourceFileMask && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {errors.sourceFileMask}
                </span>
              )}
            </label>
          </div>
          {/* Target Section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              paddingLeft: "20px",
            }}
          >
            <h3>Target Details</h3>
            <label>
              Target Type
              <select
                name="targetType"
                value={form.targetType}
                onChange={handleChange}
                required
              >
                <option value="">Select Target Type</option>
                <option value="azure">Azure Data Lake</option>
                <option value="local">Local Folder</option>
                <option value="shared">Shared Folder</option>
              </select>
            </label>
            {/* Azure Data Lake Target Dropdown */}
            {form.targetType === "azure" && (
              <>
                <label>
                  Azure Data Lake Target
                  <select
                    name="targetAzureId"
                    value={form.targetAzureId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Azure Data Lake Target</option>
                    {azureSources.map((ds) => (
                      <option key={ds.id} value={ds.id}>
                        {ds.name}
                      </option>
                    ))}
                  </select>
                </label>
                {/* Container Text Field */}
                {form.targetAzureId && (
                  <label>
                    Container
                    <input
                      name="targetContainer"
                      value={form.targetContainer}
                      onChange={handleChange}
                      required={getContainers(form.targetAzureId).length === 0}
                      placeholder={
                        getContainers(form.targetAzureId).length > 0
                          ? getContainers(form.targetAzureId)[0]
                          : "Enter container name"
                      }
                      style={{ color: "#888" }}
                    />
                  </label>
                )}
              </>
            )}
            <label>
              Target Folder
              <input
                name="target"
                placeholder="Target Folder"
                value={form.target}
                onChange={handleChange}
                required
                style={errors.target ? { borderColor: "red" } : {}}
              />
              {errors.target && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {errors.target}
                </span>
              )}
            </label>
            <label>
              File Mask
              <input
                name="targetFileMask"
                placeholder="File Mask (e.g. *.csv)"
                value={form.targetFileMask}
                onChange={handleChange}
                style={errors.targetFileMask ? { borderColor: "red" } : {}}
              />
              {errors.targetFileMask && (
                <span style={{ color: "red", fontSize: "12px" }}>
                  {errors.targetFileMask}
                </span>
              )}
            </label>
          </div>
        </div>
        <button type="submit">Save</button>
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

export default EditJob;
