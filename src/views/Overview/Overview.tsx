import React, { lazy, Suspense } from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import {
  Car,
  AlertTriangle,
  CircleAlert,
  Info,
  Bell,
  Gauge,
  CheckCircle,
  Map,
  Smartphone,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer";
import GridItem from "components/Grid/GridItem";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
const MapPreview = lazy(() => import("components/MapPreview/MapPreview"));

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

  const getEventLabel = (eventType: string, eventData: any) => {
    if (eventType === "dtc_detected" && eventData?.dtc_code) {
      return `Engine Fault Code ${eventData.dtc_code}`;
    }
    return (EVENT_LABELS as any)[eventType] || eventType;
  };

  const activePercentage = (stats.totalVehicles ?? 0) > 0
    ? Math.round((stats.vehiclesActive / (stats.totalVehicles ?? 1)) * 100)
    : 0;

  const quickActions = [
    {
      title: "Live Map",
      desc: "Track all vehicles in real-time",
      icon: Map,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-500/10",
      path: "/admin/live-map",
    },
    {
      title: "Vehicles",
      desc: "Manage your fleet vehicles",
      icon: Car,
      colorClass: "text-emerald-600",
      bgClass: "bg-emerald-500/10",
      path: "/admin/vehicles",
    },
    {
      title: "Alerts",
      desc: "View all alerts and events",
      icon: Bell,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-500/10",
      path: "/admin/alerts",
    },
    {
      title: "Devices",
      desc: "Manage GPS devices",
      icon: Smartphone,
      colorClass: "text-violet-600",
      bgClass: "bg-violet-500/10",
      path: "/admin/devices",
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground m-0 mb-1 tracking-[-0.02em]">{getGreeting()}</h1>
        <p className="text-sm text-muted-foreground/70 m-0 flex items-center gap-2.5">
          Your fleet status at a glance
          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </p>
      </div>

      {/* Stat Cards */}
      <GridContainer>
        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className="rounded-xl border-border/50 overflow-hidden cursor-pointer hover:-translate-y-px"
            onClick={() => history.push("/admin/vehicles?filter=active")}
          >
            <CardBody className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10">
                  <Car className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                {stats.vehiclesActive > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-600 tracking-wide">Active</span>
                )}
              </div>
              <div className="text-3xl font-bold text-foreground leading-none mb-0.5 tabular-nums tracking-[-0.02em]">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /> : stats.vehiclesActive}
              </div>
              <div className="text-xs text-muted-foreground/70 font-medium mt-1">Vehicles Active</div>
              <div className="mt-3.5">
                <div className="flex justify-between text-[11px] text-muted-foreground/60 mb-1">
                  <span>Fleet utilization</span>
                  <span className="font-medium tabular-nums">{activePercentage}%</span>
                </div>
                <div className="h-1 rounded-full bg-border/50">
                  <div
                    className="h-1 rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${activePercentage}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className="rounded-xl border-border/50 overflow-hidden cursor-pointer hover:-translate-y-px"
            onClick={() => history.push("/admin/vehicles?filter=issues")}
          >
            <CardBody className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
                </div>
                {stats.vehiclesWithIssues > 0 && (
                  <span className="text-[11px] font-semibold text-red-600 tracking-wide">Issues</span>
                )}
              </div>
              <div className="text-3xl font-bold text-foreground leading-none mb-0.5 tabular-nums tracking-[-0.02em]">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /> : stats.vehiclesWithIssues}
              </div>
              <div className="text-xs text-muted-foreground/70 font-medium mt-1">Vehicles With Issues</div>
              <div className="mt-3.5">
                <div className="flex justify-between text-[11px] text-muted-foreground/60 mb-1">
                  <span>Health status</span>
                  <span className="font-medium tabular-nums">{(stats.totalVehicles ?? 0) - stats.vehiclesWithIssues} healthy</span>
                </div>
                <div className="h-1 rounded-full bg-border/50">
                  <div
                    className="h-1 rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(stats.totalVehicles ?? 0) > 0 ? (((stats.totalVehicles ?? 0) - stats.vehiclesWithIssues) / (stats.totalVehicles ?? 1)) * 100 : 100}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className="rounded-xl border-border/50 overflow-hidden cursor-pointer hover:-translate-y-px"
            onClick={() => history.push("/admin/alerts?time=Today")}
          >
            <CardBody className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10">
                  <Bell className="h-4.5 w-4.5 text-amber-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground leading-none mb-0.5 tabular-nums tracking-[-0.02em]">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /> : stats.alertsToday}
              </div>
              <div className="text-xs text-muted-foreground/70 font-medium mt-1">Alerts Today</div>
              <div className="mt-3.5">
                <div className="flex justify-between text-[11px] text-muted-foreground/60 mb-1">
                  <span>Today</span>
                  <span className="font-medium">All severities</span>
                </div>
                <div className="h-1 rounded-full bg-border/50">
                  <div
                    className="h-1 rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${Math.min(stats.alertsToday * 5, 100)}%` }}
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className="rounded-xl border-border/50 overflow-hidden cursor-pointer hover:-translate-y-px"
            onClick={() => history.push("/admin/alerts?filter=Driving%20Events&time=Today")}
          >
            <CardBody className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-500/10">
                  <Gauge className="h-4.5 w-4.5 text-violet-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground leading-none mb-0.5 tabular-nums tracking-[-0.02em]">
                {statsLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" /> : stats.harshEvents}
              </div>
              <div className="text-xs text-muted-foreground/70 font-medium mt-1">Harsh Events Today</div>
              <div className="mt-3.5">
                <div className="flex justify-between text-[11px] text-muted-foreground/60 mb-1">
                  <span>Driving behavior</span>
                  <span className="font-medium">{stats.harshEvents === 0 ? "Excellent" : stats.harshEvents < 5 ? "Good" : "Needs attention"}</span>
                </div>
                <div className="h-1 rounded-full bg-border/50">
                  <div
                    className="h-1 rounded-full bg-violet-500 transition-all duration-500"
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
          <Card className="rounded-xl border-border/50 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <h3 className="text-sm font-semibold text-foreground m-0 flex items-center gap-2">
                <Map className="h-4 w-4 text-muted-foreground" />
                Fleet Location
              </h3>
              <button
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground cursor-pointer px-3 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-all duration-150"
                onClick={() => history.push("/admin/live-map")}
              >
                Open Full Map
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="w-full h-[400px] relative">
              <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                <MapPreview />
              </Suspense>
            </div>
          </Card>
        </GridItem>

        <GridItem xs={12} lg={4}>
          <Card className="rounded-xl border-border/50 h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
              <h3 className="text-sm font-semibold text-foreground m-0 flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                Recent Alerts
                {alerts.length > 0 && (
                  <span className="bg-red-500/10 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                    {alerts.length}
                  </span>
                )}
              </h3>
              <button
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground cursor-pointer px-3 py-1.5 rounded-lg hover:bg-muted hover:text-foreground transition-all duration-150"
                onClick={() => history.push("/admin/alerts")}
              >
                View All
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="p-0 max-h-[340px] overflow-y-auto">
              {alertsLoading ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <CheckCircle className="h-8 w-8 mb-2.5 text-muted-foreground/30" />
                  <span className="text-sm font-medium text-muted-foreground/60">No recent alerts</span>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start px-5 py-3.5 border-b border-border/20 transition-colors duration-150 cursor-pointer hover:bg-muted/50 last:border-b-0"
                    onClick={() => history.push(`/admin/vehicle/${alert.vehicle_id}`)}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center mr-3 shrink-0",
                        alert.severity === "critical" ? "bg-red-500/10" : alert.severity === "info" ? "bg-blue-500/10" : "bg-amber-500/10"
                      )}
                    >
                      {alert.severity === "critical" ? (
                        <CircleAlert className="h-4 w-4 text-red-600" />
                      ) : alert.severity === "info" ? (
                        <Info className="h-4 w-4 text-blue-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground m-0 mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                        {alert.vehicles?.name || "Unknown Vehicle"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 m-0 mb-1">
                        {getEventLabel(alert.event_type, alert.event_data)}
                      </p>
                      <span className="text-[11px] text-muted-foreground/50 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
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
        <h3 className="text-sm font-semibold text-foreground m-0 mb-4 tracking-[-0.01em]">Quick Actions</h3>
        <GridContainer>
          {quickActions.map((action) => (
            <GridItem xs={12} sm={6} md={3} key={action.title}>
              <Card
                className="rounded-xl border-border/40 shadow-none cursor-pointer transition-all duration-200 hover:bg-muted/50 hover:shadow-(--shadow-card) group"
                onClick={() => history.push(action.path)}
              >
                <CardBody className="p-4 flex items-center gap-3.5">
                  <div
                    className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", action.bgClass)}
                  >
                    <action.icon className={cn("h-4 w-4", action.colorClass)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-foreground m-0">{action.title}</h4>
                    <p className="text-xs text-muted-foreground/60 m-0 mt-0.5">{action.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
                </CardBody>
              </Card>
            </GridItem>
          ))}
        </GridContainer>
      </div>
    </div>
  );
}
