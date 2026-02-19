import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useLocation } from "react-router-dom";

// lucide icons
import { AlertTriangle, CircleAlert, Info, MoreHorizontal, Play, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import FilterBar from "components/FilterBar/FilterBar.js";
import EmptyState from "components/EmptyState/EmptyState.js";

// hooks
import { useEvents } from "hooks/useEvents";

// utils
import { EVENT_LABELS, PID_LABELS, SEVERITY_CLASSES, formatDateTime } from "types/database";
import { cn } from "lib/utils";

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
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 text-muted-foreground">
        <p>Error loading alerts: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground m-0">Alerts</h1>
          <div className="text-sm text-muted-foreground mt-1">
            {events.length} {events.length === 1 ? "alert" : "alerts"} found
          </div>
        </div>
      </div>

      <div className="flex items-center mb-8">
        <FilterBar
          filters={Object.keys(FILTER_TYPES).map((f) => ({ label: f, value: f }))}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />

        <select
          id="alerts-time-filter"
          name="timeFilter"
          value={timeFilter}
          onChange={handleTimeChange}
          className="ml-2.5 h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="Now">Last Hour</option>
          <option value="Today">Today</option>
          <option value="Week">This Week</option>
        </select>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No alerts found" description="No alerts match the selected filters" />
      ) : (
        <>
          <GridContainer>
            {paginatedEvents.map((event) => (
              <GridItem xs={12} key={event.id}>
                <Card className="mb-5 shadow-sm">
                  <CardBody className="p-0">
                    <div className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center mr-4",
                            event.severity === "critical" ? "bg-red-500" : event.severity === "info" ? "bg-blue-500" : "bg-amber-500"
                          )}
                        >
                          {event.severity === "critical" ? (
                            <CircleAlert className="h-[18px] w-[18px] text-white" />
                          ) : event.severity === "info" ? (
                            <Info className="h-[18px] w-[18px] text-white" />
                          ) : (
                            <AlertTriangle className="h-[18px] w-[18px] text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-foreground m-0">
                            {getAlertTitle(event)}
                          </h4>
                        </div>
                      </div>
                      <MoreHorizontal className="h-5 w-5 text-muted-foreground cursor-pointer" />
                    </div>

                    <div className="px-5 pb-5 pl-[67px]">
                      <p className="text-base text-foreground font-medium my-1">
                        {event.vehicles?.name || "Unknown Vehicle"}
                        {event.vehicles?.driver_name && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            • {event.vehicles.driver_name}
                          </span>
                        )}
                      </p>
                      {getAlertDetails(event) && (
                        <p className="text-[13px] text-muted-foreground mt-1">{getAlertDetails(event)}</p>
                      )}
                      <p className="text-sm text-muted-foreground m-0">{formatDateTime(event.event_at)}</p>
                    </div>

                    <div className="border-t border-border/50 px-5 py-4 flex items-center">
                      <div
                        className="text-primary font-semibold text-sm flex items-center cursor-pointer"
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
                        <Play className="h-3.5 w-3.5 mr-1.5" /> {getAlertLinkText(event.event_type)}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </GridContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 py-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * alertsPerPage + 1}-
                {Math.min(page * alertsPerPage, events.length)} of {events.length} alerts
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="min-w-[36px] h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm font-medium flex items-center justify-center transition-all hover:bg-muted/50 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  First
                </button>
                <button
                  className="min-w-[36px] h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm font-medium flex items-center justify-center transition-all hover:bg-muted/50 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={cn(
                        "min-w-[36px] h-9 px-3 rounded-md border text-sm font-medium flex items-center justify-center transition-all",
                        page === pageNum
                          ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                          : "border-border bg-background text-foreground hover:bg-muted/50 hover:border-border"
                      )}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="min-w-[36px] h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm font-medium flex items-center justify-center transition-all hover:bg-muted/50 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
                <button
                  className="min-w-[36px] h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm font-medium flex items-center justify-center transition-all hover:bg-muted/50 hover:border-border disabled:opacity-50 disabled:cursor-not-allowed"
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
