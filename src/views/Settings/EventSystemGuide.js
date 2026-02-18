import React from "react";
import { useHistory } from "react-router-dom";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// @material-ui/icons
import ArrowBack from "@material-ui/icons/ArrowBack";
import MyLocation from "@material-ui/icons/MyLocation";
import Speed from "@material-ui/icons/Speed";
import Warning from "@material-ui/icons/Warning";
import PowerOff from "@material-ui/icons/PowerOff";
import Power from "@material-ui/icons/Power";
import Build from "@material-ui/icons/Build";
import Memory from "@material-ui/icons/Memory";
import NotificationsActive from "@material-ui/icons/NotificationsActive";
import FiberManualRecord from "@material-ui/icons/FiberManualRecord";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";

const useStyles = makeStyles(() => ({
  pageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "8px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "32px",
    maxWidth: "720px",
    lineHeight: "1.6",
  },
  backButton: {
    marginBottom: "16px",
    color: "#6b7280",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    "&:hover": { color: "#1f2937" },
  },
  section: {
    marginBottom: "40px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sectionDescription: {
    fontSize: "14px",
    color: "#6b7280",
    lineHeight: "1.6",
    marginBottom: "20px",
    maxWidth: "720px",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #E5E7EB",
    height: "100%",
  },
  eventCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #E5E7EB",
    height: "100%",
    borderLeft: "4px solid",
  },
  eventHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "12px",
  },
  eventIconContainer: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  eventIcon: {
    fontSize: "20px",
    color: "#FFFFFF",
  },
  eventName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1f2937",
  },
  eventCode: {
    fontSize: "12px",
    fontFamily: "monospace",
    color: "#6b7280",
    backgroundColor: "#F3F4F6",
    padding: "2px 8px",
    borderRadius: "4px",
  },
  eventDescription: {
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: "1.5",
    marginBottom: "12px",
  },
  eventDetail: {
    fontSize: "12px",
    color: "#9CA3AF",
    lineHeight: "1.5",
  },
  tag: {
    display: "inline-block",
    fontSize: "11px",
    fontWeight: "500",
    padding: "2px 8px",
    borderRadius: "4px",
    marginRight: "6px",
    marginTop: "8px",
  },
  tagInfo: {
    backgroundColor: "#EFF6FF",
    color: "#2563EB",
  },
  tagWarning: {
    backgroundColor: "#FFF7ED",
    color: "#EA580C",
  },
  tagCritical: {
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
  },
  // Status section
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    borderBottom: "1px solid #F3F4F6",
    "&:last-child": { borderBottom: "none" },
  },
  statusDot: {
    fontSize: "14px",
  },
  statusLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
    minWidth: "80px",
  },
  statusDescription: {
    fontSize: "13px",
    color: "#6b7280",
    flex: 1,
  },
  // Flow diagram
  flowContainer: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "20px",
  },
  flowStep: {
    backgroundColor: "#F8FAFC",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    padding: "12px 16px",
    textAlign: "center",
    minWidth: "120px",
  },
  flowStepLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  flowStepDesc: {
    fontSize: "11px",
    color: "#6b7280",
  },
  flowArrow: {
    fontSize: "18px",
    color: "#9CA3AF",
  },
  // JSON example
  jsonBlock: {
    backgroundColor: "#1E293B",
    color: "#E2E8F0",
    borderRadius: "8px",
    padding: "16px",
    fontSize: "12px",
    fontFamily: "'Fira Code', 'Consolas', monospace",
    lineHeight: "1.6",
    overflowX: "auto",
    whiteSpace: "pre",
    marginTop: "12px",
  },
  jsonKey: { color: "#7DD3FC" },
  jsonString: { color: "#86EFAC" },
  jsonNumber: { color: "#FDE68A" },
  // Table
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    backgroundColor: "#F8FAFC",
    color: "#6b7280",
    fontWeight: "600",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #E5E7EB",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #F3F4F6",
    color: "#374151",
  },
  tdCode: {
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#7C3AED",
    backgroundColor: "#F5F3FF",
    padding: "2px 6px",
    borderRadius: "3px",
  },
}));

// ============================================================================
// EVENT TYPE DEFINITIONS
// ============================================================================

const eventTypes = [
  {
    type: "location_update",
    name: "Location Update",
    icon: MyLocation,
    color: "#2563EB",
    severity: "info",
    description:
      "The core telemetry event. Sent every few seconds while the vehicle is on. Contains GPS coordinates, speed, heading, and optionally OBD-II data (RPM, fuel, voltage, etc.).",
    setsStatus: "ONLINE (speed > 0) or IDLE (speed = 0)",
    sideEffects:
      "Updates vehicle position (lat/lng/speed/heading), updates last_seen_at, generates derived PID readings from embedded OBD data.",
    example: `{
  "imei": "862753063164959",
  "event_type": "location_update",
  "latitude": 18.0587,
  "longitude": -76.85818,
  "speed": 45.2,
  "heading": 180,
  "event_data": {
    "rpm": 2400,
    "battery_voltage": 12.8,
    "odometer": 54321
  }
}`,
  },
  {
    type: "device_online",
    name: "Device Online",
    icon: Power,
    color: "#10B981",
    severity: "info",
    description:
      "Sent when the device powers on and establishes connection. Indicates ignition/ACC was turned on. The vehicle engine is starting.",
    setsStatus: "IDLE",
    sideEffects:
      "Updates last_seen_at, generates PID readings if OBD data is present.",
    example: `{
  "imei": "862753063164959",
  "event_type": "device_online",
  "latitude": 18.0587,
  "longitude": -76.85818,
  "speed": 0.0,
  "severity": "info"
}`,
  },
  {
    type: "device_offline",
    name: "Device Offline (Disconnected)",
    icon: PowerOff,
    color: "#6B7280",
    severity: "info",
    description:
      "Sent when ignition/ACC is turned off. This is the NORMAL power-off — the driver turned off the vehicle. Coordinates may be 0,0 since GPS can lose fix at shutdown.",
    setsStatus: "OFFLINE (immediate)",
    sideEffects: "Resets last_speed to 0, updates last_seen_at.",
    example: `{
  "imei": "862753063164959",
  "event_type": "device_offline",
  "latitude": 0.0,
  "longitude": 0.0,
  "severity": "info",
  "event_data": {
    "reason": "disconnected"
  }
}`,
  },
  {
    type: "power_event",
    name: "Power Event (Power Off Alarm)",
    icon: Warning,
    color: "#DC2626",
    severity: "warning",
    description:
      'CRITICAL ALERT: The physical device was UNPLUGGED or lost power unexpectedly. This is NOT a normal shutdown. The alarm_name "Power off alarm" indicates possible tampering or theft. This should trigger an immediate notification to admins.',
    setsStatus: "OFFLINE (immediate)",
    sideEffects: "Resets last_speed to 0, updates last_seen_at. Should trigger admin notification.",
    example: `{
  "imei": "218L1EA20210001",
  "event_type": "power_event",
  "latitude": 18.05874,
  "longitude": -76.85825,
  "speed": 0.0,
  "severity": "warning",
  "event_subtype": "0x0E",
  "event_data": {
    "alarm_name": "Power off alarm",
    "alarm_type": "0x0E",
    "alarm_num": 3,
    "is_new_alarm": true
  }
}`,
  },
  {
    type: "alarm",
    name: "Alarm",
    icon: NotificationsActive,
    color: "#F59E0B",
    severity: "warning",
    description:
      "General alarm events from the device. Includes vibration alarms (someone shaking/hitting the vehicle while parked), tow alarms, and other device-specific alerts. The alarm_name field describes the specific alarm.",
    setsStatus: "No change (stays at current status)",
    sideEffects: "Inserts event record. Should trigger notification for relevant alarm types.",
    example: `{
  "imei": "218L1EA20210001",
  "event_type": "alarm",
  "latitude": 18.0587,
  "longitude": -76.85818,
  "speed": 0.0,
  "severity": "warning",
  "event_subtype": "0x1C",
  "event_data": {
    "alarm_name": "Vibration alarm",
    "alarm_type": "0x1C",
    "alarm_num": 1,
    "is_new_alarm": true,
    "alarm_value": 6,
    "alarm_threshold": 5
  }
}`,
  },
  {
    type: "overspeed",
    name: "Overspeed",
    icon: Speed,
    color: "#EA580C",
    severity: "warning",
    description:
      "Vehicle exceeded the configured speed limit. Useful for fleet driver behavior monitoring and safety compliance.",
    setsStatus: "ONLINE (vehicle is moving)",
    sideEffects: "Inserts event record.",
    example: `{
  "imei": "862753063164959",
  "event_type": "overspeed",
  "latitude": 18.0587,
  "longitude": -76.85818,
  "speed": 125.5,
  "severity": "warning"
}`,
  },
  {
    type: "harsh_braking",
    name: "Harsh Braking",
    icon: Warning,
    color: "#EA580C",
    severity: "warning",
    description:
      "Sudden deceleration detected by the device's accelerometer. Indicates aggressive braking that may indicate unsafe driving.",
    setsStatus: "ONLINE",
    sideEffects: "Inserts event record.",
  },
  {
    type: "harsh_acceleration",
    name: "Harsh Acceleration",
    icon: Warning,
    color: "#EA580C",
    severity: "warning",
    description:
      "Sudden acceleration detected. Part of driver behavior scoring along with braking and cornering events.",
    setsStatus: "ONLINE",
    sideEffects: "Inserts event record.",
  },
  {
    type: "harsh_cornering",
    name: "Harsh Cornering",
    icon: Warning,
    color: "#EA580C",
    severity: "warning",
    description: "Aggressive turning detected by the accelerometer.",
    setsStatus: "ONLINE",
    sideEffects: "Inserts event record.",
  },
  {
    type: "collision_detected",
    name: "Collision Detected",
    icon: Warning,
    color: "#DC2626",
    severity: "critical",
    description:
      "Severe impact detected by accelerometer. This is the highest severity event and should always trigger immediate notification.",
    setsStatus: "ONLINE",
    sideEffects: "Inserts event record. Should trigger immediate admin notification.",
  },
  {
    type: "dtc_detected",
    name: "DTC Detected",
    icon: Build,
    color: "#7C3AED",
    severity: "warning",
    description:
      'Diagnostic Trouble Code from the vehicle\'s OBD-II system. These are the same codes a mechanic reads with a scanner (e.g., P0301 = "Cylinder 1 Misfire"). Stored in event_subtype or event_data.',
    setsStatus: "No change",
    sideEffects: "Inserts event record with DTC code details.",
    example: `{
  "imei": "862753063164959",
  "event_type": "dtc_detected",
  "latitude": 18.0587,
  "longitude": -76.85818,
  "speed": 0.0,
  "severity": "warning",
  "event_data": {
    "dtc_code": "P0301",
    "dtc_description": "Cylinder 1 Misfire Detected"
  }
}`,
  },
  {
    type: "pid_reading",
    name: "PID Reading",
    icon: Memory,
    color: "#0891B2",
    severity: "info",
    description:
      'Parameter ID readings from the OBD-II port. These are the real-time vehicle metrics: RPM, fuel level, battery voltage, coolant temperature, odometer, etc. Most PID readings are auto-derived from location_update events that contain OBD data. The event_subtype indicates the specific parameter (e.g., "rpm", "fuel_level", "battery_voltage").',
    setsStatus: "No change",
    sideEffects: "Inserts event record with value, unit, and description in event_data.",
    example: `// Auto-derived from a location_update with OBD data:
{
  "event_type": "pid_reading",
  "event_subtype": "battery_voltage",
  "event_data": {
    "value": 12.8,
    "unit": "V",
    "description": "Battery Voltage"
  }
}`,
  },
];

const pidTypes = [
  { subtype: "battery_voltage", unit: "V", description: "Vehicle battery voltage" },
  { subtype: "rpm", unit: "RPM", description: "Engine revolutions per minute" },
  { subtype: "speed", unit: "km/h", description: "Vehicle speed from OBD" },
  { subtype: "coolant_temp", unit: "°C", description: "Engine coolant temperature" },
  { subtype: "fuel_level", unit: "%", description: "Fuel tank level" },
  { subtype: "odometer", unit: "km", description: "Total distance traveled" },
  { subtype: "engine_load", unit: "%", description: "Current engine load" },
  { subtype: "throttle_position", unit: "%", description: "Throttle pedal position" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function EventSystemGuide() {
  const classes = useStyles();
  const history = useHistory();

  return (
    <div>
      <div className={classes.backButton} onClick={() => history.push("/admin/settings")}>
        <ArrowBack style={{ fontSize: "18px" }} /> Back to Settings
      </div>

      <h1 className={classes.pageTitle}>Event System Guide</h1>
      <p className={classes.pageSubtitle}>
        Complete reference for how telemetry data flows from GPS devices into Entry.
        This covers every event type, what triggers it, how it affects vehicle status,
        and what data it carries.
      </p>

      {/* ================================================================ */}
      {/* DATA FLOW */}
      {/* ================================================================ */}
      <div className={classes.section}>
        <div className={classes.sectionTitle}>Data Flow</div>
        <p className={classes.sectionDescription}>
          GPS devices installed in vehicles send events to our server. The server
          validates, processes, and stores them. The frontend reads the processed data
          in real time.
        </p>
        <div className={classes.flowContainer}>
          <div className={classes.flowStep}>
            <div className={classes.flowStepLabel}>GPS Device</div>
            <div className={classes.flowStepDesc}>Sends JSON via HTTP</div>
          </div>
          <span className={classes.flowArrow}>&rarr;</span>
          <div className={classes.flowStep}>
            <div className={classes.flowStepLabel}>Edge Function</div>
            <div className={classes.flowStepDesc}>telemetry-ingest</div>
          </div>
          <span className={classes.flowArrow}>&rarr;</span>
          <div className={classes.flowStep}>
            <div className={classes.flowStepLabel}>Database</div>
            <div className={classes.flowStepDesc}>events table</div>
          </div>
          <span className={classes.flowArrow}>&rarr;</span>
          <div className={classes.flowStep}>
            <div className={classes.flowStepLabel}>vehicles table</div>
            <div className={classes.flowStepDesc}>status + position updated</div>
          </div>
          <span className={classes.flowArrow}>&rarr;</span>
          <div className={classes.flowStep}>
            <div className={classes.flowStepLabel}>Frontend</div>
            <div className={classes.flowStepDesc}>vehicles_with_status view</div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* VEHICLE STATUS */}
      {/* ================================================================ */}
      <div className={classes.section}>
        <div className={classes.sectionTitle}>
          <FiberManualRecord style={{ color: "#10B981", fontSize: "16px" }} />
          Vehicle Status
        </div>
        <p className={classes.sectionDescription}>
          Every vehicle has one of three statuses, set immediately by the edge function
          when an event arrives. There is also a 5-minute safety net: if no event is
          received in 5 minutes, the vehicle automatically shows as Offline.
        </p>
        <div className={classes.card}>
          <div className={classes.statusRow}>
            <FiberManualRecord className={classes.statusDot} style={{ color: "#10B981" }} />
            <span className={classes.statusLabel}>Online</span>
            <span className={classes.statusDescription}>
              Vehicle is moving (speed &gt; 0). Set by <code>location_update</code> with speed,
              or driving behavior events (overspeed, harsh braking, etc.).
            </span>
          </div>
          <div className={classes.statusRow}>
            <FiberManualRecord className={classes.statusDot} style={{ color: "#F59E0B" }} />
            <span className={classes.statusLabel}>Idle</span>
            <span className={classes.statusDescription}>
              Engine is on but vehicle is not moving (speed = 0). Set by <code>location_update</code> with
              speed 0, <code>device_online</code>, or informational events like alarms.
            </span>
          </div>
          <div className={classes.statusRow}>
            <FiberManualRecord className={classes.statusDot} style={{ color: "#9C27B0" }} />
            <span className={classes.statusLabel}>Offline</span>
            <span className={classes.statusDescription}>
              Vehicle engine is off or device was disconnected. Set immediately
              by <code>device_offline</code> or <code>power_event</code> (Power off alarm).
              Also triggered automatically if no data received in 5 minutes.
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* IMPORTANT: device_offline vs power_event */}
      {/* ================================================================ */}
      <div className={classes.section}>
        <div className={classes.sectionTitle}>
          <PowerOff style={{ color: "#DC2626", fontSize: "20px" }} />
          Device Offline vs Power Off Alarm
        </div>
        <p className={classes.sectionDescription}>
          These two events both set the vehicle to Offline, but they mean very different things:
        </p>
        <GridContainer spacing={3}>
          <GridItem xs={12} md={6}>
            <div className={classes.eventCard} style={{ borderLeftColor: "#6B7280" }}>
              <div className={classes.eventName}>device_offline (Normal)</div>
              <div className={classes.eventDescription} style={{ marginTop: "8px" }}>
                The driver turned off the ignition/ACC. This is completely normal and expected.
                Happens every time someone parks and turns off the car. No action needed.
              </div>
              <span className={`${classes.tag} ${classes.tagInfo}`}>severity: info</span>
              <span className={`${classes.tag} ${classes.tagInfo}`}>reason: disconnected</span>
            </div>
          </GridItem>
          <GridItem xs={12} md={6}>
            <div className={classes.eventCard} style={{ borderLeftColor: "#DC2626" }}>
              <div className={classes.eventName}>power_event — Power Off Alarm</div>
              <div className={classes.eventDescription} style={{ marginTop: "8px" }}>
                The GPS device was PHYSICALLY UNPLUGGED or lost power unexpectedly.
                This could indicate tampering, theft, or a wiring issue. Should trigger an
                immediate notification to admin/super admin.
              </div>
              <span className={`${classes.tag} ${classes.tagWarning}`}>severity: warning</span>
              <span className={`${classes.tag} ${classes.tagCritical}`}>REQUIRES NOTIFICATION</span>
            </div>
          </GridItem>
        </GridContainer>
      </div>

      {/* ================================================================ */}
      {/* ALL EVENT TYPES */}
      {/* ================================================================ */}
      <div className={classes.section}>
        <div className={classes.sectionTitle}>All Event Types</div>
        <p className={classes.sectionDescription}>
          Complete reference of every event type the system accepts. Each event is received
          from the GPS device, validated, and inserted into the <code>events</code> table.
        </p>
        <GridContainer spacing={3}>
          {eventTypes.map((evt) => (
            <GridItem xs={12} md={6} key={evt.type}>
              <div className={classes.eventCard} style={{ borderLeftColor: evt.color }}>
                <div className={classes.eventHeader}>
                  <div className={classes.eventIconContainer} style={{ backgroundColor: evt.color }}>
                    <evt.icon className={classes.eventIcon} />
                  </div>
                  <div>
                    <div className={classes.eventName}>{evt.name}</div>
                    <span className={classes.eventCode}>{evt.type}</span>
                  </div>
                </div>
                <div className={classes.eventDescription}>{evt.description}</div>
                <div className={classes.eventDetail}>
                  <strong>Sets status:</strong> {evt.setsStatus}
                </div>
                <div className={classes.eventDetail}>
                  <strong>Side effects:</strong> {evt.sideEffects}
                </div>
                <span className={`${classes.tag} ${
                  evt.severity === "critical"
                    ? classes.tagCritical
                    : evt.severity === "warning"
                    ? classes.tagWarning
                    : classes.tagInfo
                }`}>
                  {evt.severity}
                </span>
                {evt.example && (
                  <div className={classes.jsonBlock}>{evt.example}</div>
                )}
              </div>
            </GridItem>
          ))}
        </GridContainer>
      </div>

      {/* ================================================================ */}
      {/* PID READINGS REFERENCE */}
      {/* ================================================================ */}
      <div className={classes.section}>
        <div className={classes.sectionTitle}>
          <Memory style={{ color: "#0891B2", fontSize: "20px" }} />
          PID Readings Reference
        </div>
        <p className={classes.sectionDescription}>
          PID (Parameter ID) readings are OBD-II vehicle metrics automatically extracted
          from <code>location_update</code> and <code>device_online</code> events.
          When the GPS device sends a location update with embedded OBD data
          (rpm, fuel_level, voltage, etc.), the edge function extracts each metric and
          creates individual <code>pid_reading</code> events for tracking over time.
        </p>
        <div className={classes.card}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>Subtype</th>
                <th className={classes.th}>Unit</th>
                <th className={classes.th}>Description</th>
                <th className={classes.th}>Source Fields</th>
              </tr>
            </thead>
            <tbody>
              {pidTypes.map((pid) => (
                <tr key={pid.subtype}>
                  <td className={classes.td}>
                    <span className={classes.tdCode}>{pid.subtype}</span>
                  </td>
                  <td className={classes.td}>{pid.unit}</td>
                  <td className={classes.td}>{pid.description}</td>
                  <td className={classes.td} style={{ fontSize: "12px", color: "#9CA3AF" }}>
                    event_data.{pid.subtype}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================ */}
      {/* EVENT NORMALIZATION */}
      {/* ================================================================ */}
      <div className={classes.section}>
        <div className={classes.sectionTitle}>Event Normalization</div>
        <p className={classes.sectionDescription}>
          Some devices send proprietary event types that don&apos;t match our schema.
          The edge function automatically normalizes these before inserting. The original
          type is preserved in <code>raw_payload</code>.
        </p>
        <div className={classes.card}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>Device sends</th>
                <th className={classes.th}>&rarr;</th>
                <th className={classes.th}>Stored as</th>
                <th className={classes.th}>Subtype</th>
                <th className={classes.th}>Explanation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={classes.td}><span className={classes.tdCode}>gps_sleep</span></td>
                <td className={classes.td}>&rarr;</td>
                <td className={classes.td}><span className={classes.tdCode}>device_offline</span></td>
                <td className={classes.td}>gps_sleep</td>
                <td className={classes.td}>Device entering sleep mode (GPS off)</td>
              </tr>
              <tr>
                <td className={classes.td}><span className={classes.tdCode}>gsensor_data</span></td>
                <td className={classes.td}>&rarr;</td>
                <td className={classes.td}><span className={classes.tdCode}>pid_reading</span></td>
                <td className={classes.td}>gsensor</td>
                <td className={classes.td}>Accelerometer data from G-sensor</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================ */}
      {/* DATABASE SCHEMA */}
      {/* ================================================================ */}
      <div className={classes.section}>
        <div className={classes.sectionTitle}>Database: events table</div>
        <p className={classes.sectionDescription}>
          Every event is stored in the <code>events</code> table. Here is the complete schema:
        </p>
        <div className={classes.card} style={{ overflowX: "auto" }}>
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.th}>Column</th>
                <th className={classes.th}>Type</th>
                <th className={classes.th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["id", "uuid (PK)", "Auto-generated unique ID"],
                ["vehicle_id", "uuid (FK)", "References vehicles.id"],
                ["device_id", "uuid (FK)", "References devices.id"],
                ["event_type", "text", "One of the 12 valid event types (see above)"],
                ["event_subtype", "text (nullable)", "Additional classification: DTC code, alarm type, PID name, etc."],
                ["severity", "text", "info, warning, or critical"],
                ["latitude", "numeric", "GPS latitude (-90 to 90)"],
                ["longitude", "numeric", "GPS longitude (-180 to 180)"],
                ["speed", "numeric (nullable)", "Speed in km/h at time of event"],
                ["event_data", "jsonb (nullable)", "Structured data specific to the event type"],
                ["raw_payload", "jsonb (nullable)", "Original device payload (for normalized events)"],
                ["event_at", "timestamptz", "When the event occurred (device time)"],
                ["created_at", "timestamptz", "When the record was inserted (server time)"],
              ].map(([col, type, desc]) => (
                <tr key={col}>
                  <td className={classes.td}><span className={classes.tdCode}>{col}</span></td>
                  <td className={classes.td} style={{ fontSize: "12px", whiteSpace: "nowrap" }}>{type}</td>
                  <td className={classes.td}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "40px", paddingBottom: "40px", textAlign: "center" }}>
        <Button color="info" onClick={() => history.push("/admin/settings")}>
          Back to Settings
        </Button>
      </div>
    </div>
  );
}
