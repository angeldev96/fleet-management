import { ComponentType, lazy } from "react";
import { LucideIcon } from "lucide-react";

import Overview from "views/Overview/Overview";
import Vehicles from "views/Vehicles/Vehicles";
import VehicleSnapshot from "views/Vehicles/VehicleSnapshot";
import Alerts from "views/Alerts/Alerts";
import Devices from "views/Devices/Devices";
import SettingsPage from "views/Settings/Settings";
import DeviceManagement from "views/Settings/DeviceManagement";
import VehicleDataUpload from "views/Settings/VehicleDataUpload";
import UserManagement from "views/Settings/UserManagement";
import FleetSettings from "views/Settings/FleetSettings";
import ReportsHub from "views/Reports/ReportsHub";
import ServiceCalendar from "views/ServiceCalendar/ServiceCalendar";
import LoginPage from "views/Pages/LoginPage";
import RegisterPage from "views/Pages/RegisterPage";

// Lazy-load heavy components (mapbox-gl ~200KB, jspdf ~80KB)
const LiveMap = lazy(() => import("views/LiveMap/LiveMap"));
const VehicleDetails = lazy(() => import("views/Vehicles/VehicleDetails"));
const VehicleTravelReport = lazy(() => import("views/Vehicles/VehicleTravelReport"));
const FleetReport = lazy(() => import("views/Reports/FleetReport"));

import { Home, MapPin, Car, Bell, Tablet, FileText, CalendarDays, Settings, Image } from "lucide-react";

export interface AppRoute {
  path: string;
  name: string;
  sidebarName?: string;
  icon?: LucideIcon;
  component: ComponentType<any>;
  layout: string;
  hide?: boolean;
  mini?: string;
  collapse?: false;
  redirect?: boolean;
}

export interface CollapsibleRoute {
  collapse: true;
  name: string;
  sidebarName?: string;
  icon?: LucideIcon;
  state: string;
  hide?: boolean;
  views: AppRoute[];
  redirect?: boolean;
}

export type RouteConfig = AppRoute | CollapsibleRoute;

const dashRoutes: RouteConfig[] = [
  {
    path: "/dashboard",
    name: "Overview",
    sidebarName: "Overview",
    icon: Home,
    component: Overview,
    layout: "/admin",
  },
  {
    path: "/live-map",
    name: "Live Map",
    icon: MapPin,
    component: LiveMap,
    layout: "/admin",
  },
  {
    path: "/vehicles",
    name: "Vehicles",
    icon: Car,
    component: Vehicles,
    layout: "/admin",
  },
  {
    path: "/vehicle/:vehicleId/snapshot",
    name: "Vehicle Snapshot",
    component: VehicleSnapshot,
    layout: "/admin",
    hide: true,
  },
  {
    path: "/vehicle/:vehicleId/travel-report",
    name: "Vehicle Travel Report",
    component: VehicleTravelReport,
    layout: "/admin",
    hide: true,
  },
  {
    path: "/vehicle/:vehicleId",
    name: "Vehicle Details",
    component: VehicleDetails,
    layout: "/admin",
    hide: true,
  },
  {
    path: "/alerts",
    name: "Alerts",
    icon: Bell,
    component: Alerts,
    layout: "/admin",
  },
  {
    path: "/devices",
    name: "Devices",
    icon: Tablet,
    component: Devices,
    layout: "/admin",
  },
  {
    path: "/reports/fleet",
    name: "Fleet Report",
    component: FleetReport,
    layout: "/admin",
    hide: true,
  },
  {
    path: "/reports",
    name: "Reports",
    icon: FileText,
    component: ReportsHub,
    layout: "/admin",
  },
  {
    path: "/service-calendar",
    name: "Service Calendar",
    icon: CalendarDays,
    component: ServiceCalendar,
    layout: "/admin",
  },
  {
    path: "/settings/vehicles",
    name: "Vehicle Data Upload",
    component: VehicleDataUpload,
    layout: "/admin",
    hide: true,
  },
  {
    path: "/settings/devices",
    name: "Device Management",
    component: DeviceManagement,
    layout: "/admin",
    hide: true,
  },
  {
    path: "/settings/users",
    name: "User Management",
    component: UserManagement,
    layout: "/admin",
    hide: true,
  },
  {
    path: "/settings/fleet",
    name: "Fleet Settings",
    component: FleetSettings,
    layout: "/admin",
    hide: true,
  },
  {
    path: "/settings",
    name: "Settings",
    icon: Settings,
    component: SettingsPage,
    layout: "/admin",
  },
  {
    collapse: true,
    name: "Pages",
    icon: Image,
    state: "pageCollapse",
    hide: true,
    views: [
      {
        path: "/login-page",
        name: "Entry",
        mini: "L",
        component: LoginPage,
        layout: "/auth",
      },
      {
        path: "/register-page",
        name: "Register",
        mini: "R",
        component: RegisterPage,
        layout: "/auth",
      },
    ],
  },
];

export default dashRoutes;
