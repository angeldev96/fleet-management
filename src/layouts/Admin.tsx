import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { cn } from "lib/utils";

import AdminNavbar from "components/Navbars/AdminNavbar";
import Sidebar from "components/Sidebar/Sidebar";

import routes from "routes";
import { RouteConfig } from "routes";

import { useAuth } from "context/AuthContext";
import useRealtimeAlerts from "hooks/useRealtimeAlerts";

export default function Dashboard() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [miniActive, setMiniActive] = React.useState(false);
  const [color] = React.useState("blue");
  const [bgColor] = React.useState("blue");
  const { fleetLogoUrl } = useAuth();
  const logo = fleetLogoUrl || null;

  // Subscribe to physical device connect/disconnect notifications
  useRealtimeAlerts();

  const handleDrawerToggle = (): void => {
    setMobileOpen(!mobileOpen);
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

  const getRoutes = (routes: RouteConfig[]): (React.ReactNode | null)[] => {
    return routes.map((prop, key) => {
      if ("views" in prop) {
        return getRoutes(prop.views);
      }
      if (prop.layout === "/admin") {
        return <Route exact path={prop.layout + prop.path} component={prop.component} key={key} />;
      }
      return null;
    });
  };

  const sidebarMinimize = (): void => {
    setMiniActive(!miniActive);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        routes={routes}
        logoText={""}
        logo={logo}
        handleDrawerToggle={handleDrawerToggle}
        open={mobileOpen}
        color={color}
        bgColor={bgColor}
        miniActive={miniActive}
      />
      <div
        className={cn(
          "flex-1 flex flex-col min-h-0 transition-all duration-300 ease-out",
          miniActive ? "md:ml-20" : "md:ml-64",
        )}
      >
        <AdminNavbar
          sidebarMinimize={sidebarMinimize}
          miniActive={miniActive}
          brandText={getActiveRoute(routes)}
          handleDrawerToggle={handleDrawerToggle}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="px-4 md:px-6 py-5 max-w-360 mx-auto w-full">
            <Switch>
              {getRoutes(routes)}
              <Redirect from="/admin" to="/admin/dashboard" />
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
}
