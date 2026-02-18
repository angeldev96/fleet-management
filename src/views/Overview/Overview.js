import React from "react";
import { useHistory } from "react-router-dom";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import LinearProgress from "@material-ui/core/LinearProgress";

// @material-ui/icons
import DirectionsCar from "@material-ui/icons/DirectionsCar";
import Warning from "@material-ui/icons/Warning";
import Error from "@material-ui/icons/Error";
import Info from "@material-ui/icons/Info";
import NotificationsActive from "@material-ui/icons/NotificationsActive";
import Speed from "@material-ui/icons/Speed";
import TrendingUp from "@material-ui/icons/TrendingUp";
import TrendingDown from "@material-ui/icons/TrendingDown";
import CheckCircle from "@material-ui/icons/CheckCircle";
import Map from "@material-ui/icons/Map";
import DevicesOther from "@material-ui/icons/DevicesOther";
import ChevronRight from "@material-ui/icons/ChevronRight";
import AccessTime from "@material-ui/icons/AccessTime";

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

const useStyles = makeStyles(() => ({
  // Page Header
  pageHeader: {
    marginBottom: "32px",
  },
  greeting: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1F2937",
    margin: "0 0 8px 0",
  },
  subGreeting: {
    fontSize: "15px",
    color: "#6B7280",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  liveIndicator: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#ECFDF5",
    color: "#059669",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
  },
  liveDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#10B981",
    animation: "$pulse 2s infinite",
  },
  "@keyframes pulse": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.5 },
    "100%": { opacity: 1 },
  },

  // Stat Cards
  statCard: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease",
    overflow: "hidden",
    cursor: "pointer",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      transform: "translateY(-2px)",
    },
  },
  statCardBody: {
    padding: "24px !important",
  },
  statCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  statIconContainer: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statIcon: {
    fontSize: "24px",
    color: "#FFFFFF",
  },
  statTrend: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    fontWeight: "600",
    padding: "4px 8px",
    borderRadius: "6px",
  },
  trendUp: {
    backgroundColor: "#ECFDF5",
    color: "#059669",
  },
  trendDown: {
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
  },
  statValue: {
    fontSize: "36px",
    fontWeight: "700",
    color: "#1F2937",
    lineHeight: 1.2,
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "14px",
    color: "#6B7280",
    fontWeight: "500",
  },
  statProgress: {
    marginTop: "16px",
  },
  progressLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
    color: "#9CA3AF",
    marginBottom: "6px",
  },
  progressBar: {
    height: "6px",
    borderRadius: "3px",
    backgroundColor: "#F3F4F6",
  },
  progressBarFill: {
    borderRadius: "3px",
  },

  // Map Section
  mapCard: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
  },
  mapHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #F3F4F6",
  },
  mapTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1F2937",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  mapTitleIcon: {
    color: "#3E4D6C",
    fontSize: "22px",
  },
  viewAllBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: "#3E4D6C",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "8px",
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#F3F4F6",
      borderColor: "#D1D5DB",
    },
  },
  mapContainer: {
    width: "100%",
    height: "400px",
    position: "relative",
  },

  // Alerts Section
  alertsCard: {
    borderRadius: "16px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    height: "100%",
  },
  alertsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #F3F4F6",
  },
  alertsTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1F2937",
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  alertsBadge: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    fontSize: "12px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  alertsList: {
    padding: "0",
    maxHeight: "340px",
    overflowY: "auto",
  },
  alertItem: {
    display: "flex",
    alignItems: "flex-start",
    padding: "16px 24px",
    borderBottom: "1px solid #F9FAFB",
    transition: "background-color 0.15s ease",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#F9FAFB",
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },
  alertIconBox: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "14px",
    flexShrink: 0,
  },
  alertIconCritical: {
    backgroundColor: "#FEE2E2",
  },
  alertIconWarning: {
    backgroundColor: "#FEF3C7",
  },
  alertContent: {
    flex: 1,
    minWidth: 0,
  },
  alertVehicle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 4px 0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  alertType: {
    fontSize: "13px",
    color: "#6B7280",
    margin: "0 0 6px 0",
  },
  alertTime: {
    fontSize: "12px",
    color: "#9CA3AF",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  emptyAlerts: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    color: "#9CA3AF",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    color: "#D1D5DB",
  },
  emptyText: {
    fontSize: "14px",
    fontWeight: "500",
  },

  // Quick Actions
  quickActionsSection: {
    marginTop: "8px",
  },
  quickActionsTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 16px 0",
  },
  quickActionCard: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#3E4D6C",
      boxShadow: "0 4px 12px rgba(62, 77, 108, 0.15)",
      transform: "translateY(-2px)",
    },
  },
  quickActionBody: {
    padding: "20px !important",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  quickActionIcon: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1F2937",
    margin: "0 0 4px 0",
  },
  quickActionDesc: {
    fontSize: "13px",
    color: "#6B7280",
    margin: 0,
  },
  quickActionArrow: {
    color: "#9CA3AF",
    fontSize: "20px",
  },

  // Loading
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px",
  },
}));

export default function Overview() {
  const classes = useStyles();
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
      color: "#3B82F6",
      bgColor: "#EFF6FF",
      path: "/admin/live-map",
    },
    {
      title: "Vehicles",
      desc: "Manage your fleet vehicles",
      icon: DirectionsCar,
      color: "#10B981",
      bgColor: "#ECFDF5",
      path: "/admin/vehicles",
    },
    {
      title: "Alerts",
      desc: "View all alerts and events",
      icon: NotificationsActive,
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      path: "/admin/alerts",
    },
    {
      title: "Devices",
      desc: "Manage GPS devices",
      icon: DevicesOther,
      color: "#8B5CF6",
      bgColor: "#F5F3FF",
      path: "/admin/devices",
    },
  ];

  return (
    <div>
      {/* Page Header */}
      <div className={classes.pageHeader}>
        <h1 className={classes.greeting}>{getGreeting()}</h1>
        <p className={classes.subGreeting}>
          Your fleet status at a glance
          <span className={classes.liveIndicator}>
            <span className={classes.liveDot} />
            Live
          </span>
        </p>
      </div>

      {/* Stat Cards */}
      <GridContainer spacing={3}>
        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className={classes.statCard}
            onClick={() => history.push("/admin/vehicles?filter=active")}
          >
            <CardBody className={classes.statCardBody}>
              <div className={classes.statCardHeader}>
                <div className={classes.statIconContainer} style={{ backgroundColor: "#10B981" }}>
                  <DirectionsCar className={classes.statIcon} />
                </div>
                {stats.vehiclesActive > 0 && (
                  <div className={`${classes.statTrend} ${classes.trendUp}`}>
                    <TrendingUp style={{ fontSize: "14px" }} />
                    Active
                  </div>
                )}
              </div>
              <div className={classes.statValue}>
                {statsLoading ? <CircularProgress size={28} /> : stats.vehiclesActive}
              </div>
              <div className={classes.statLabel}>Vehicles Active</div>
              <div className={classes.statProgress}>
                <div className={classes.progressLabel}>
                  <span>Fleet utilization</span>
                  <span>{activePercentage}%</span>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={activePercentage}
                  className={classes.progressBar}
                  classes={{ bar: classes.progressBarFill }}
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className={classes.statCard}
            onClick={() => history.push("/admin/vehicles?filter=issues")}
          >
            <CardBody className={classes.statCardBody}>
              <div className={classes.statCardHeader}>
                <div className={classes.statIconContainer} style={{ backgroundColor: "#EF4444" }}>
                  <Warning className={classes.statIcon} />
                </div>
                {stats.vehiclesWithIssues > 0 && (
                  <div className={`${classes.statTrend} ${classes.trendDown}`}>
                    <TrendingDown style={{ fontSize: "14px" }} />
                    Issues
                  </div>
                )}
              </div>
              <div className={classes.statValue}>
                {statsLoading ? <CircularProgress size={28} /> : stats.vehiclesWithIssues}
              </div>
              <div className={classes.statLabel}>Vehicles With Issues</div>
              <div className={classes.statProgress}>
                <div className={classes.progressLabel}>
                  <span>Health status</span>
                  <span>{stats.totalVehicles - stats.vehiclesWithIssues} healthy</span>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={stats.totalVehicles > 0 ? ((stats.totalVehicles - stats.vehiclesWithIssues) / stats.totalVehicles) * 100 : 100}
                  className={classes.progressBar}
                  classes={{ bar: classes.progressBarFill }}
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className={classes.statCard}
            onClick={() => history.push("/admin/alerts?time=Today")}
          >
            <CardBody className={classes.statCardBody}>
              <div className={classes.statCardHeader}>
                <div className={classes.statIconContainer} style={{ backgroundColor: "#F59E0B" }}>
                  <NotificationsActive className={classes.statIcon} />
                </div>
              </div>
              <div className={classes.statValue}>
                {statsLoading ? <CircularProgress size={28} /> : stats.alertsToday}
              </div>
              <div className={classes.statLabel}>Alerts Today</div>
              <div className={classes.statProgress}>
                <div className={classes.progressLabel}>
                  <span>Today</span>
                  <span>All severities</span>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(stats.alertsToday * 5, 100)}
                  className={classes.progressBar}
                  classes={{ bar: classes.progressBarFill }}
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} lg={3}>
          <Card
            className={classes.statCard}
            onClick={() => history.push("/admin/alerts?filter=Driving%20Events&time=Today")}
          >
            <CardBody className={classes.statCardBody}>
              <div className={classes.statCardHeader}>
                <div className={classes.statIconContainer} style={{ backgroundColor: "#8B5CF6" }}>
                  <Speed className={classes.statIcon} />
                </div>
              </div>
              <div className={classes.statValue}>
                {statsLoading ? <CircularProgress size={28} /> : stats.harshEvents}
              </div>
              <div className={classes.statLabel}>Harsh Events Today</div>
              <div className={classes.statProgress}>
                <div className={classes.progressLabel}>
                  <span>Driving behavior</span>
                  <span>{stats.harshEvents === 0 ? "Excellent" : stats.harshEvents < 5 ? "Good" : "Needs attention"}</span>
                </div>
                <LinearProgress
                  variant="determinate"
                  value={Math.max(100 - (stats.harshEvents * 10), 0)}
                  className={classes.progressBar}
                  classes={{ bar: classes.progressBarFill }}
                  style={{ backgroundColor: "#E5E7EB" }}
                />
              </div>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      {/* Map and Alerts Section */}
      <GridContainer spacing={3} style={{ marginTop: "8px" }}>
        <GridItem xs={12} lg={8}>
          <Card className={classes.mapCard}>
            <div className={classes.mapHeader}>
              <h3 className={classes.mapTitle}>
                <Map className={classes.mapTitleIcon} />
                Fleet Location
              </h3>
              <div className={classes.viewAllBtn} onClick={() => history.push("/admin/live-map")}>
                Open Full Map
                <ChevronRight style={{ fontSize: "18px" }} />
              </div>
            </div>
            <div className={classes.mapContainer}>
              <MapPreview />
            </div>
          </Card>
        </GridItem>

        <GridItem xs={12} lg={4}>
          <Card className={classes.alertsCard}>
            <div className={classes.alertsHeader}>
              <h3 className={classes.alertsTitle}>
                <NotificationsActive style={{ color: "#F59E0B", fontSize: "22px" }} />
                Recent Alerts
                {alerts.length > 0 && (
                  <span className={classes.alertsBadge}>{alerts.length}</span>
                )}
              </h3>
              <div className={classes.viewAllBtn} onClick={() => history.push("/admin/alerts")}>
                View All
                <ChevronRight style={{ fontSize: "18px" }} />
              </div>
            </div>
            <div className={classes.alertsList}>
              {alertsLoading ? (
                <div className={classes.loadingContainer}>
                  <CircularProgress size={32} />
                </div>
              ) : alerts.length === 0 ? (
                <div className={classes.emptyAlerts}>
                  <CheckCircle className={classes.emptyIcon} />
                  <span className={classes.emptyText}>No recent alerts</span>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={classes.alertItem}
                    onClick={() => history.push(`/admin/vehicle/${alert.vehicle_id}`)}
                  >
                    <div
                      className={`${classes.alertIconBox} ${
                        alert.severity === "critical"
                          ? classes.alertIconCritical
                          : classes.alertIconWarning
                      }`}
                      style={{
                        backgroundColor:
                          alert.severity === "critical"
                            ? "#FEE2E2"
                            : alert.severity === "info"
                            ? "#DBEAFE"
                            : "#FEF3C7",
                      }}
                    >
                      {alert.severity === "critical" ? (
                        <Error style={{ color: "#DC2626", fontSize: "20px" }} />
                      ) : alert.severity === "info" ? (
                        <Info style={{ color: "#2563EB", fontSize: "20px" }} />
                      ) : (
                        <Warning style={{ color: "#D97706", fontSize: "20px" }} />
                      )}
                    </div>
                    <div className={classes.alertContent}>
                      <p className={classes.alertVehicle}>
                        {alert.vehicles?.name || "Unknown Vehicle"}
                      </p>
                      <p className={classes.alertType}>
                        {getEventLabel(alert.event_type, alert.event_data)}
                      </p>
                      <span className={classes.alertTime}>
                        <AccessTime style={{ fontSize: "14px" }} />
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
      <div className={classes.quickActionsSection}>
        <h3 className={classes.quickActionsTitle}>Quick Actions</h3>
        <GridContainer spacing={2}>
          {quickActions.map((action) => (
            <GridItem xs={12} sm={6} md={3} key={action.title}>
              <Card className={classes.quickActionCard} onClick={() => history.push(action.path)}>
                <CardBody className={classes.quickActionBody}>
                  <div
                    className={classes.quickActionIcon}
                    style={{ backgroundColor: action.bgColor }}
                  >
                    <action.icon style={{ color: action.color, fontSize: "22px" }} />
                  </div>
                  <div className={classes.quickActionContent}>
                    <h4 className={classes.quickActionTitle}>{action.title}</h4>
                    <p className={classes.quickActionDesc}>{action.desc}</p>
                  </div>
                  <ChevronRight className={classes.quickActionArrow} />
                </CardBody>
              </Card>
            </GridItem>
          ))}
        </GridContainer>
      </div>
    </div>
  );
}
