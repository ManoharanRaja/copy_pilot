import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Configuration from "./pages/Configuration";
import NotFound from "./pages/NotFound";
import Footer from "./pages/Footer";
import DataSource from "./pages/datasource/DataSource";
import NewDataSource from "./pages/datasource/NewDataSource";
import EditDataSource from "./pages/datasource/EditDataSource";
import Jobs from "./pages/jobs/Jobs";
import NewJob from "./pages/jobs/NewJob";
import EditJob from "./pages/jobs/EditJob";
import CloneJob from "./pages/jobs/CloneJob";
import JobRunHistory from "./pages/jobs/JobRunHistory";
import Scheduler from "./pages/scheduler/Scheduler";
import NewScheduler from "./pages/scheduler/NewScheduler";
import EditScheduler from "./pages/scheduler/EditScheduler";
import GlobalVariables from "./pages/vars/GlobalVariables";
import LocalVariables from "./pages/vars/LocalVariables";

const App = () => {
  return (
    <Router>
      <div
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
      >
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scheduler/new" element={<NewScheduler />} />
            <Route path="/scheduler/edit/:id" element={<EditScheduler />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/configuration" element={<Configuration />} />
            <Route
              path="/jobs/:id/local-variables"
              element={<LocalVariables />}
            />
            <Route path="/jobs/:id/run-history" element={<JobRunHistory />} />
            <Route path="/jobs/:id/clone" element={<CloneJob />} />
            <Route path="/jobs/:id/edit" element={<EditJob />} />
            <Route path="/jobs/new" element={<NewJob />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/datasource/:id/edit" element={<EditDataSource />} />
            <Route path="/datasource/new" element={<NewDataSource />} />
            <Route path="/datasource" element={<DataSource />} />
            <Route path="/global-variables" element={<GlobalVariables />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
