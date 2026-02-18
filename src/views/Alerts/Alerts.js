import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useLocation } from "react-router-dom";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import CircularProgress from "@material-ui/core/CircularProgress";

// @material-ui/icons
import Warning from "@material-ui/icons/Warning";
import Error from "@material-ui/icons/Error";
import Info from "@material-ui/icons/Info";
import MoreHoriz from "@material-ui/icons/MoreHoriz";
import PlayArrow from "@material-ui/icons/PlayArrow";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Button from "components/CustomButtons/Button.js";

// hooks
import { useEvents } from "hooks/useEvents";

// utils
import { EVENT_LABELS, PID_LABELS, formatDateTime } from "types/database";

import styles from "assets/jss/material-dashboard-pro-react/views/dashboardStyle.js";

const useStyles = makeStyles(() => ({
  ...styles,
  filterButton: {
    marginRight: "10px",
    textTransform: "none",
    fontWeight: "500",
    padding: "8px 20px",
    borderRadius: "8px",
  },
  activeFilter: {
    backgroundColor: "#3E4D6C !important",
    color: "#FFFFFF !important",
  },
  inactiveFilter: {
    backgroundColor: "#E0E4E8 !important",
    color: "#3E4D6C !important",
  },
  timeSelect: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    padding: "2px 10px",
    border: "1px solid #E0E4E8",
    "&:before": { border: "none" },
    "&:after": { border: "none" },
    "&:hover:not(.Mui-disabled):before": { border: "none" },
  },
  alertCard: {
    marginBottom: "20px",
    boxShadow: "0 2px 12px 0 rgba(0,0,0,0.05)",
  },
  alertHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "15px 20px",
  },
  alertIconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "15px",
  },
  alertTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
    margin: "0",
  },
  alertVehicle: {
    fontSize: "16px",
    color: "#333",
    fontWeight: "500",
    margin: "5px 0",
  },
  alertTime: {
    fontSize: "14px",
    color: "#999",
    margin: "0",
  },
  alertFooter: {
    borderTop: "1px solid #eee",
    padding: "15px 20px",
    display: "flex",
    alignItems: "center",
  },
  footerLink: {
    color: "#3E4D6C",
    fontWeight: "600",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    "& svg": {
      fontSize: "14px",
      marginRight: "5px",
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#999",
  },
  alertDetails: {
    fontSize: "13px",
    color: "#666",
    marginTop: "5px",
  },
  paginationContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "24px",
    padding: "16px 0",
    borderTop: "1px solid #E5E7EB",
  },
  paginationInfo: {
    fontSize: "14px",
    color: "#6b7280",
  },
  paginationButtons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  paginationBtn: {
    minWidth: "36px",
    height: "36px",
    padding: "0 12px",
    borderRadius: "6px",
    border: "1px solid #E5E7EB",
    backgroundColor: "#FFFFFF",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
    "&:hover:not(:disabled)": {
      backgroundColor: "#F9FAFB",
      borderColor: "#D1D5DB",
    },
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  paginationBtnActive: {
    backgroundColor: "#3E4D6C",
    borderColor: "#3E4D6C",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#2E3B55",
    },
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  alertCount: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "4px",
  },
}));

const FILTER_TYPES = {
  All: null,
  DTCs: ["dtc_detected"],
  Collisions: ["collision_detected"],
  "Driving Events": ["harsh_braking", "harsh_acceleration", "harsh_cornering", "overspeed"],
  PIDs: ["pid_reading"],
};

const TIME_FILTERS = {
  Now: 1, // Last 1 hour
  Today: 24, // Last 24 hours
  Week: 168, // Last 7 days
};

export default function Alerts() {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("Today");
  const [page, setPage] = useState(1);
  const alertsPerPage = 10;

  // Calculate hours ago based on time filter
  const hoursAgo = TIME_FILTERS[timeFilter];

  // Determine severity filter based on active filter
  // PIDs have severity 'info', all other alerts have 'warning' or 'critical'
  const getSeverityFilter = () => {
    if (activeFilter === "PIDs") {
      return ["info"];
    }
    if (activeFilter === "All") {
      return ["warning", "critical"]; // All alerts (excluding PIDs from All view)
    }
    return ["warning", "critical"];
  };

  // Fetch events from Supabase (fetch more for pagination)
  const { events, loading, error } = useEvents({
    severity: getSeverityFilter(),
    eventTypes: FILTER_TYPES[activeFilter],
    hoursAgo,
    limit: 200,
    refreshInterval: 30000,
  });

  // Pagination calculations
  const totalPages = Math.ceil(events.length / alertsPerPage);
  const paginatedEvents = events.slice(
    (page - 1) * alertsPerPage,
    page * alertsPerPage
  );

  const handleTimeChange = (event) => {
    setTimeFilter(event.target.value);
    setPage(1); // Reset page when filter changes
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPage(1); // Reset page when filter changes
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get("filter");
    const timeParam = params.get("time");

    if (filterParam && FILTER_TYPES[filterParam]) {
      setActiveFilter(filterParam);
    }

    if (timeParam && TIME_FILTERS[timeParam]) {
      setTimeFilter(timeParam);
    }

    if (filterParam || timeParam) {
      setPage(1);
    }
  }, [location.search]);

  const getAlertTitle = (event) => {
    if (event.event_type === "dtc_detected" && event.event_subtype) {
      return `Engine Fault Code ${event.event_subtype}`;
    }
    if (event.event_type === "dtc_detected" && event.event_data?.dtc_code) {
      return `Engine Fault Code ${event.event_data.dtc_code}`;
    }
    if (event.event_type === "pid_reading" && event.event_subtype) {
      return PID_LABELS[event.event_subtype] || event.event_subtype;
    }
    return EVENT_LABELS[event.event_type] || event.event_type;
  };

  const getAlertLinkText = (eventType) => {
    switch (eventType) {
      case "dtc_detected":
        return "Check Engine Diagnostics";
      case "collision_detected":
        return "View Collision Details";
      case "harsh_braking":
      case "harsh_acceleration":
      case "harsh_cornering":
        return "Review Driver Behavior";
      case "overspeed":
        return "View Speed Report";
      case "pid_reading":
        return "View Vehicle Snapshot";
      default:
        return "View Details";
    }
  };

  const getAlertDetails = (event) => {
    const data = event.event_data || {};

    switch (event.event_type) {
      case "dtc_detected":
        return data.dtc_description || event.event_subtype;
      case "harsh_braking":
        return data.deceleration_g ? `Deceleration: ${data.deceleration_g.toFixed(2)}g` : null;
      case "harsh_acceleration":
        return data.acceleration_g ? `Acceleration: ${data.acceleration_g.toFixed(2)}g` : null;
      case "harsh_cornering":
        return data.lateral_g ? `Lateral G-Force: ${data.lateral_g.toFixed(2)}g` : null;
      case "overspeed":
        return data.recorded_speed
          ? `Speed: ${Number(data.recorded_speed).toFixed(1)} km/h (Limit: ${Number(data.speed_limit).toFixed(1)} km/h)`
          : null;
      case "collision_detected":
        return data.impact_direction
          ? `Impact: ${data.impact_direction} (${data.impact_g ? data.impact_g.toFixed(1) + "g" : ""})`
          : null;
      case "pid_reading":
        return data.value !== undefined
          ? `${typeof data.value === "number" ? data.value.toFixed(1) : data.value} ${data.unit || ""}`
          : null;
      default:
        return null;
    }
  };

  const handleAlertNavigate = (event) => {
    const vehicleId = event.vehicle_id || event.vehicles?.id;
    if (!vehicleId) return;

    switch (event.event_type) {
      case "pid_reading":
        history.push(`/admin/vehicle/${vehicleId}/snapshot`);
        break;
      case "harsh_braking":
      case "harsh_acceleration":
      case "harsh_cornering":
      case "overspeed":
      case "collision_detected":
        history.push(`/admin/vehicle/${vehicleId}/travel-report`);
        break;
      case "dtc_detected":
      default:
        history.push(`/admin/vehicle/${vehicleId}`);
        break;
    }
  };

  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.emptyState}>
        <p>Error loading alerts: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className={classes.pageHeader}>
        <div>
          <h1 className={classes.pageTitle}>Alerts</h1>
          <div className={classes.alertCount}>
            {events.length} {events.length === 1 ? "alert" : "alerts"} found
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
        {Object.keys(FILTER_TYPES).map((filter) => (
          <Button
            key={filter}
            className={`${classes.filterButton} ${
              activeFilter === filter ? classes.activeFilter : classes.inactiveFilter
            }`}
            onClick={() => handleFilterChange(filter)}
          >
            {filter}
          </Button>
        ))}

        <FormControl style={{ marginLeft: "10px" }}>
          <Select
            id="alerts-time-filter"
            name="timeFilter"
            value={timeFilter}
            onChange={handleTimeChange}
            className={classes.timeSelect}
            inputProps={{
              name: "timeFilter",
              id: "alerts-time-filter",
            }}
          >
            <MenuItem value="Now">Last Hour</MenuItem>
            <MenuItem value="Today">Today</MenuItem>
            <MenuItem value="Week">This Week</MenuItem>
          </Select>
        </FormControl>
      </div>

      {events.length === 0 ? (
        <div className={classes.emptyState}>
          <p>No alerts found for the selected filters</p>
        </div>
      ) : (
        <>
          <GridContainer>
            {paginatedEvents.map((event) => (
              <GridItem xs={12} key={event.id}>
                <Card className={classes.alertCard}>
                  <CardBody style={{ padding: "0" }}>
                    <div className={classes.alertHeader}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                          className={classes.alertIconBox}
                          style={{
                            backgroundColor:
                              event.severity === "critical"
                                ? "#F44336"
                                : event.severity === "info"
                                ? "#1A73E8"
                                : "#FB8C00",
                          }}
                        >
                          {event.severity === "critical" ? (
                            <Error style={{ color: "white", fontSize: "18px" }} />
                          ) : event.severity === "info" ? (
                            <Info style={{ color: "white", fontSize: "18px" }} />
                          ) : (
                            <Warning style={{ color: "white", fontSize: "18px" }} />
                          )}
                        </div>
                        <div>
                          <h4 className={classes.alertTitle}>{getAlertTitle(event)}</h4>
                        </div>
                      </div>
                      <MoreHoriz style={{ color: "#999", cursor: "pointer" }} />
                    </div>

                    <div style={{ padding: "0 20px 20px 67px" }}>
                      <p className={classes.alertVehicle}>
                        {event.vehicles?.name || "Unknown Vehicle"}
                        {event.vehicles?.driver_name && (
                          <span style={{ color: "#666", fontWeight: "400" }}>
                            {" "}
                            • {event.vehicles.driver_name}
                          </span>
                        )}
                      </p>
                      {getAlertDetails(event) && (
                        <p className={classes.alertDetails}>{getAlertDetails(event)}</p>
                      )}
                      <p className={classes.alertTime}>{formatDateTime(event.event_at)}</p>
                    </div>

                    <div className={classes.alertFooter}>
                      <div
                        className={classes.footerLink}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleAlertNavigate(event)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleAlertNavigate(event);
                          }
                        }}
                      >
                        <PlayArrow /> {getAlertLinkText(event.event_type)}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </GridContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={classes.paginationContainer}>
              <div className={classes.paginationInfo}>
                Showing {(page - 1) * alertsPerPage + 1}-
                {Math.min(page * alertsPerPage, events.length)} of {events.length} alerts
              </div>
              <div className={classes.paginationButtons}>
                <button
                  className={classes.paginationBtn}
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  First
                </button>
                <button
                  className={classes.paginationBtn}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={`${classes.paginationBtn} ${
                        page === pageNum ? classes.paginationBtnActive : ""
                      }`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className={classes.paginationBtn}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
                <button
                  className={classes.paginationBtn}
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
