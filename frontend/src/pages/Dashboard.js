import React from "react";
import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)",
        padding: 0,
        margin: 0,
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "40px 24px 24px 24px",
        }}
      >
        {/* Header with image and description */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="Copy Pilot Logo"
            style={{ width: 120, marginBottom: 16 }}
          />
          <div
            style={{
              color: "#2d3a4b",
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          ></div>
          <p style={{ color: "#475569", fontSize: 18, margin: 0 }}>
            Your one-stop solution for automating file copying, scheduling, and
            monitoring.
          </p>
        </div>

        {/* Navigation cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginTop: 24,
          }}
        >
          <Link
            to="/datasource"
            style={{
              background: "#f1f5f9",
              borderRadius: 10,
              padding: "28px 0",
              textAlign: "center",
              color: "#3730a3",
              fontWeight: 600,
              fontSize: 18,
              textDecoration: "none",
              boxShadow: "0 1px 6px #e0e7ff33",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Data Source
          </Link>
          <Link
            to="/jobs"
            style={{
              background: "#f1f5f9",
              borderRadius: 10,
              padding: "28px 0",
              textAlign: "center",
              color: "#3730a3",
              fontWeight: 600,
              fontSize: 18,
              textDecoration: "none",
              boxShadow: "0 1px 6px #e0e7ff33",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Copy Jobs
          </Link>
          <Link
            to="/scheduler"
            style={{
              background: "#f1f5f9",
              borderRadius: 10,
              padding: "28px 0",
              textAlign: "center",
              color: "#3730a3",
              fontWeight: 600,
              fontSize: 18,
              textDecoration: "none",
              boxShadow: "0 1px 6px #e0e7ff33",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Scheduler
          </Link>
          <Link
            to="/global-variables"
            style={{
              background: "#f1f5f9",
              borderRadius: 10,
              padding: "28px 0",
              textAlign: "center",
              color: "#3730a3",
              fontWeight: 600,
              fontSize: 18,
              textDecoration: "none",
              boxShadow: "0 1px 6px #e0e7ff33",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Global Variables
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
