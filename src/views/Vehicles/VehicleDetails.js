import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import mapboxgl from "!mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";

// @material-ui/icons
import ArrowBack from "@material-ui/icons/ArrowBack";
import Speed from "@material-ui/icons/Speed";
import GpsFixed from "@material-ui/icons/GpsFixed";
import Battery90 from "@material-ui/icons/Battery90";
import SignalCellular4Bar from "@material-ui/icons/SignalCellular4Bar";
import Warning from "@material-ui/icons/Warning";
import Info from "@material-ui/icons/Info";
import Error from "@material-ui/icons/Error";
import Timeline from "@material-ui/icons/Timeline";
import Edit from "@material-ui/icons/Edit";
import CameraAlt from "@material-ui/icons/CameraAlt";
import MoreHoriz from "@material-ui/icons/MoreHoriz";
import PlayArrow from "@material-ui/icons/PlayArrow";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Button from "components/CustomButtons/Button.js";

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

// Mapbox Public Access Token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN_PUBLIC;

const useStyles = makeStyles(() => ({
  backButton: {
    marginRight: "16px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E0E4E8",
    "&:hover": {
      backgroundColor: "#F8F9FB",
    },
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
  },
  headerInfo: {
    flex: 1,
  },
  reportButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    padding: "10px 20px",
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    "&:hover": {
      backgroundColor: "#2E3B55",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
  },
  reportRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginBottom: "16px",
  },
  editButton: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    padding: "10px 20px",
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    "&:hover": {
      backgroundColor: "#E5E7EB",
    },
  },
  vehicleTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  vehicleSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "4px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    marginLeft: "16px",
    "& svg": {
      fontSize: "16px",
      marginRight: "6px",
    },
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "16px",
    marginTop: "8px",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "20px",
    height: "100%",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  infoLabel: {
    color: "#6b7280",
    fontSize: "14px",
  },
  infoValue: {
    color: "#1f2937",
    fontSize: "14px",
    fontWeight: "500",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "16px",
    "& svg": {
      fontSize: "24px",
      color: "#FFFFFF",
    },
  },
  statInfo: {
    flex: 1,
  },
  statValue: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
  },
  statLabel: {
    fontSize: "13px",
    color: "#6b7280",
    marginTop: "2px",
  },
  mapContainer: {
    height: "300px",
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  noLocation: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(249, 250, 251, 0.95)",
    color: "#6b7280",
    fontSize: "14px",
    zIndex: 10,
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    boxShadow: "0 2px 12px 0 rgba(0,0,0,0.05)",
    marginBottom: "16px",
    overflow: "hidden",
  },
  eventHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "15px 20px",
  },
  eventIconBox: {
    width: "32px",
    height: "32px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "15px",
    flexShrink: 0,
  },
  eventTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#333",
    margin: "0",
  },
  eventDetails: {
    fontSize: "13px",
    color: "#666",
    marginTop: "5px",
  },
  eventTime: {
    fontSize: "14px",
    color: "#999",
    margin: "0",
  },
  eventFooter: {
    borderTop: "1px solid #eee",
    padding: "15px 20px",
    display: "flex",
    alignItems: "center",
  },
  eventFooterLink: {
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
    minHeight: "400px",
  },
  errorContainer: {
    textAlign: "center",
    padding: "60px",
    color: "#6b7280",
  },
  emptyEvents: {
    textAlign: "center",
    padding: "40px",
    color: "#9ca3af",
    fontSize: "14px",
  },
  eventsFilterRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
  },
  eventsFilterBtn: {
    padding: "6px 16px",
    borderRadius: "6px",
    border: "1px solid #E5E7EB",
    backgroundColor: "#F3F4F6",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s ease",
    "&:hover": {
      backgroundColor: "#E5E7EB",
    },
  },
  eventsFilterBtnActive: {
    backgroundColor: "#3E4D6C",
    borderColor: "#3E4D6C",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#2E3B55",
    },
  },
  paginationContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #f3f4f6",
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
}));

// Default center (Jamaica) - same as LiveMap
const DEFAULT_CENTER = { lng: -76.8099, lat: 18.0179 };

// Event filter categories (same as Alerts page)
const EVENT_FILTER_TYPES = {
  All: null,
  DTCs: ["dtc_detected"],
  Collisions: ["collision_detected"],
  "Driving Events": ["harsh_braking", "harsh_acceleration", "harsh_cornering", "overspeed"],
  PIDs: ["pid_reading"],
};

export default function VehicleDetails() {
  const classes = useStyles();
  const { vehicleId } = useParams();
  const history = useHistory();
  const map = useRef(null);
  const marker = useRef(null);
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
    eventTypes: EVENT_FILTER_TYPES[eventsFilter],
  });

  // Parse coordinates - NUMERIC from Postgres can come as string
  const lat = vehicle?.last_latitude ? parseFloat(vehicle.last_latitude) : null;
  const lng = vehicle?.last_longitude ? parseFloat(vehicle.last_longitude) : null;
  const hasLocation = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  // Callback ref to initialize map when container element is available
  const mapContainerRef = useCallback((node) => {
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

  const getStatusInfo = () => {
    if (!vehicle) return { label: "Unknown", color: "#9C27B0", bg: "#F3F4F6" };

    switch (vehicle.status) {
      case "online":
        return { label: "Online", color: "#065F46", bg: "#D1FAE5" };
      case "idle":
        return { label: "Idle", color: "#92400E", bg: "#FEF3C7" };
      case "offline":
      default:
        return { label: "Offline", color: "#6B21A8", bg: "#F3E8FF" };
    }
  };

  const getSignalInfo = (signalStrength) => {
    if (signalStrength === null || signalStrength === undefined) {
      return { text: "--", color: "#9CA3AF", quality: "Unknown" };
    }

    const strength = Number(signalStrength);

    if (strength >= 20) {
      return { text: "Excellent", color: "#10B981", quality: "Excellent" };
    } else if (strength >= 15) {
      return { text: "Good", color: "#3B82F6", quality: "Good" };
    } else if (strength >= 10) {
      return { text: "Fair", color: "#F59E0B", quality: "Fair" };
    } else if (strength >= 0) {
      return { text: "Poor", color: "#EF4444", quality: "Poor" };
    } else {
      return { text: "--", color: "#9CA3AF", quality: "Unknown" };
    }
  };

  const getEventTitle = (event) => {
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

  const getEventLinkText = (eventType) => {
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

  const handleEventNavigate = (event) => {
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
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (vehicleError || !vehicle) {
    return (
      <div className={classes.errorContainer}>
        <h3>Vehicle not found</h3>
        <p>
          The vehicle you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to
          it.
        </p>
        <IconButton onClick={handleBack} className={classes.backButton}>
          <ArrowBack />
        </IconButton>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
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
      <div className={classes.header}>
        <IconButton onClick={handleBack} className={classes.backButton}>
          <ArrowBack />
        </IconButton>
        <div className={classes.headerInfo}>
          <h1 className={classes.vehicleTitle}>
            {vehicleTitle}
            <span
              className={classes.statusBadge}
              style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
            >
              {statusInfo.label}
            </span>
          </h1>
          <div className={classes.vehicleSubtitle}>
            {vehicle.name} • {vehicle.plate_number || "No plate"} • Driver:{" "}
            {vehicle.driver_name || "Unassigned"}
          </div>
        </div>
      </div>

      <div className={classes.reportRow}>
        <Button
          className={classes.editButton}
          onClick={() => setEditModalOpen(true)}
        >
          <Edit style={{ marginRight: "8px", fontSize: "18px" }} />
          Edit Vehicle
        </Button>
        <Button
          className={classes.reportButton}
          onClick={() => history.push(`/admin/vehicle/${vehicleId}/snapshot`)}
        >
          <CameraAlt style={{ marginRight: "8px", fontSize: "18px" }} />
          Snapshot
        </Button>
        <Button
          className={classes.reportButton}
          onClick={() => history.push(`/admin/vehicle/${vehicleId}/travel-report`)}
        >
          <Timeline style={{ marginRight: "8px", fontSize: "18px" }} />
          Generate Travel Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className={classes.statsGrid}>
        <div className={classes.statCard}>
          <div className={classes.statIcon} style={{ backgroundColor: "#3B82F6" }}>
            <Speed />
          </div>
          <div className={classes.statInfo}>
            <div className={classes.statValue}>
              {vehicle.last_speed !== null && vehicle.last_speed !== undefined
                ? `${Math.round(parseFloat(vehicle.last_speed))} km/h`
                : "N/A"}
            </div>
            <div className={classes.statLabel}>Current Speed</div>
          </div>
        </div>

        <div className={classes.statCard}>
          <div className={classes.statIcon} style={{ backgroundColor: "#10B981" }}>
            <GpsFixed />
          </div>
          <div className={classes.statInfo}>
            <div className={classes.statValue}>{formatRelativeTime(vehicle.last_seen_at)}</div>
            <div className={classes.statLabel}>Last Seen</div>
          </div>
        </div>

        <div className={classes.statCard}>
          <div className={classes.statIcon} style={{ backgroundColor: "#8B5CF6" }}>
            <Battery90 />
          </div>
          <div className={classes.statInfo}>
            <div className={classes.statValue}>
              {snapshot?.battery_voltage !== null && snapshot?.battery_voltage !== undefined
                ? `${Number(snapshot.battery_voltage).toFixed(1)} V`
                : "--"}
            </div>
            <div className={classes.statLabel}>Battery</div>
          </div>
        </div>

        <div className={classes.statCard}>
          <div
            className={classes.statIcon}
            style={{ backgroundColor: getSignalInfo(snapshot?.signal_strength).color }}
          >
            <SignalCellular4Bar />
          </div>
          <div className={classes.statInfo}>
            <div className={classes.statValue}>
              {getSignalInfo(snapshot?.signal_strength).text}
            </div>
            <div className={classes.statLabel}>Signal</div>
          </div>
        </div>
      </div>

      <GridContainer>
        {/* Vehicle Info Card */}
        <GridItem xs={12} md={4}>
          <Card>
            <CardBody>
              <h4 className={classes.sectionTitle}>Vehicle Information</h4>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>Name</span>
                <span className={classes.infoValue}>{vehicle.name || "—"}</span>
              </div>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>Make</span>
                <span className={classes.infoValue}>{vehicle.make || "—"}</span>
              </div>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>Model</span>
                <span className={classes.infoValue}>{vehicle.model || "—"}</span>
              </div>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>Year</span>
                <span className={classes.infoValue}>{vehicle.year || "—"}</span>
              </div>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>Plate Number</span>
                <span className={classes.infoValue}>{vehicle.plate_number || "—"}</span>
              </div>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>Driver</span>
                <span className={classes.infoValue}>{vehicle.driver_name || "Unassigned"}</span>
              </div>
              <div className={classes.infoRow}>
                <span className={classes.infoLabel}>Device IMEI</span>
                <span className={classes.infoValue}>{vehicle.imei || "No device"}</span>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        {/* Map Card */}
        <GridItem xs={12} md={8}>
          <Card>
            <CardBody>
              <h4 className={classes.sectionTitle}>Current Location</h4>
              <div className={classes.mapContainer}>
                <div
                  ref={mapContainerRef}
                  className={classes.map}
                  style={{ width: "100%", height: "300px" }}
                />
                {!vehicleLoading && !hasLocation && (
                  <div className={classes.noLocation}>
                    <GpsFixed style={{ marginRight: "8px" }} />
                    No location data available
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </GridItem>

        {/* Events Card */}
        <GridItem xs={12}>
          <h4 className={classes.sectionTitle}>Recent Events</h4>
          <div className={classes.eventsFilterRow}>
            {Object.keys(EVENT_FILTER_TYPES).map((filter) => (
              <button
                key={filter}
                className={`${classes.eventsFilterBtn} ${
                  eventsFilter === filter ? classes.eventsFilterBtnActive : ""
                }`}
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
            <div className={classes.loadingContainer}>
              <CircularProgress size={32} />
            </div>
          ) : events.length === 0 ? (
            <div className={classes.emptyEvents}>No recent events for this vehicle</div>
          ) : (
            <>
              {paginatedEvents.map((event) => {
                const linkText = getEventLinkText(event.event_type);
                return (
                  <div key={event.id} className={classes.eventCard}>
                    <div className={classes.eventHeader}>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                          className={classes.eventIconBox}
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
                          <h4 className={classes.eventTitle}>{getEventTitle(event)}</h4>
                        </div>
                      </div>
                      <MoreHoriz style={{ color: "#999", cursor: "pointer" }} />
                    </div>

                    <div style={{ padding: "0 20px 20px 67px" }}>
                      {getEventDetails(event) && getEventDetails(event) !== "—" && (
                        <p className={classes.eventDetails}>{getEventDetails(event)}</p>
                      )}
                      <p className={classes.eventTime}>{formatDateTime(event.event_at)}</p>
                    </div>

                    {linkText && (
                      <div className={classes.eventFooter}>
                        <div
                          className={classes.eventFooterLink}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleEventNavigate(event)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleEventNavigate(event);
                            }
                          }}
                        >
                          <PlayArrow /> {linkText}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

                  {/* Pagination */}
                  {totalEventsPages > 1 && (
                    <div className={classes.paginationContainer}>
                      <div className={classes.paginationInfo}>
                        Showing {(eventsPage - 1) * eventsPerPage + 1}-
                        {Math.min(eventsPage * eventsPerPage, events.length)} of{" "}
                        {events.length} events
                      </div>
                      <div className={classes.paginationButtons}>
                        <button
                          className={classes.paginationBtn}
                          onClick={() => setEventsPage(1)}
                          disabled={eventsPage === 1}
                        >
                          First
                        </button>
                        <button
                          className={classes.paginationBtn}
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
                              className={`${classes.paginationBtn} ${
                                eventsPage === pageNum ? classes.paginationBtnActive : ""
                              }`}
                              onClick={() => setEventsPage(pageNum)}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          className={classes.paginationBtn}
                          onClick={() => setEventsPage((p) => Math.min(totalEventsPages, p + 1))}
                          disabled={eventsPage === totalEventsPages}
                        >
                          Next
                        </button>
                        <button
                          className={classes.paginationBtn}
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
function getEventDetails(event) {
  const data = event.event_data || {};

  switch (event.event_type) {
    case "overspeed":
      return data.actual_speed
        ? `${Math.round(data.actual_speed)} km/h (limit: ${data.speed_limit || "—"} km/h)`
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
      return "—";
  }
}
