import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Switch, Redirect } from "react-router-dom";

import { AuthProvider } from "context/AuthContext";
import { NotificationProvider } from "context/NotificationContext";
import ProtectedRoute from "components/ProtectedRoute/ProtectedRoute";

import AuthLayout from "layouts/Auth.js";
import AdminLayout from "layouts/Admin.js";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <Switch>
          <Route path="/auth" component={AuthLayout} />
          <ProtectedRoute path="/admin" component={AdminLayout} />
          <Redirect from="/" to="/admin/dashboard" />
        </Switch>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>,
);
