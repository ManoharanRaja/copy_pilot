import React, { useEffect, useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

function DataSource() {
  const [sources, setSources] = useState([]);
  const history = useHistory();

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    const res = await axios.get("/datasources");
    setSources(res.data);
  };

  const handleEditPage = (id) => {
    history.push(`/datasource/${id}/edit`);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this data source?")) {
      await axios.delete(`/datasources/${id}`);
      fetchSources();
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
            <th
              style={{
                borderBottom: "1px solid #ccc",
                textAlign: "left",
                padding: "8px",
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sources.map((src) => (
            <tr key={src.id}>
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
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                <button
                  onClick={() => handleEditPage(src.id)}
                  style={{ marginRight: 8 }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(src.id)}
                  style={{ color: "red" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataSource;
