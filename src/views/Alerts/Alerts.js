import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useLocation } from "react-router-dom";

// lucide icons
import { AlertTriangle, CircleAlert, Info, ChevronRight, Loader2 } from "lucide-react";

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
import { EVENT_LABELS, PID_LABELS, formatDateTime } from "types/database";
import { cn } from "lib/utils";

const FILTER_TYPES = {
  All: null,
  DTCs: ["dtc_detected"],
  Collisions: ["collision_detected"],
  "Driving Events": ["harsh_braking", "harsh_acceleration", "harsh_cornering", "overspeed"],
  PIDs: ["pid_reading"],
};

const TIME_FILTERS = {
  Now: 1,
  Today: 24,
  Week: 168,
};

export default function Alerts() {
  const history = useHistory();
  const location = useLocation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("Today");
  const [page, setPage] = useState(1);
  const alertsPerPage = 10;

  const hoursAgo = TIME_FILTERS[timeFilter];

  const getSeverityFilter = () => {
    if (activeFilter === "PIDs") {
      return ["info"];
    }
    if (activeFilter === "All") {
      return ["warning", "critical"];
    }
    return ["warning", "critical"];
  };

  const { events, loading, error } = useEvents({
    severity: getSeverityFilter(),
    eventTypes: FILTER_TYPES[activeFilter],
    hoursAgo,
    limit: 200,
    refreshInterval: 30000,
  });

  const totalPages = Math.ceil(events.length / alertsPerPage);
  const paginatedEvents = events.slice(
    (page - 1) * alertsPerPage,
    page * alertsPerPage
  );

  const handleTimeChange = (event) => {
    setTimeFilter(event.target.value);
    setPage(1);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setPage(1);
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
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
          <h1 className="text-xl font-semibold text-foreground m-0 tracking-[-0.02em]">Alerts</h1>
          <div className="text-xs text-muted-foreground/70 font-medium mt-0.5">
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
          className="ml-2.5 h-9 rounded-lg border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-[3px] focus:ring-primary/10 focus:border-primary/40"
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
                <Card className="mb-3 border-border/40">
                  <CardBody className="p-0">
                    <div className="flex items-start gap-3.5 px-5 py-4">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                          event.severity === "critical" ? "bg-red-500/10" : event.severity === "info" ? "bg-blue-500/10" : "bg-amber-500/10"
                        )}
                      >
                        {event.severity === "critical" ? (
                          <CircleAlert className="h-4 w-4 text-red-600" />
                        ) : event.severity === "info" ? (
                          <Info className="h-4 w-4 text-blue-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground m-0">
                            {getAlertTitle(event)}
                          </h4>
                          <span className="text-[11px] text-muted-foreground/60 shrink-0 ml-3">{formatDateTime(event.event_at)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5 m-0">
                          {event.vehicles?.name || "Unknown Vehicle"}
                          {event.vehicles?.driver_name && (
                            <span className="text-muted-foreground/60">
                              {" "}
                              &bull; {event.vehicles.driver_name}
                            </span>
                          )}
                        </p>
                        {getAlertDetails(event) && (
                          <p className="text-xs text-muted-foreground/60 mt-1 m-0">{getAlertDetails(event)}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border/30 px-5 py-3">
                      <button
                        className="text-xs font-medium text-primary flex items-center gap-1 hover:text-primary/80 transition-colors"
                        onClick={() => handleAlertNavigate(event)}
                      >
                        {getAlertLinkText(event.event_type)}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              </GridItem>
            ))}
          </GridContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/50">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * alertsPerPage + 1}-
                {Math.min(page * alertsPerPage, events.length)} of {events.length} alerts
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  First
                </button>
                <button
                  className="min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
                        "min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150",
                        page === pageNum
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
                <button
                  className="min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
