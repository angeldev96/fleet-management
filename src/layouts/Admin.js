import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { cn } from "lib/utils";

import AdminNavbar from "components/Navbars/AdminNavbar.js";
import Sidebar from "components/Sidebar/Sidebar.js";

import routes from "routes.js";

import { useAuth } from "context/AuthContext";
import useRealtimeAlerts from "hooks/useRealtimeAlerts";

export default function Dashboard(props) {
  const { ...rest } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [miniActive, setMiniActive] = React.useState(false);
  const [color] = React.useState("blue");
  const [bgColor] = React.useState("blue");
  const { fleetLogoUrl } = useAuth();
  const logo = fleetLogoUrl || null;

  // Subscribe to physical device connect/disconnect notifications
  useRealtimeAlerts();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
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

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
      if (prop.collapse) {
        return getRoutes(prop.views);
      }
      if (prop.layout === "/admin") {
        return <Route exact path={prop.layout + prop.path} component={prop.component} key={key} />;
      } else {
        return null;
      }
    });
  };

  const sidebarMinimize = () => {
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
        {...rest}
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
          {...rest}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="px-6 py-5 max-w-360 mx-auto w-full">
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
