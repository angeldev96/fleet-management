import React from "react";
import PropTypes from "prop-types";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "lib/utils";
import { Car, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "components/ui/sheet";
import AdminNavbarLinks from "components/Navbars/AdminNavbarLinks.js";

function SidebarContent({ routes, color, miniActive, logo, logoText, onLinkClick }) {
  const location = useLocation();
  const [collapseState, setCollapseState] = React.useState({});

  React.useEffect(() => {
    const initialState = {};
    routes.forEach((route) => {
      if (route.collapse) {
        initialState[route.state] = route.views?.some(
          (v) => location.pathname === v.layout + v.path
        );
      }
    });
    setCollapseState(initialState);
  }, []);

  const isActive = (routePath) => location.pathname === routePath;

  const toggleCollapse = (stateKey) => {
    setCollapseState((prev) => ({ ...prev, [stateKey]: !prev[stateKey] }));
  };

  const renderLinks = (routeList) => {
    return routeList.map((route, index) => {
      if (route.redirect || route.hide) return null;

      if (route.collapse) {
        const hasActiveChild = route.views?.some(
          (v) => location.pathname === v.layout + v.path
        );
        return (
          <div key={index}>
            <button
              onClick={() => toggleCollapse(route.state)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                hasActiveChild && "text-sidebar-foreground bg-sidebar-accent/50",
              )}
            >
              {route.icon && <route.icon className="h-4 w-4 flex-shrink-0" />}
              {!miniActive && (
                <>
                  <span className="flex-1 text-left">{route.sidebarName || route.name}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform",
                      collapseState[route.state] && "rotate-180",
                    )}
                  />
                </>
              )}
            </button>
            {collapseState[route.state] && !miniActive && (
              <div className="ml-6 mt-1 space-y-1">
                {route.views?.map((view, vIndex) => {
                  if (view.redirect || view.hide) return null;
                  const active = isActive(view.layout + view.path);
                  return (
                    <NavLink
                      key={vIndex}
                      to={view.layout + view.path}
                      onClick={onLinkClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-foreground border-l-[3px] border-primary font-semibold"
                          : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent border-l-[3px] border-transparent",
                      )}
                    >
                      <span className="w-4 text-center text-xs">{view.mini}</span>
                      <span>{view.sidebarName || view.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      const active = isActive(route.layout + route.path);
      return (
        <NavLink
          key={index}
          to={route.layout + route.path}
          onClick={onLinkClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            active
              ? "bg-sidebar-accent text-sidebar-foreground border-l-[3px] border-primary font-semibold"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent border-l-[3px] border-transparent",
          )}
        >
          {route.icon && <route.icon className="h-4 w-4 flex-shrink-0" />}
          {!miniActive && <span>{route.sidebarName || route.name}</span>}
        </NavLink>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo/Brand */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-sidebar-border">
        <NavLink to="/admin/dashboard" className="flex items-center gap-2">
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              className={cn(
                "object-contain",
                miniActive ? "h-6 w-6" : "h-10 max-w-[180px]",
              )}
            />
          ) : (
            <>
              <Car className="h-6 w-6 text-primary" />
              {!miniActive && (
                <span className="text-lg font-bold text-sidebar-foreground">{logoText || "Entry"}</span>
              )}
            </>
          )}
        </NavLink>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {renderLinks(routes)}
      </nav>
    </div>
  );
}

function Sidebar({
  routes,
  logo,
  logoText,
  handleDrawerToggle,
  open,
  color,
  bgColor,
  miniActive: propMiniActive,
}) {
  const [hoverExpanded, setHoverExpanded] = React.useState(false);
  const miniActive = propMiniActive && !hoverExpanded;

  return (
    <>
      {/* Mobile sidebar (Sheet) */}
      <Sheet open={open} onOpenChange={handleDrawerToggle}>
        <SheetContent side="left" className="w-72 p-0 bg-sidebar text-sidebar-foreground" showCloseButton={false}>
          <div className="p-4 border-b border-sidebar-border">
            <AdminNavbarLinks />
          </div>
          <SidebarContent
            routes={routes}
            color={color}
            miniActive={false}
            logo={logo}
            logoText={logoText}
            onLinkClick={handleDrawerToggle}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        onMouseEnter={() => setHoverExpanded(true)}
        onMouseLeave={() => setHoverExpanded(false)}
        className={cn(
          "hidden md:flex flex-col fixed inset-y-0 left-0 z-40 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
          miniActive ? "w-20" : "w-64",
        )}
      >
        <SidebarContent
          routes={routes}
          color={color}
          miniActive={miniActive}
          logo={logo}
          logoText={logoText}
        />
      </aside>
    </>
  );
}

Sidebar.defaultProps = {
  bgColor: "blue",
};

Sidebar.propTypes = {
  bgColor: PropTypes.oneOf(["white", "black", "blue"]),
  color: PropTypes.oneOf(["white", "red", "orange", "green", "blue", "purple", "rose"]),
  logo: PropTypes.string,
  logoText: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object),
  miniActive: PropTypes.bool,
  open: PropTypes.bool,
  handleDrawerToggle: PropTypes.func,
};

export default Sidebar;
