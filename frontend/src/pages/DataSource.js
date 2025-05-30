import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

function DataSource() {
  const [sources, setSources] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const history = useHistory();

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const res = await axios.get("/datasources");
    setSources(res.data);
  };

  const handleRowClick = (src) => {
    setSelected(src);
    setEditForm({
      name: src.name,
      type: src.type,
      config: { ...src.config },
      id: src.id,
    });
    setEditMode(false);
    setShowDetail(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this data source?")) {
      await axios.delete(`/datasources/${id}`);
      setShowDetail(false);
      fetchSources();
    }
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`/datasources/${editForm.id}`, editForm);
      setShowDetail(false);
      fetchSources();
      setEditErrors({});
    } catch (error) {
      if (
        error.response &&
        error.response.status === 400 &&
        error.response.data.detail === "Data source name already exists."
      ) {
        setEditErrors({ name: "Data source name already exists." });
      } else {
        alert("An error occurred. Please try again.");
      }
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (["account_name", "account_key", "container", "path"].includes(name)) {
      setEditForm({
        ...editForm,
        config: { ...editForm.config, [name]: value },
      });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <h1 style={{ display: "inline-block" }}>Data Sources</h1>
      <button
        style={{ float: "right", marginTop: 20 }}
        onClick={() => history.push("/datasource/new")}
      >
        Add New Data Source
      </button>
      <table
        style={{ width: "100%", marginTop: 40, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Name
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Type
            </th>
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Config
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((src) => (
            <tr
              key={src.id}
              style={{ cursor: "pointer" }}
              onClick={() => handleRowClick(src)}
            >
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                {src.name}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                {src.type}
              </td>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                {src.type === "Azure Data Lake Storage"
                  ? `Account: ${src.config.account_name}, Container: ${src.config.container}`
                  : src.type === "local"
                  ? `Path: ${src.config.path}`
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Detail/Edit Modal */}
      {showDetail && selected && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowDetail(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 32,
              borderRadius: 8,
              minWidth: 350,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Data Source Details</h2>
            {!editMode ? (
              <>
                <div>
                  <b>Name:</b> {selected.name}
                </div>
                <div>
                  <b>Type:</b> {selected.type}
                </div>
                {selected.type === "Azure Data Lake Storage" && (
                  <>
                    <div>
                      <b>Account Name:</b> {selected.config.account_name}
                    </div>
                    <div>
                      <b>Container:</b> {selected.config.container}
                    </div>
                  </>
                )}
                {selected.type === "local" && (
                  <div>
                    <b>Path:</b> {selected.config.path}
                  </div>
                )}
                <div style={{ marginTop: 24 }}>
                  <button
                    onClick={() => handleDelete(selected.id)}
                    style={{ marginRight: 12, color: "red" }}
                  >
                    Delete
                  </button>
                  <button onClick={() => setEditMode(true)}>Edit</button>
                  <button
                    onClick={() => setShowDetail(false)}
                    style={{ marginLeft: 12 }}
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label>
                    Name:{" "}
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                    />
                  </label>
                  {editErrors.name && (
                    <span
                      style={{ color: "red", fontSize: 12, display: "block" }}
                    >
                      {editErrors.name}
                    </span>
                  )}
                </div>
                {editForm.type === "Azure Data Lake Storage" && (
                  <>
                    <div>
                      <label>
                        Account Name:{" "}
                        <input
                          name="account_name"
                          value={editForm.config.account_name}
                          onChange={handleEditChange}
                        />
                      </label>
                    </div>
                    <div>
                      <label>
                        Account Key:{" "}
                        <input
                          name="account_key"
                          value={editForm.config.account_key}
                          onChange={handleEditChange}
                        />
                      </label>
                    </div>
                    <div>
                      <label>
                        Container:{" "}
                        <input
                          name="container"
                          value={editForm.config.container}
                          onChange={handleEditChange}
                        />
                      </label>
                    </div>
                  </>
                )}
                {editForm.type === "local" && (
                  <div>
                    <label>
                      Path:{" "}
                      <input
                        name="path"
                        value={editForm.config.path}
                        onChange={handleEditChange}
                      />
                    </label>
                  </div>
                )}
                <div style={{ marginTop: 24 }}>
                  <button
                    onClick={handleEditSave}
                    style={{ marginRight: 12, color: "green" }}
                  >
                    Save
                  </button>
                  <button onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DataSource;
