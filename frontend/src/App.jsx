import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Configuration from "./pages/Configuration";
import NotFound from "./pages/NotFound";
import Jobs from "./pages/Jobs";
import DataSource from "./pages/DataSource";
import NewDataSource from "./pages/NewDataSource";

const App = () => {
  return (
    <Router>
      <div>
        <Switch>
          <Route path="/" exact component={Dashboard} />
          <Route path="/configuration" component={Configuration} />
          <Route path="/jobs" component={Jobs} /> {/* Add this route */}
          <Route path="/datasource/new" component={NewDataSource} />
          <Route path="/datasource" component={DataSource} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;
