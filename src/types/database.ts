// ── Union types ──────────────────────────────────────────────────────────────

export type UserRole = "superadmin" | "admin" | "user" | "viewer";

export type EventType =
  | "location_update"
  | "overspeed"
  | "harsh_braking"
  | "harsh_acceleration"
  | "harsh_cornering"
  | "collision_detected"
  | "dtc_detected"
  | "device_online"
  | "device_offline"
  | "power_event"
  | "pid_reading";

export type Severity = "info" | "warning" | "critical";

export type VehicleStatus = "online" | "idle" | "offline";

export type ServiceStatus = "pending" | "in_progress" | "completed" | "overdue";

export type ServiceType = "scheduled_maintenance" | "repair";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface Role {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface Fleet {
  id: string;
  name: string;
  logo_url?: string;
}

export interface UserProfile {
  id: string;
  fleet_id?: string;
  role_id: number;
  full_name?: string;
  created_at: string;
  role?: Role;
  fleet?: Fleet;
}

export interface Vehicle {
  id: string;
  fleet_id: string;
  name: string;
  plate_number?: string;
  make?: string;
  model?: string;
  year?: number;
  driver_name?: string;
  created_at: string;
  status?: VehicleStatus;
  last_latitude?: number;
  last_longitude?: number;
  last_speed?: number;
  last_heading?: number;
  last_seen_at?: string;
  /** Joined from devices table */
  imei?: string;
}

export interface Device {
  id: string;
  vehicle_id: string;
  imei: string;
  serial_number?: string;
  firmware_version?: string;
  last_heartbeat_at?: string;
  created_at: string;
}

export interface TelemetryEvent {
  id: string;
  vehicle_id: string;
  event_type: EventType;
  event_subtype?: string;
  event_data?: Record<string, any>;
  severity: Severity;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  event_at: string;
  created_at: string;
  vehicles?: Vehicle;
}

export interface ServiceEvent {
  id: string;
  vehicle_id: string;
  service_type: ServiceType;
  service_date: string;
  service_items?: string;
  status?: string;
  computed_status?: ServiceStatus;
  mileage?: number;
  location?: string;
  cost?: number;
  notes?: string;
  vehicle_name?: string;
  plate_number?: string;
  fleet_id?: string;
}

export interface ServiceResult<T = any> {
  data: T | null;
  error: Error | null;
}

export interface BatchResult {
  successCount: number;
  errorCount: number;
  errors: string[];
}

// ── Constants ────────────────────────────────────────────────────────────────

export const EVENT_LABELS: Record<EventType, string> = {
  location_update: "Location Update",
  overspeed: "Speed Threshold Exceeded",
  harsh_braking: "Harsh Braking Detected",
  harsh_acceleration: "Rapid Acceleration Detected",
  harsh_cornering: "Harsh Cornering Detected",
  collision_detected: "Potential Collision Detected",
  dtc_detected: "Vehicle Diagnostic Fault",
  device_online: "Device Online",
  device_offline: "Device Not Reporting",
  power_event: "Power Event",
  pid_reading: "Vehicle Telemetry",
};

export const PID_LABELS: Record<string, string> = {
  battery_voltage: "Battery Voltage",
  rpm: "Engine RPM",
  speed: "Vehicle Speed",
  coolant_temp: "Coolant Temperature",
  fuel_level: "Fuel Level",
  engine_load: "Engine Load",
  throttle_position: "Throttle Position",
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  scheduled_maintenance: "Scheduled Maintenance",
  repair: "Repair/Incident",
};

export const SERVICE_STATUS_CLASSES: Record<ServiceStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
};

// ── Utilities ────────────────────────────────────────────────────────────────

const JAMAICA_TIMEZONE = "America/Jamaica";

interface DateParts {
  year: string;
  month: string;
  day: string;
}

function getDatePartsInTimeZone(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const mapped = parts.reduce(
    (acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    year: mapped.year,
    month: mapped.month,
    day: mapped.day,
  };
}

function isSameDateParts(a: DateParts, b: DateParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return "Unknown";

  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

export function formatDateTime(date: string | Date | null): string {
  if (!date) return "Unknown";
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateParts = getDatePartsInTimeZone(d, JAMAICA_TIMEZONE);
  const todayParts = getDatePartsInTimeZone(today, JAMAICA_TIMEZONE);
  const yesterdayParts = getDatePartsInTimeZone(yesterday, JAMAICA_TIMEZONE);

  const timeStr = d.toLocaleTimeString("en-US", {
    timeZone: JAMAICA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (isSameDateParts(dateParts, todayParts)) {
    return `Today at ${timeStr}`;
  } else if (isSameDateParts(dateParts, yesterdayParts)) {
    return `Yesterday at ${timeStr}`;
  } else {
    return (
      d.toLocaleDateString("en-US", {
        timeZone: JAMAICA_TIMEZONE,
        month: "short",
        day: "numeric",
      }) + ` at ${timeStr}`
    );
  }
}

export function formatDateOnly(date: string | Date | null): string {
  if (!date) return "Unknown";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    timeZone: JAMAICA_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
