import React from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import {
  Car,
  AlertTriangle,
  CircleAlert,
  Info,
  Bell,
  Gauge,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Map,
  Smartphone,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import MapPreview from "components/MapPreview/MapPreview.js";

// hooks
import { useStats } from "hooks/useStats";
import { useRecentAlerts } from "hooks/useEvents";

// utils
import { EVENT_LABELS, formatRelativeTime } from "types/database";
import { cn } from "lib/utils";

export default function Overview() {
  const history = useHistory();

  // Fetch real data from Supabase
  const { stats, loading: statsLoading } = useStats({ refreshInterval: 30000 });
  const { alerts, loading: alertsLoading } = useRecentAlerts({
    limit: 5,
    refreshInterval: 30000,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getEventLabel = (eventType, eventData) => {
    if (eventType === "dtc_detected" && eventData?.dtc_code) {
      return `Engine Fault Code ${eventData.dtc_code}`;
    }
    return EVENT_LABELS[eventType] || eventType;
  };

  const activePercentage = stats.totalVehicles > 0
    ? Math.round((stats.vehiclesActive / stats.totalVehicles) * 100)
    : 0;

  const quickActions = [
    {
      title: "Live Map",
      desc: "Track all vehicles in real-time",
      icon: Map,
      colorClass: "text-blue-500",
      bgClass: "bg-blue-50",
      path: "/admin/live-map",
    },
    {
      title: "Vehicles",
      desc: "Manage your fleet vehicles",
      icon: Car,
      colorClass: "text-emerald-500",
      bgClass: "bg-emerald-50",
      path: "/admin/vehicles",
    },
    {
      title: "Alerts",
      desc: "View all alerts and events",
      icon: Bell,
      colorClass: "text-amber-500",
      bgClass: "bg-amber-50",
      path: "/admin/alerts",
    },
    {
      title: "Devices",
      desc: "Manage GPS devices",
      icon: Smartphone,
      colorClass: "text-violet-500",
      bgClass: "bg-violet-50",
      path: "/admin/devices",
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground m-0 mb-2">{getGreeting()}</h1>
        <p className="text-sm text-muted-foreground m-0 flex items-center gap-3">
          Your fleet status at a glance
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </p>
      </div>

      {/* Stat Cards */}
      <GridContainer>
        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className="rounded-2xl border border-border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            onClick={() => history.push("/admin/vehicles?filter=active")}
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500">
                  <Car className="h-6 w-6 text-white" />
                </div>
                {stats.vehiclesActive > 0 && (
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Active
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold text-foreground leading-tight mb-1">
                {statsLoading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : stats.vehiclesActive}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Vehicles Active</div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Fleet utilization</span>
                  <span>{activePercentage}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${activePercentage}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className="rounded-2xl border border-border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            onClick={() => history.push("/admin/vehicles?filter=issues")}
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500">
                  <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                {stats.vehiclesWithIssues > 0 && (
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-red-50 text-red-600">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Issues
                  </div>
                )}
              </div>
              <div className="text-4xl font-bold text-foreground leading-tight mb-1">
                {statsLoading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : stats.vehiclesWithIssues}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Vehicles With Issues</div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Health status</span>
                  <span>{stats.totalVehicles - stats.vehiclesWithIssues} healthy</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${stats.totalVehicles > 0 ? ((stats.totalVehicles - stats.vehiclesWithIssues) / stats.totalVehicles) * 100 : 100}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className="rounded-2xl border border-border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            onClick={() => history.push("/admin/alerts?time=Today")}
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-500">
                  <Bell className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-foreground leading-tight mb-1">
                {statsLoading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : stats.alertsToday}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Alerts Today</div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Today</span>
                  <span>All severities</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(stats.alertsToday * 5, 100)}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className="rounded-2xl border border-border shadow-sm transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5"
            onClick={() => history.push("/admin/alerts?filter=Driving%20Events&time=Today")}
          >
            <CardBody className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-500">
                  <Gauge className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold text-foreground leading-tight mb-1">
                {statsLoading ? <Loader2 className="h-7 w-7 animate-spin text-primary" /> : stats.harshEvents}
              </div>
              <div className="text-sm text-muted-foreground font-medium">Harsh Events Today</div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                  <span>Driving behavior</span>
                  <span>{stats.harshEvents === 0 ? "Excellent" : stats.harshEvents < 5 ? "Good" : "Needs attention"}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-violet-500 transition-all duration-300"
                    style={{ width: `${Math.max(100 - (stats.harshEvents * 10), 0)}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      {/* Map and Alerts Section */}
      <GridContainer>
        <GridItem xs={12} lg={8}>
          <Card className="rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
              <h3 className="text-lg font-semibold text-foreground m-0 flex items-center gap-2.5">
                <Map className="h-[22px] w-[22px] text-primary" />
                Fleet Location
              </h3>
              <button
                className="flex items-center gap-1 text-primary text-sm font-semibold cursor-pointer px-4 py-2 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted hover:border-border"
                onClick={() => history.push("/admin/live-map")}
              >
                Open Full Map
                <ChevronRight className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="w-full h-[400px] relative">
              <MapPreview />
            </div>
          </Card>
        </GridItem>

        <GridItem xs={12} lg={4}>
          <Card className="rounded-2xl border border-border shadow-sm h-full">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
              <h3 className="text-lg font-semibold text-foreground m-0 flex items-center gap-2.5">
                <Bell className="h-[22px] w-[22px] text-amber-500" />
                Recent Alerts
                {alerts.length > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-[10px]">
                    {alerts.length}
                  </span>
                )}
              </h3>
              <button
                className="flex items-center gap-1 text-primary text-sm font-semibold cursor-pointer px-4 py-2 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted hover:border-border"
                onClick={() => history.push("/admin/alerts")}
              >
                View All
                <ChevronRight className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="p-0 max-h-[340px] overflow-y-auto">
              {alertsLoading ? (
                <div className="flex justify-center items-center p-[60px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mb-3 text-muted-foreground" />
                  <span className="text-sm font-medium">No recent alerts</span>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start px-6 py-4 border-b border-border/30 transition-colors duration-150 cursor-pointer hover:bg-muted/50 last:border-b-0"
                    onClick={() => history.push(`/admin/vehicle/${alert.vehicle_id}`)}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-[10px] flex items-center justify-center mr-3.5 shrink-0",
                        alert.severity === "critical" ? "bg-red-50" : alert.severity === "info" ? "bg-blue-50" : "bg-amber-50"
                      )}
                    >
                      {alert.severity === "critical" ? (
                        <CircleAlert className="h-5 w-5 text-red-600" />
                      ) : alert.severity === "info" ? (
                        <Info className="h-5 w-5 text-blue-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground m-0 mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        {alert.vehicles?.name || "Unknown Vehicle"}
                      </p>
                      <p className="text-sm text-muted-foreground m-0 mb-1.5">
                        {getEventLabel(alert.event_type, alert.event_data)}
                      </p>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatRelativeTime(alert.event_at)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </GridItem>
      </GridContainer>

      {/* Quick Actions */}
      <div className="mt-2">
        <h3 className="text-lg font-semibold text-foreground m-0 mb-4">Quick Actions</h3>
        <GridContainer>
          {quickActions.map((action) => (
            <GridItem xs={12} sm={6} md={3} key={action.title}>
              <Card
                className="rounded-xl border border-border shadow-sm cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                onClick={() => history.push(action.path)}
              >
                <CardBody className="p-5 flex items-center gap-4">
                  <div
                    className={cn("w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0", action.bgClass)}
                  >
                    <action.icon className={cn("h-[22px] w-[22px]", action.colorClass)} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-foreground m-0 mb-1">{action.title}</h4>
                    <p className="text-sm text-muted-foreground m-0">{action.desc}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardBody>
              </Card>
            </GridItem>
          ))}
        </GridContainer>
      </div>
    </div>
  );
}
