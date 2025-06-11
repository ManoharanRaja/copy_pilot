import React, { useState } from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  const [connections, setConnections] = useState([]);
  const [form, setForm] = useState({ name: "", path: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.name && form.path) {
      setConnections([...connections, { ...form }]);
      setForm({ name: "", path: "" });
    }
  };

  return (
    <div>
      <h1>Dashboard</h1>
      {/* Add Data Source link here */}
      <nav>
        <Link to="/datasource">Data Source</Link>
      </nav>
      <nav>
        <Link to="/jobs">Copy Job</Link>
      </nav>
      <nav>
        <Link to="/scheduler">Scheduler</Link>
      </nav>
      <nav>
        <Link to="/global-variables">Global Variables</Link>
      </nav>
    </div>
  );
}

export default Dashboard;
