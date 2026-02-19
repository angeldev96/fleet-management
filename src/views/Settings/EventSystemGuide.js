import React from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import {
  ArrowLeft,
  MapPin,
  Gauge,
  AlertTriangle,
  PowerOff,
  Power,
  Wrench,
  Cpu,
  BellRing,
  Circle,
} from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";

import { cn } from "lib/utils";

// ============================================================================
// EVENT TYPE DEFINITIONS
// ============================================================================

const eventTypes = [
  {
    type: "location_update",
    name: "Location Update",
    icon: MapPin,
    bgClass: "bg-blue-600",
    borderClass: "border-l-blue-600",
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
    bgClass: "bg-emerald-500",
    borderClass: "border-l-emerald-500",
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
    bgClass: "bg-gray-500",
    borderClass: "border-l-gray-500",
    severity: "info",
    description:
      "Sent when ignition/ACC is turned off. This is the NORMAL power-off -- the driver turned off the vehicle. Coordinates may be 0,0 since GPS can lose fix at shutdown.",
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
    icon: AlertTriangle,
    bgClass: "bg-red-600",
    borderClass: "border-l-red-600",
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
    icon: BellRing,
    bgClass: "bg-amber-500",
    borderClass: "border-l-amber-500",
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
    icon: Gauge,
    bgClass: "bg-orange-600",
    borderClass: "border-l-orange-600",
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
    icon: AlertTriangle,
    bgClass: "bg-orange-600",
    borderClass: "border-l-orange-600",
    severity: "warning",
    description:
      "Sudden deceleration detected by the device's accelerometer. Indicates aggressive braking that may indicate unsafe driving.",
    setsStatus: "ONLINE",
    sideEffects: "Inserts event record.",
  },
  {
    type: "harsh_acceleration",
    name: "Harsh Acceleration",
    icon: AlertTriangle,
    bgClass: "bg-orange-600",
    borderClass: "border-l-orange-600",
    severity: "warning",
    description:
      "Sudden acceleration detected. Part of driver behavior scoring along with braking and cornering events.",
    setsStatus: "ONLINE",
    sideEffects: "Inserts event record.",
  },
  {
    type: "harsh_cornering",
    name: "Harsh Cornering",
    icon: AlertTriangle,
    bgClass: "bg-orange-600",
    borderClass: "border-l-orange-600",
    severity: "warning",
    description: "Aggressive turning detected by the accelerometer.",
    setsStatus: "ONLINE",
    sideEffects: "Inserts event record.",
  },
  {
    type: "collision_detected",
    name: "Collision Detected",
    icon: AlertTriangle,
    bgClass: "bg-red-600",
    borderClass: "border-l-red-600",
    severity: "critical",
    description:
      "Severe impact detected by accelerometer. This is the highest severity event and should always trigger immediate notification.",
    setsStatus: "ONLINE",
    sideEffects: "Inserts event record. Should trigger immediate admin notification.",
  },
  {
    type: "dtc_detected",
    name: "DTC Detected",
    icon: Wrench,
    bgClass: "bg-violet-600",
    borderClass: "border-l-violet-600",
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
    icon: Cpu,
    bgClass: "bg-cyan-600",
    borderClass: "border-l-cyan-600",
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
  { subtype: "coolant_temp", unit: "\u00B0C", description: "Engine coolant temperature" },
  { subtype: "fuel_level", unit: "%", description: "Fuel tank level" },
  { subtype: "odometer", unit: "km", description: "Total distance traveled" },
  { subtype: "engine_load", unit: "%", description: "Current engine load" },
  { subtype: "throttle_position", unit: "%", description: "Throttle pedal position" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function EventSystemGuide() {
  const history = useHistory();

  return (
    <div>
      <button
        className="mb-4 text-muted-foreground cursor-pointer inline-flex items-center gap-1.5 text-sm hover:text-foreground bg-transparent border-none p-0"
        onClick={() => history.push("/admin/settings")}
      >
        <ArrowLeft className="w-[18px] h-[18px]" /> Back to Settings
      </button>

      <h1 className="text-2xl font-semibold text-foreground mb-2">Event System Guide</h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-[720px] leading-relaxed">
        Complete reference for how telemetry data flows from GPS devices into Entry.
        This covers every event type, what triggers it, how it affects vehicle status,
        and what data it carries.
      </p>

      {/* ================================================================ */}
      {/* DATA FLOW */}
      {/* ================================================================ */}
      <div className="mb-10">
        <div className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          Data Flow
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[720px]">
          GPS devices installed in vehicles send events to our server. The server
          validates, processes, and stores them. The frontend reads the processed data
          in real time.
        </p>
        <div className="flex items-center flex-wrap gap-2 mb-5">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-center min-w-[120px]">
            <div className="text-xs font-semibold text-foreground mb-1">GPS Device</div>
            <div className="text-[11px] text-muted-foreground">Sends JSON via HTTP</div>
          </div>
          <span className="text-lg text-muted-foreground">&rarr;</span>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-center min-w-[120px]">
            <div className="text-xs font-semibold text-foreground mb-1">Edge Function</div>
            <div className="text-[11px] text-muted-foreground">telemetry-ingest</div>
          </div>
          <span className="text-lg text-muted-foreground">&rarr;</span>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-center min-w-[120px]">
            <div className="text-xs font-semibold text-foreground mb-1">Database</div>
            <div className="text-[11px] text-muted-foreground">events table</div>
          </div>
          <span className="text-lg text-muted-foreground">&rarr;</span>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-center min-w-[120px]">
            <div className="text-xs font-semibold text-foreground mb-1">vehicles table</div>
            <div className="text-[11px] text-muted-foreground">status + position updated</div>
          </div>
          <span className="text-lg text-muted-foreground">&rarr;</span>
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-center min-w-[120px]">
            <div className="text-xs font-semibold text-foreground mb-1">Frontend</div>
            <div className="text-[11px] text-muted-foreground">vehicles_with_status view</div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* VEHICLE STATUS */}
      {/* ================================================================ */}
      <div className="mb-10">
        <div className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Circle className="w-4 h-4 fill-emerald-500 text-emerald-500" />
          Vehicle Status
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[720px]">
          Every vehicle has one of three statuses, set immediately by the edge function
          when an event arrives. There is also a 5-minute safety net: if no event is
          received in 5 minutes, the vehicle automatically shows as Offline.
        </p>
        <div className="bg-white rounded-xl p-5 border border-border">
          <div className="flex items-center gap-3 py-3.5 px-4 border-b border-border/50">
            <Circle className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 shrink-0" />
            <span className="text-sm font-semibold text-foreground min-w-[80px]">Online</span>
            <span className="text-[13px] text-muted-foreground flex-1">
              Vehicle is moving (speed &gt; 0). Set by <code>location_update</code> with speed,
              or driving behavior events (overspeed, harsh braking, etc.).
            </span>
          </div>
          <div className="flex items-center gap-3 py-3.5 px-4 border-b border-border/50">
            <Circle className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
            <span className="text-sm font-semibold text-foreground min-w-[80px]">Idle</span>
            <span className="text-[13px] text-muted-foreground flex-1">
              Engine is on but vehicle is not moving (speed = 0). Set by <code>location_update</code> with
              speed 0, <code>device_online</code>, or informational events like alarms.
            </span>
          </div>
          <div className="flex items-center gap-3 py-3.5 px-4">
            <Circle className="w-3.5 h-3.5 fill-purple-600 text-purple-600 shrink-0" />
            <span className="text-sm font-semibold text-foreground min-w-[80px]">Offline</span>
            <span className="text-[13px] text-muted-foreground flex-1">
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
      <div className="mb-10">
        <div className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <PowerOff className="w-5 h-5 text-red-600" />
          Device Offline vs Power Off Alarm
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[720px]">
          These two events both set the vehicle to Offline, but they mean very different things:
        </p>
        <GridContainer spacing={3}>
          <GridItem xs={12} md={6}>
            <div className="bg-white rounded-xl p-5 border border-border h-full border-l-4 border-l-gray-500">
              <div className="text-[15px] font-semibold text-foreground">device_offline (Normal)</div>
              <div className="text-[13px] text-muted-foreground leading-snug mt-2 mb-3">
                The driver turned off the ignition/ACC. This is completely normal and expected.
                Happens every time someone parks and turns off the car. No action needed.
              </div>
              <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-600 mr-1.5 mt-2">
                severity: info
              </span>
              <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-600 mr-1.5 mt-2">
                reason: disconnected
              </span>
            </div>
          </GridItem>
          <GridItem xs={12} md={6}>
            <div className="bg-white rounded-xl p-5 border border-border h-full border-l-4 border-l-red-600">
              <div className="text-[15px] font-semibold text-foreground">power_event -- Power Off Alarm</div>
              <div className="text-[13px] text-muted-foreground leading-snug mt-2 mb-3">
                The GPS device was PHYSICALLY UNPLUGGED or lost power unexpectedly.
                This could indicate tampering, theft, or a wiring issue. Should trigger an
                immediate notification to admin/super admin.
              </div>
              <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-orange-50 text-orange-600 mr-1.5 mt-2">
                severity: warning
              </span>
              <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-red-50 text-red-600 mr-1.5 mt-2">
                REQUIRES NOTIFICATION
              </span>
            </div>
          </GridItem>
        </GridContainer>
      </div>

      {/* ================================================================ */}
      {/* ALL EVENT TYPES */}
      {/* ================================================================ */}
      <div className="mb-10">
        <div className="text-lg font-semibold text-foreground mb-4">All Event Types</div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[720px]">
          Complete reference of every event type the system accepts. Each event is received
          from the GPS device, validated, and inserted into the <code>events</code> table.
        </p>
        <GridContainer spacing={3}>
          {eventTypes.map((evt) => (
            <GridItem xs={12} md={6} key={evt.type}>
              <div
                className={cn("bg-white rounded-xl p-5 border border-border h-full border-l-4", evt.borderClass)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", evt.bgClass)}
                  >
                    <evt.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-foreground">{evt.name}</div>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {evt.type}
                    </span>
                  </div>
                </div>
                <div className="text-[13px] text-muted-foreground leading-snug mb-3">{evt.description}</div>
                <div className="text-xs text-muted-foreground leading-snug">
                  <strong>Sets status:</strong> {evt.setsStatus}
                </div>
                <div className="text-xs text-muted-foreground leading-snug">
                  <strong>Side effects:</strong> {evt.sideEffects}
                </div>
                <span
                  className={cn(
                    "inline-block text-[11px] font-medium px-2 py-0.5 rounded mr-1.5 mt-2",
                    evt.severity === "critical"
                      ? "bg-red-50 text-red-600"
                      : evt.severity === "warning"
                      ? "bg-orange-50 text-orange-600"
                      : "bg-blue-50 text-blue-600"
                  )}
                >
                  {evt.severity}
                </span>
                {evt.example && (
                  <pre className="bg-slate-800 text-slate-200 rounded-lg p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre mt-3">
                    {evt.example}
                  </pre>
                )}
              </div>
            </GridItem>
          ))}
        </GridContainer>
      </div>

      {/* ================================================================ */}
      {/* PID READINGS REFERENCE */}
      {/* ================================================================ */}
      <div className="mb-10">
        <div className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-600" />
          PID Readings Reference
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[720px]">
          PID (Parameter ID) readings are OBD-II vehicle metrics automatically extracted
          from <code>location_update</code> and <code>device_online</code> events.
          When the GPS device sends a location update with embedded OBD data
          (rpm, fuel_level, voltage, etc.), the edge function extracts each metric and
          creates individual <code>pid_reading</code> events for tracking over time.
        </p>
        <div className="bg-white rounded-xl p-5 border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Subtype
                </th>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Unit
                </th>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Description
                </th>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Source Fields
                </th>
              </tr>
            </thead>
            <tbody>
              {pidTypes.map((pid) => (
                <tr key={pid.subtype}>
                  <td className="px-3 py-2.5 border-b border-border/50 text-foreground">
                    <span className="font-mono text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      {pid.subtype}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 border-b border-border/50 text-foreground">{pid.unit}</td>
                  <td className="px-3 py-2.5 border-b border-border/50 text-foreground">{pid.description}</td>
                  <td className="px-3 py-2.5 border-b border-border/50 text-xs text-muted-foreground">
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
      <div className="mb-10">
        <div className="text-lg font-semibold text-foreground mb-4">Event Normalization</div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[720px]">
          Some devices send proprietary event types that don&apos;t match our schema.
          The edge function automatically normalizes these before inserting. The original
          type is preserved in <code>raw_payload</code>.
        </p>
        <div className="bg-white rounded-xl p-5 border border-border">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Device sends
                </th>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  &rarr;
                </th>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Stored as
                </th>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Subtype
                </th>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Explanation
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">
                  <span className="font-mono text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">gps_sleep</span>
                </td>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">&rarr;</td>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">
                  <span className="font-mono text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">device_offline</span>
                </td>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">gps_sleep</td>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">Device entering sleep mode (GPS off)</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">
                  <span className="font-mono text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">gsensor_data</span>
                </td>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">&rarr;</td>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">
                  <span className="font-mono text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">pid_reading</span>
                </td>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">gsensor</td>
                <td className="px-3 py-2.5 border-b border-border/50 text-foreground">Accelerometer data from G-sensor</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================ */}
      {/* DATABASE SCHEMA */}
      {/* ================================================================ */}
      <div className="mb-10">
        <div className="text-lg font-semibold text-foreground mb-4">Database: events table</div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-[720px]">
          Every event is stored in the <code>events</code> table. Here is the complete schema:
        </p>
        <div className="bg-white rounded-xl p-5 border border-border overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Column
                </th>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Type
                </th>
                <th className="text-left px-3 py-2.5 bg-slate-50 text-muted-foreground font-semibold text-xs uppercase tracking-wide border-b-2 border-border">
                  Description
                </th>
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
                  <td className="px-3 py-2.5 border-b border-border/50 text-foreground">
                    <span className="font-mono text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">{col}</span>
                  </td>
                  <td className="px-3 py-2.5 border-b border-border/50 text-xs whitespace-nowrap text-foreground">{type}</td>
                  <td className="px-3 py-2.5 border-b border-border/50 text-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 pb-10 text-center">
        <Button color="info" onClick={() => history.push("/admin/settings")}>
          Back to Settings
        </Button>
      </div>
    </div>
  );
}
