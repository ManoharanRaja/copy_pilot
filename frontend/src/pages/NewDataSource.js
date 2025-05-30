import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

function NewDataSource() {
  const [selectedType, setSelectedType] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "Azure Data Lake Storage",
    account_name: "",
    account_key: "",
    container: "",
  });
  const [testStatus, setTestStatus] = useState(null); // null | "success" | "fail"
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState({});
  const history = useHistory();

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setForm({ ...form, type });
    setTestStatus(null);
    setErrors({});
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setTestStatus(null); // Reset test status on change
    setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!form.name) errs.name = "Name is required";
    if (!form.account_name) errs.account_name = "Account Name is required";
    if (!form.account_key) errs.account_key = "Account Key is required";
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
    try {
      const config = {
        account_name: form.account_name,
        account_key: form.account_key,
        container: form.container,
      };
      const res = await axios.post("/datasources/test", {
        type: form.type,
        config,
      });
      if (res.data && res.data.success) {
        setTestStatus("success");
      } else {
        setTestStatus("fail");
      }
    } catch (err) {
      setTestStatus("fail");
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
      await axios.post("/datasources", {
        name: form.name,
        type: form.type,
        config: {
          account_name: form.account_name,
          account_key: form.account_key,
          container: form.container,
        },
      });
      history.push("/datasource");
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.detail === "Data source name already exists."
      ) {
        setErrors({ ...errs, name: "Data source name already exists." });
      } else {
        // Optionally handle other errors
        alert("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div>
      <h1>Add New Data Source</h1>
      {!selectedType ? (
        <div>
          <h2>Select Data Source Type</h2>
          <button onClick={() => handleTypeSelect("Azure Data Lake Storage")}>
            Azure Data Lake Storage (Azure Data Lake Storage)
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 40,
            maxWidth: 400,
            background: "#fafafa",
            padding: 24,
            borderRadius: 8,
            boxShadow: "0 2px 8px #eee",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: 4 }}>
              Name<span style={{ color: "red" }}> *</span>
            </label>
            <input
              name="name"
              placeholder="Enter name *"
              value={form.name}
              onChange={handleChange}
              style={{ padding: 8 }}
            />
            {errors.name && (
              <span style={{ color: "red", fontSize: 12 }}>{errors.name}</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: 4 }}>
              Account Name<span style={{ color: "red" }}> *</span>
            </label>
            <input
              name="account_name"
              placeholder="Enter account name *"
              value={form.account_name}
              onChange={handleChange}
              style={{ padding: 8 }}
            />
            <span style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              https://{form.account_name || "{account_name}"}
              .dfs.core.windows.net/
            </span>
            {errors.account_name && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.account_name}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: 4 }}>
              Account Key<span style={{ color: "red" }}> *</span>
            </label>
            <input
              name="account_key"
              type="password"
              placeholder="Enter account key *"
              value={form.account_key}
              onChange={handleChange}
              style={{ padding: 8 }}
            />
            {errors.account_key && (
              <span style={{ color: "red", fontSize: 12 }}>
                {errors.account_key}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: 4 }}>Container</label>
            <input
              name="container"
              placeholder="Container (Optional)"
              value={form.container}
              onChange={handleChange}
              style={{ padding: 8 }}
            />
          </div>
          <button
            type="button"
            onClick={handleTest}
            style={{ marginTop: 8 }}
            disabled={testing}
          >
            {testing ? "Testing..." : "Test"}
          </button>
          {testStatus === "success" && (
            <div style={{ color: "green" }}>Connection successful!</div>
          )}
          {testStatus === "fail" && (
            <div style={{ color: "red" }}>
              Connection failed. Please check your details.
            </div>
          )}
          <button
            type="submit"
            style={{ marginTop: 8 }}
            disabled={testStatus !== "success"}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("")}
            style={{ marginTop: 4 }}
          >
            Back
          </button>
        </form>
      )}
    </div>
  );
}

export default NewDataSource;
