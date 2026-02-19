import React from "react";
import PropTypes from "prop-types";
import { Route, Redirect } from "react-router-dom";
import { useAuth } from "context/AuthContext";
import { Loader2 } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <span className="text-muted-foreground text-sm">Loading...</span>
    </div>
  );
}

function ProtectedRoute({ component: Component, ...rest }) {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (loading) {
          return <LoadingScreen />;
        }

        if (!isAuthenticated) {
          return (
            <Redirect
              to={{
                pathname: "/auth/login-page",
                // eslint-disable-next-line react/prop-types
                state: { from: props.location },
              }}
            />
          );
        }

        return <Component {...props} />;
      }}
    />
  );
}

ProtectedRoute.propTypes = {
  component: PropTypes.elementType.isRequired,
};

export default ProtectedRoute;
