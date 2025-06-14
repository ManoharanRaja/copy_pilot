import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Configuration from "./pages/Configuration";
import NotFound from "./pages/NotFound";
import Jobs from "./pages/Jobs";
import DataSource from "./pages/DataSource";
import NewDataSource from "./pages/NewDataSource";
import NewJob from "./pages/NewJob";
import EditJob from "./pages/EditJob";
import JobRunHistory from "./pages/JobRunHistory";
import Scheduler from "./pages/Scheduler";
import NewScheduler from "./pages/NewScheduler";
import EditScheduler from "./pages/EditScheduler";
import GlobalVariables from "./pages/GlobalVariables";

const App = () => {
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/" exact component={Dashboard} />
          <Route path="/scheduler/new" component={NewScheduler} />
          <Route path="/scheduler/edit/:id" component={EditScheduler} />
          <Route path="/scheduler" component={Scheduler} />
          <Route path="/configuration" component={Configuration} />
          <Route path="/jobs/:id/run-history" component={JobRunHistory} />
          <Route path="/jobs/:id/edit" component={EditJob} />
          <Route path="/jobs/new" component={NewJob} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/datasource/new" component={NewDataSource} />
          <Route path="/datasource" component={DataSource} />
          <Route path="/global-variables" component={GlobalVariables} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;
