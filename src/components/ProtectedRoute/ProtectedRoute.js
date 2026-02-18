import React from "react";
import PropTypes from "prop-types";
import { Route, Redirect } from "react-router-dom";
import { useAuth } from "context/AuthContext";

// Loading component
function LoadingScreen() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#1a1a2e",
      }}
    >
      <div
        style={{
          color: "#fff",
          fontSize: "18px",
        }}
      >
        Loading...
      </div>
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
