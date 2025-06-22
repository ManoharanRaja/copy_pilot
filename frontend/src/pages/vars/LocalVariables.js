import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

function LocalVariables() {
  const { id: jobId } = useParams();
  const history = useHistory();
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
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Local Variables for Job</h2>
        <button
          onClick={handleRefreshAll}
          disabled={refreshingAll}
          style={{
            background: "#007bff",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: 4,
            cursor: refreshingAll ? "not-allowed" : "pointer",
            fontWeight: "bold",
            marginRight: 8,
          }}
          title="Refresh all dynamic variables"
        >
          {refreshingAll ? "Refreshing..." : "Refresh All"}
        </button>
        <button
          onClick={() => history.push("/jobs")}
          style={{
            background: "#6c757d",
            color: "#fff",
            padding: "8px 16px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Back to Jobs
        </button>
      </div>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label>
              Name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                style={{ marginLeft: 8, marginRight: 16 }}
                required
                disabled={editing}
              />
            </label>
            {typeof error === "string" &&
              error.toLowerCase().includes("name") && (
                <div style={{ color: "red", marginTop: 4 }}>{error}</div>
              )}
          </div>
          <label>
            Type
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              style={{ marginLeft: 8, marginRight: 16 }}
            >
              <option value="static">Static</option>
              <option value="dynamic">Dynamic</option>
            </select>
          </label>
          {form.type === "static" ? (
            <label>
              Value
              <input
                name="value"
                value={form.value}
                onChange={handleChange}
                style={{ marginLeft: 8, marginRight: 16, width: 200 }}
                required
              />
            </label>
          ) : (
            <label style={{ display: "flex", flexDirection: "column" }}>
              Python Code
              <textarea
                name="expression"
                value={form.expression}
                onChange={handleChange}
                style={{
                  marginLeft: 8,
                  marginRight: 16,
                  width: 400,
                  height: 80,
                  fontFamily: "monospace",
                  resize: "vertical",
                }}
                required
                placeholder="Enter Python expression or code"
              />
              <div style={{ marginLeft: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={handleRunExpression}
                  style={{ marginRight: 8 }}
                >
                  Run Code
                </button>
                <b>Value:</b>{" "}
                {evalValue !== "" ? (
                  <span style={{ fontFamily: "monospace" }}>
                    {String(evalValue)}
                  </span>
                ) : (
                  <i>Type python code and click Run Code</i>
                )}
              </div>
            </label>
          )}
        </div>
        {typeof error === "string" && !error.toLowerCase().includes("name") && (
          <div style={{ color: "red", marginTop: 8 }}>{error}</div>
        )}
        <div style={{ marginTop: 12 }}>
          <button type="submit">
            {editing ? "Update Variable" : "Add Variable"}
          </button>
          {editing && (
            <button
              type="button"
              onClick={handleCancel}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Value</th>
            <th>Python Code</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vars.map((v) => (
            <tr key={v.id}>
              <td>{v.name}</td>
              <td>{v.type}</td>
              <td>{v.value}</td>
              <td>
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
              </td>
              <td>
                <button
                  onClick={() => handleEdit(v)}
                  style={{ marginRight: 8 }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(v.id)}
                  style={{ color: "red", marginRight: 8 }}
                >
                  Delete
                </button>
                <button
                  onClick={() => handleRefresh(v)}
                  disabled={v.type !== "dynamic"}
                  style={{
                    color: v.type === "dynamic" ? "blue" : "gray",
                    cursor: v.type === "dynamic" ? "pointer" : "not-allowed",
                  }}
                  title={
                    v.type === "dynamic"
                      ? "Refresh value"
                      : "Only available for dynamic variables"
                  }
                >
                  Refresh
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LocalVariables;
