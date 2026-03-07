import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// lucide icons
import {
  ArrowLeft,
  Gauge,
  Crosshair,
  BatteryMedium,
  Signal,
  AlertTriangle,
  Info,
  CircleAlert,
  Activity,
  Pencil,
  Camera,
  ChevronRight,
  Loader2,
} from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer";
import GridItem from "components/Grid/GridItem";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";

// hooks
import { useVehicle } from "hooks/useVehicles";
import { useVehicleEvents } from "hooks/useEvents";

// components
import EditVehicleModal from "./EditVehicleModal";

// utils
import {
  EVENT_LABELS,
  PID_LABELS,
  formatRelativeTime,
  formatDateTime,
} from "types/database";
import { useVehicleSnapshot } from "hooks/useVehicleSnapshot";
import { cn } from "lib/utils";
import { getPublicEnv } from "lib/env";

// Mapbox Public Access Token
mapboxgl.accessToken = getPublicEnv("VITE_MAPBOX_ACCESS_TOKEN_PUBLIC");

// Default center (Jamaica) - same as LiveMap
const DEFAULT_CENTER = { lng: -76.8099, lat: 18.0179 };

// Event filter categories (same as Alerts page)
const EVENT_FILTER_TYPES: Record<string, string[] | null> = {
  All: null,
  DTCs: ["dtc_detected"],
  Collisions: ["collision_detected"],
  "Driving Events": ["harsh_braking", "harsh_acceleration", "harsh_cornering", "overspeed"],
  PIDs: ["pid_reading"],
};

export default function VehicleDetails() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const history = useHistory();
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsFilter, setEventsFilter] = useState("All");
  const eventsPerPage = 10;

  // Fetch vehicle data
  const { vehicle, loading: vehicleLoading, error: vehicleError, refetch: refetchVehicle } = useVehicle(vehicleId);

  // Fetch vehicle snapshot (for PID-derived values like battery voltage)
  const { snapshot } = useVehicleSnapshot(vehicleId, { refreshInterval: 30000 });

  // Fetch vehicle events with server-side filtering
  const { events, loading: eventsLoading } = useVehicleEvents(vehicleId, {
    limit: 100,
    eventTypes: EVENT_FILTER_TYPES[eventsFilter] as any,
  });

  // Parse coordinates - NUMERIC from Postgres can come as string
  const lat = vehicle?.last_latitude ? parseFloat(String(vehicle.last_latitude)) : null;
  const lng = vehicle?.last_longitude ? parseFloat(String(vehicle.last_longitude)) : null;
  const hasLocation = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  // Callback ref to initialize map when container element is available
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return; // Element unmounted
    if (map.current) return; // Already initialized

    map.current = new mapboxgl.Map({
      container: node,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });
  }, []);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Get vehicle status color from the view's status field
  const getStatusColor = () => {
    switch (vehicle?.status) {
      case "online":
        return "#10B981"; // green
      case "idle":
        return "#F59E0B"; // yellow
      case "offline":
      default:
        return "#9C27B0"; // purple
    }
  };

  // Update map when vehicle location is available
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    if (!hasLocation) return;

    const statusColor = getStatusColor();

    // Center map on vehicle
    map.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      essential: true,
    });

    // Create or update marker
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
      // Update color
      const el = marker.current.getElement();
      if (el) {
        el.style.backgroundColor = statusColor;
      }
    } else {
      // Create marker element - simple circle like LiveMap
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = statusColor;
      el.style.border = "2px solid #ffffff";
      el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
      el.style.cursor = "pointer";

      marker.current = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map.current);
    }
  }, [mapLoaded, hasLocation, lat, lng, vehicle?.status]);

  const handleBack = () => {
    history.push("/admin/vehicles");
  };

  const getStatusBadge = () => {
    if (!vehicle) return null;

    const styles = {
      online: "bg-emerald-500/10 text-emerald-600",
      idle: "bg-amber-500/10 text-amber-600",
      offline: "bg-muted text-muted-foreground",
    };

    const labels = { online: "Online", idle: "Idle", offline: "Offline" };
    const status = vehicle.status || "offline";

    return (
      <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ml-3", styles[status] || styles.offline)}>
        {labels[status] || "Offline"}
      </span>
    );
  };

  const getSignalInfo = (signalStrength: any) => {
    if (signalStrength === null || signalStrength === undefined) {
      return { text: "--", color: "text-muted-foreground", quality: "Unknown" };
    }

    const strength = Number(signalStrength);

    if (strength >= 20) {
      return { text: "Excellent", color: "text-emerald-600", quality: "Excellent" };
    } else if (strength >= 15) {
      return { text: "Good", color: "text-blue-600", quality: "Good" };
    } else if (strength >= 10) {
      return { text: "Fair", color: "text-amber-600", quality: "Fair" };
    } else if (strength >= 0) {
      return { text: "Poor", color: "text-red-600", quality: "Poor" };
    } else {
      return { text: "--", color: "text-muted-foreground", quality: "Unknown" };
    }
  };

  const getEventTitle = (event: any) => {
    if (event.event_type === "dtc_detected" && event.event_subtype) {
      return `Engine Fault Code ${event.event_subtype}`;
    }
    if (event.event_type === "dtc_detected" && event.event_data?.dtc_code) {
      return `Engine Fault Code ${event.event_data.dtc_code}`;
    }
    if (event.event_type === "pid_reading" && event.event_subtype) {
      return PID_LABELS[event.event_subtype] || event.event_subtype;
    }
    return (EVENT_LABELS as Record<string, string>)[event.event_type] || event.event_type;
  };

  const getEventLinkText = (eventType: any) => {
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
        return null;
    }
  };

  const handleEventNavigate = (event: any) => {
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
        history.push(`/admin/vehicle/${vehicleId}`);
        break;
      default:
        break;
    }
  };

  if (vehicleLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (vehicleError || !vehicle) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <h3>Vehicle not found</h3>
        <p>
          The vehicle you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to
          it.
        </p>
        <button
          className="rounded-lg border border-border/60 bg-background p-2 transition-colors hover:bg-muted"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>
    );
  }

  const vehicleTitle =
    vehicle.make && vehicle.model
      ? `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ""}`
      : vehicle.name;

  const totalEventsPages = Math.ceil(events.length / eventsPerPage);
  const paginatedEvents = events.slice(
    (eventsPage - 1) * eventsPerPage,
    eventsPage * eventsPerPage
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          className="mr-3 md:mr-4 rounded-lg border border-border/60 bg-background p-2 transition-colors hover:bg-muted shrink-0"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1">
            <h1 className="text-lg md:text-xl font-semibold text-foreground m-0 tracking-[-0.02em] truncate">
              {vehicleTitle}
            </h1>
            {getStatusBadge()}
          </div>
          <div className="text-xs text-muted-foreground/70 font-medium mt-0.5 truncate">
            {vehicle.name} &bull; {vehicle.plate_number || "No plate"} &bull; Driver:{" "}
            {vehicle.driver_name || "Unassigned"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2.5 mb-5">
        <button
          className="inline-flex items-center rounded-lg border border-border/60 bg-background px-3 md:px-4 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:bg-muted"
          onClick={() => setEditModalOpen(true)}
        >
          <Pencil className="mr-1.5 h-4 w-4" />
          Edit Vehicle
        </button>
        <button
          className="inline-flex items-center rounded-lg border border-border/60 bg-background px-3 md:px-4 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:bg-muted"
          onClick={() => history.push(`/admin/vehicle/${vehicleId}/snapshot`)}
        >
          <Camera className="mr-1.5 h-4 w-4" />
          Snapshot
        </button>
        <button
          className="inline-flex items-center rounded-lg bg-foreground px-3 md:px-4 py-2 text-sm font-medium text-background shadow-sm transition-all duration-150 hover:bg-foreground/90"
          onClick={() => history.push(`/admin/vehicle/${vehicleId}/travel-report`)}
        >
          <Activity className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Generate</span> Travel Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card className="mb-0">
          <CardBody className="p-5 flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 mr-4 shrink-0">
              <Gauge className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-foreground tabular-nums">
                {vehicle.last_speed !== null && vehicle.last_speed !== undefined
                  ? `${Math.round(parseFloat(String(vehicle.last_speed)))} km/h`
                  : "N/A"}
              </div>
              <div className="text-xs text-muted-foreground/70 font-medium mt-0.5">Current Speed</div>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-0">
          <CardBody className="p-5 flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 mr-4 shrink-0">
              <Crosshair className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-foreground">{formatRelativeTime(vehicle.last_seen_at ?? null)}</div>
              <div className="text-xs text-muted-foreground/70 font-medium mt-0.5">Last Seen</div>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-0">
          <CardBody className="p-5 flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 mr-4 shrink-0">
              <BatteryMedium className="h-5 w-5 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="text-lg font-semibold text-foreground tabular-nums">
                {snapshot?.battery_voltage !== null && snapshot?.battery_voltage !== undefined
                  ? `${Number(snapshot.battery_voltage).toFixed(1)} V`
                  : "--"}
              </div>
              <div className="text-xs text-muted-foreground/70 font-medium mt-0.5">Battery</div>
            </div>
          </CardBody>
        </Card>

        <Card className="mb-0">
          <CardBody className="p-5 flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 mr-4 shrink-0">
              <Signal className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className={cn("text-lg font-semibold", getSignalInfo(snapshot?.signal_strength).color)}>
                {getSignalInfo(snapshot?.signal_strength).text}
              </div>
              <div className="text-xs text-muted-foreground/70 font-medium mt-0.5">Signal</div>
            </div>
          </CardBody>
        </Card>
      </div>

      <GridContainer>
        {/* Vehicle Info Card */}
        <GridItem xs={12} md={4}>
          <Card>
            <CardBody>
              <h4 className="text-sm font-semibold text-foreground mb-4 mt-2 tracking-[-0.01em]">Vehicle Information</h4>
              {[
                ["Name", vehicle.name || "\u2014"],
                ["Make", vehicle.make || "\u2014"],
                ["Model", vehicle.model || "\u2014"],
                ["Year", vehicle.year || "\u2014"],
                ["Plate Number", vehicle.plate_number || "\u2014"],
                ["Driver", vehicle.driver_name || "Unassigned"],
                ["Device IMEI", vehicle.imei || "No device"],
              ].map(([label, value], idx, arr) => (
                <div
                  key={label}
                  className={cn(
                    "flex justify-between py-3",
                    idx < arr.length - 1 && "border-b border-border/40"
                  )}
                >
                  <span className="text-sm text-muted-foreground/70">{label}</span>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </GridItem>

        {/* Map Card */}
        <GridItem xs={12} md={8}>
          <Card>
            <CardBody>
              <h4 className="text-sm font-semibold text-foreground mb-4 mt-2 tracking-[-0.01em]">Current Location</h4>
              <div className="h-75 rounded-xl overflow-hidden relative">
                <div
                  ref={mapContainerRef}
                  className="w-full h-full"
                  style={{ width: "100%", height: "300px" }}
                />
                {!vehicleLoading && !hasLocation && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted/50 text-muted-foreground text-sm z-10">
                    <Crosshair className="mr-2 h-5 w-5" />
                    No location data available
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </GridItem>

        {/* Events Card */}
        <GridItem xs={12}>
          <h4 className="text-sm font-semibold text-foreground mb-4 mt-2 tracking-[-0.01em]">Recent Events</h4>
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {Object.keys(EVENT_FILTER_TYPES).map((filter) => (
              <button
                key={filter}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
                  eventsFilter === filter
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => {
                  setEventsFilter(filter);
                  setEventsPage(1);
                }}
              >
                {filter}
              </button>
            ))}
          </div>
          {eventsLoading ? (
            <div className="flex items-center justify-center p-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground/70 text-sm">No recent events for this vehicle</div>
          ) : (
            <>
              {paginatedEvents.map((event) => {
                const linkText = getEventLinkText(event.event_type);
                return (
                  <Card key={event.id} className="mb-3 border-border/40">
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
                            <h4 className="text-sm font-semibold text-foreground m-0">{getEventTitle(event)}</h4>
                            <span className="text-[11px] text-muted-foreground/60 shrink-0 ml-3">{formatDateTime(event.event_at)}</span>
                          </div>
                          {getEventDetails(event) && getEventDetails(event) !== "\u2014" && (
                            <p className="text-xs text-muted-foreground/60 mt-1 m-0">{getEventDetails(event)}</p>
                          )}
                        </div>
                      </div>

                      {linkText && (
                        <div className="border-t border-border/30 px-5 py-3">
                          <button
                            className="text-xs font-medium text-primary flex items-center gap-1 hover:text-primary/80 transition-colors"
                            onClick={() => handleEventNavigate(event)}
                          >
                            {linkText}
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </CardBody>
                  </Card>
                );
              })}

              {/* Pagination */}
              {totalEventsPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-5 gap-4 border-t border-border/50">
                  <div className="text-sm text-muted-foreground">
                    Showing {(eventsPage - 1) * eventsPerPage + 1}-
                    {Math.min(eventsPage * eventsPerPage, events.length)} of{" "}
                    {events.length} events
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setEventsPage(1)}
                      disabled={eventsPage === 1}
                    >
                      First
                    </button>
                    <button
                      className="min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setEventsPage((p) => Math.max(1, p - 1))}
                      disabled={eventsPage === 1}
                    >
                      Prev
                    </button>
                    {[...Array(Math.min(5, totalEventsPages))].map((_, i) => {
                      let pageNum;
                      if (totalEventsPages <= 5) {
                        pageNum = i + 1;
                      } else if (eventsPage <= 3) {
                        pageNum = i + 1;
                      } else if (eventsPage >= totalEventsPages - 2) {
                        pageNum = totalEventsPages - 4 + i;
                      } else {
                        pageNum = eventsPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={cn(
                            "min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150",
                            eventsPage === pageNum
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                          onClick={() => setEventsPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      className="min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setEventsPage((p) => Math.min(totalEventsPages, p + 1))}
                      disabled={eventsPage === totalEventsPages}
                    >
                      Next
                    </button>
                    <button
                      className="min-w-9 h-9 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setEventsPage(totalEventsPages)}
                      disabled={eventsPage === totalEventsPages}
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </GridItem>
      </GridContainer>

      {/* Edit Vehicle Modal */}
      <EditVehicleModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        vehicle={vehicle}
        onSuccess={() => {
          refetchVehicle();
        }}
      />
    </div>
  );
}

// Helper function to extract event details
function getEventDetails(event: any) {
  const data = event.event_data || {};

  switch (event.event_type) {
    case "overspeed":
      return data.actual_speed
        ? `${Math.round(data.actual_speed)} km/h (limit: ${data.speed_limit || "\u2014"} km/h)`
        : "Speed threshold exceeded";
    case "harsh_braking":
    case "harsh_acceleration":
    case "harsh_cornering":
      return data.g_force ? `G-Force: ${data.g_force.toFixed(2)}` : "Harsh maneuver detected";
    case "collision_detected":
      return data.impact_direction || "Impact detected";
    case "dtc_detected": {
      if (event.event_subtype === "high_coolant_temp") return "High engine coolant temperature";
      return data.dtc_code
        ? `${data.dtc_code}: ${data.dtc_description || "Diagnostic fault"}`
        : "Diagnostic fault detected";
    }
    case "device_online":
      return "Device connected";
    case "device_offline":
      return "Device disconnected";
    case "pid_reading": {
      const label = PID_LABELS[event.event_subtype] || event.event_subtype || "Telemetry";
      if (data.value !== undefined && data.value !== null) {
        const val = typeof data.value === "number" ? parseFloat(data.value.toFixed(1)) : data.value;
        return `${label}: ${val}${data.unit ? ` ${data.unit}` : ""}`;
      }
      return label;
    }
    case "power_event": {
      if (event.event_subtype === "ignition_off") return "Ignition turned off";
      if (event.event_subtype === "ignition_on") return "Ignition turned on";
      if (data.alarm_name === "Power off alarm") return "Device physically disconnected";
      if (data.alarm_name === "Power on alarm") return "Device physically connected";
      return data.alarm_name || "Power state change";
    }
    case "alarm":
      return data.alarm_name || "Device alarm";
    default:
      return "\u2014";
  }
}
