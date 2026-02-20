import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";

import AuthNavbar from "components/Navbars/AuthNavbar";

import routes from "routes";
import { RouteConfig, AppRoute } from "routes";

import register from "assets/img/register.jpeg";
import login from "assets/img/login.jpeg";

export default function Pages() {
  React.useEffect(() => {
    document.body.style.overflow = "unset";
    return function cleanup() {};
  });

  const getRoutes = (routes: RouteConfig[]): (React.ReactNode | null)[] => {
    return routes.map((prop, key) => {
      if ("views" in prop) {
        return getRoutes(prop.views);
      }
      if (prop.layout === "/auth") {
        return <Route path={prop.layout + prop.path} component={prop.component} key={key} />;
      }
      return null;
    });
  };

  const getBgImage = (): string => {
    if (window.location.pathname.indexOf("/auth/register-page") !== -1) {
      return register;
    }
    return login;
  };

  const getActiveRoute = (routes: RouteConfig[]): string => {
    const activeRoute = "Entry";
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if ("views" in route) {
        const collapseActiveRoute = getActiveRoute(route.views);
        if (collapseActiveRoute !== activeRoute) {
          return collapseActiveRoute;
        }
      } else {
        if (window.location.href.indexOf(route.layout + route.path) !== -1) {
          return route.name;
        }
      }
    }
    return activeRoute;
  };

  return (
    <div className="min-h-screen">
      <AuthNavbar brandText={getActiveRoute(routes)} />
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
