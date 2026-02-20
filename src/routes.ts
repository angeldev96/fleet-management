import Overview from "views/Overview/Overview.js";
import LiveMap from "views/LiveMap/LiveMap.js";
import Vehicles from "views/Vehicles/Vehicles.js";
import VehicleDetails from "views/Vehicles/VehicleDetails.js";
import VehicleSnapshot from "views/Vehicles/VehicleSnapshot.js";
import VehicleTravelReport from "views/Vehicles/VehicleTravelReport.js";
import Alerts from "views/Alerts/Alerts.js";
import Devices from "views/Devices/Devices.js";
import SettingsPage from "views/Settings/Settings.js";
import DeviceManagement from "views/Settings/DeviceManagement.js";
import VehicleDataUpload from "views/Settings/VehicleDataUpload.js";
import UserManagement from "views/Settings/UserManagement.js";
import FleetSettings from "views/Settings/FleetSettings.js";
import ReportsHub from "views/Reports/ReportsHub.js";
import FleetReport from "views/Reports/FleetReport.js";
import ServiceCalendar from "views/ServiceCalendar/ServiceCalendar.js";
import LoginPage from "views/Pages/LoginPage.js";
import RegisterPage from "views/Pages/RegisterPage.js";

import {
  Home,
  MapPin,
  Car,
  Bell,
  Tablet,
  FileText,
  CalendarDays,
  Settings,
  Image,
} from "lucide-react";

var dashRoutes = [
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
