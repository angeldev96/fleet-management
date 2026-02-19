import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";

import AuthNavbar from "components/Navbars/AuthNavbar.js";

import routes from "routes.js";

import register from "assets/img/register.jpeg";
import login from "assets/img/login.jpeg";

export default function Pages(props) {
  const { ...rest } = props;

  React.useEffect(() => {
    document.body.style.overflow = "unset";
    return function cleanup() {};
  });

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.collapse) {
        return getRoutes(prop.views);
      }
      if (prop.layout === "/auth") {
        return <Route path={prop.layout + prop.path} component={prop.component} key={key} />;
      } else {
        return null;
      }
    });
  };

  const getBgImage = () => {
    if (window.location.pathname.indexOf("/auth/register-page") !== -1) {
      return register;
    }
    return login;
  };

  const getActiveRoute = (routes) => {
    let activeRoute = "Entry";
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].collapse) {
        let collapseActiveRoute = getActiveRoute(routes[i].views);
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute;
        }
      } else {
        if (window.location.href.indexOf(routes[i].layout + routes[i].path) !== -1) {
          return routes[i].name;
        }
      }
    }
    return activeRoute;
  };

  return (
    <div className="min-h-screen">
      <AuthNavbar brandText={getActiveRoute(routes)} {...rest} />
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(" + getBgImage() + ")" }}
      >
        <div className="absolute inset-0 bg-linear-to-br from-black/70 via-black/50 to-primary/30 backdrop-blur-xs" />
        <div className="relative z-10 w-full">
          <Switch>
            {getRoutes(routes)}
            <Redirect from="/auth" to="/auth/login-page" />
          </Switch>
        </div>
      </div>
    </div>
  );
}
