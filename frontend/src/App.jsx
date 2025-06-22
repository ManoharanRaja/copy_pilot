import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Configuration from "./pages/Configuration";
import NotFound from "./pages/NotFound";
import DataSource from "./pages/datasource/DataSource";
import NewDataSource from "./pages/datasource/NewDataSource";
import EditDataSource from "./pages/datasource/EditDataSource";
import Jobs from "./pages/jobs/Jobs";
import NewJob from "./pages/jobs/NewJob";
import EditJob from "./pages/jobs/EditJob";
import JobRunHistory from "./pages/jobs/JobRunHistory";
import Scheduler from "./pages/scheduler/Scheduler";
import NewScheduler from "./pages/scheduler/NewScheduler";
import EditScheduler from "./pages/scheduler/EditScheduler";
import GlobalVariables from "./pages/vars/GlobalVariables";
import LocalVariables from "./pages/vars/LocalVariables";

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
          <Route path="/jobs/:id/local-variables" component={LocalVariables} />
          <Route path="/jobs/:id/run-history" component={JobRunHistory} />
          <Route path="/jobs/:id/edit" component={EditJob} />
          <Route path="/jobs/new" component={NewJob} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/datasource/:id/edit" component={EditDataSource} />
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
