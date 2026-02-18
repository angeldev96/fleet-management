/**
 * @typedef {'superadmin' | 'admin' | 'user' | 'viewer'} UserRole
 */

/**
 * @typedef {Object} Role
 * @property {number} id
 * @property {string} name
 * @property {string} [description]
 * @property {string} created_at
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} [fleet_id]
 * @property {number} role_id
 * @property {string} [full_name]
 * @property {string} created_at
 * @property {Role} [role] - Joined role data
 * @property {Object} [fleet] - Joined fleet data
 */

/**
 * @typedef {'location_update' | 'overspeed' | 'harsh_braking' | 'harsh_acceleration' | 'harsh_cornering' | 'collision_detected' | 'dtc_detected' | 'device_online' | 'device_offline' | 'power_event' | 'pid_reading'} EventType
 */

/**
 * @typedef {'info' | 'warning' | 'critical'} Severity
 */

/**
 * @typedef {'online' | 'idle' | 'offline'} VehicleStatus
 */

/**
 * Event labels for UI display (liability-safe wording)
 */
export const EVENT_LABELS = {
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

/**
 * PID subtype labels for UI display
 */
export const PID_LABELS = {
  battery_voltage: "Battery Voltage",
  rpm: "Engine RPM",
  speed: "Vehicle Speed",
  coolant_temp: "Coolant Temperature",
  fuel_level: "Fuel Level",
  engine_load: "Engine Load",
  throttle_position: "Throttle Position",
};

/**
 * Severity colors for UI
 */
export const SEVERITY_COLORS = {
  info: { bg: "#1A73E8", text: "white" },
  warning: { bg: "#FB8C00", text: "white" },
  critical: { bg: "#F44336", text: "white" },
};

/**
 * Status colors for vehicles
 */
export const STATUS_COLORS = {
  online: "#10B981",
  idle: "#F59E0B",
  offline: "#9C27B0",
  alert: "#F44336",
  warning: "#FFB74D",
};

/**
 * Service type labels for UI display
 */
export const SERVICE_TYPE_LABELS = {
  scheduled_maintenance: "Scheduled Maintenance",
  repair: "Repair/Incident",
};

/**
 * Service status colors for UI
 */
export const SERVICE_STATUS_COLORS = {
  pending: { bg: "#FEF3C7", text: "#B45309" },
  in_progress: { bg: "#EEF2FF", text: "#4338CA" },
  completed: { bg: "#DCFCE7", text: "#15803D" },
  overdue: { bg: "#FEE2E2", text: "#B91C1C" },
};

const JAMAICA_TIMEZONE = "America/Jamaica";

function getDatePartsInTimeZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const mapped = parts.reduce((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: mapped.year,
    month: mapped.month,
    day: mapped.day,
  };
}

function isSameDateParts(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * Get vehicle status. Prefers the pre-calculated status from the
 * vehicles_with_status view. Falls back to last_seen_at + speed
 * calculation only when the status field is not available.
 * @param {string | null} lastSeenAt
 * @param {number} speed
 * @param {string} [status] - Pre-calculated status from view
 * @returns {'online' | 'idle' | 'offline'}
 */
export function getVehicleStatus(lastSeenAt, speed, status) {
  if (status) return status;
  if (!lastSeenAt) return "offline";
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (new Date(lastSeenAt) <= fiveMinutesAgo) return "offline";
  const currentSpeed = Number(speed) || 0;
  return currentSpeed > 0 ? "online" : "idle";
}

/**
 * Format relative time (e.g., "2 min ago", "3 hours ago")
 * @param {string | Date} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return "Unknown";

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

/**
 * Format date for display
 * @param {string | Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
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

/**
 * Format date only for display (Jamaica timezone)
 * @param {string | Date} date
 * @returns {string}
 */
export function formatDateOnly(date) {
  if (!date) return "Unknown";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    timeZone: JAMAICA_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
