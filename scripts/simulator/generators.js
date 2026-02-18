/**
 * Data Generators for Fleet Simulator
 *
 * This module generates realistic telemetry data for vehicle simulation:
 *   - GPS movement with physics-based calculations
 *   - OBD-II PID readings (battery, RPM, speed, temperature)
 *   - Alert events (harsh driving, DTC codes, collisions)
 *
 * All generators produce data structures compatible with the `events` table schema.
 */

const config = require('./config');
const { isOnLand, findNearestLandPoint } = require('./jamaica-polygon');

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// ═══════════════════════════════════════════════════════════════════════════
// GPS MOVEMENT SIMULATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculates new vehicle position based on physics simulation.
 * Uses heading-based movement with realistic speed changes and boundary constraints.
 * Validates that positions remain on land (not in water).
 *
 * @param {Object} vehicle - Vehicle record with last_latitude, last_longitude, last_speed, last_heading
 * @returns {Object} Updated position fields for the vehicles table
 */
function moveVehicle(vehicle) {
  const { movement, bounds } = config;

  let speed = vehicle.last_speed || 0;
  let heading = vehicle.last_heading || Math.random() * 360;
  let lat = parseFloat(vehicle.last_latitude);
  let lng = parseFloat(vehicle.last_longitude);

  // Ensure starting position is on land
  if (!isOnLand(lat, lng)) {
    const landPoint = findNearestLandPoint(lat, lng);
    lat = landPoint.lat;
    lng = landPoint.lng;
  }

  // Simulate traffic: random stops and speed changes
  if (Math.random() < movement.stopProbability && speed > 0) {
    speed = 0;
  } else if (speed === 0) {
    speed = randomBetween(10, 40);
  } else {
    const speedChange = randomBetween(-movement.maxAcceleration * 10, movement.maxAcceleration * 10);
    speed = clamp(speed + speedChange, 0, movement.maxSpeedKmh);
  }

  // Random heading adjustment (simulates turns)
  const headingChange = randomBetween(-movement.maxTurnAngle, movement.maxTurnAngle);
  heading = (heading + headingChange + 360) % 360;

  // Convert speed to coordinate displacement
  // Formula: 1° latitude ≈ 111km, 1° longitude ≈ 111km * cos(lat)
  const timeHours = 30 / 3600; // 30 seconds between updates
  const distanceKm = speed * timeHours;
  const distanceDegrees = distanceKm / 111;

  const headingRad = (heading * Math.PI) / 180;
  const latChange = distanceDegrees * Math.cos(headingRad);
  const lngChange = (distanceDegrees * Math.sin(headingRad)) / Math.cos((lat * Math.PI) / 180);

  let newLat = clamp(lat + latChange, bounds.minLat, bounds.maxLat);
  let newLng = clamp(lng + lngChange, bounds.minLng, bounds.maxLng);

  // Check if new position is on land
  if (isOnLand(newLat, newLng)) {
    lat = newLat;
    lng = newLng;
  } else {
    // Position is in water - try different headings to find land
    let foundLand = false;

    // Try rotating in 45-degree increments
    for (let i = 1; i <= 8 && !foundLand; i++) {
      const testHeading = (heading + i * 45) % 360;
      const testHeadingRad = (testHeading * Math.PI) / 180;
      const testLatChange = distanceDegrees * Math.cos(testHeadingRad);
      const testLngChange = (distanceDegrees * Math.sin(testHeadingRad)) / Math.cos((lat * Math.PI) / 180);

      const testLat = clamp(lat + testLatChange, bounds.minLat, bounds.maxLat);
      const testLng = clamp(lng + testLngChange, bounds.minLng, bounds.maxLng);

      if (isOnLand(testLat, testLng)) {
        lat = testLat;
        lng = testLng;
        heading = testHeading;
        foundLand = true;
      }
    }

    // If still in water, stay in place and reverse heading
    if (!foundLand) {
      heading = (heading + 180) % 360;
      speed = 0; // Stop the vehicle
    }
  }

  // Bounce off geographic boundaries
  if (lat === bounds.minLat || lat === bounds.maxLat) {
    heading = (360 - heading) % 360;
  }
  if (lng === bounds.minLng || lng === bounds.maxLng) {
    heading = (180 - heading + 360) % 360;
  }

  return {
    last_latitude: lat,
    last_longitude: lng,
    last_speed: speed,
    last_heading: heading,
    last_seen_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT GENERATORS
// All functions return objects matching the `events` table schema
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a location_update event from current vehicle state.
 * Called after moveVehicle() to record the new position.
 */
function generateLocationEvent(vehicle, device) {
  return {
    vehicle_id: vehicle.id,
    device_id: device.id,
    event_type: 'location_update',
    event_subtype: null,
    severity: 'info',
    latitude: vehicle.last_latitude,
    longitude: vehicle.last_longitude,
    speed: vehicle.last_speed,
    event_data: {
      heading: vehicle.last_heading,
      accuracy: randomBetween(3, 15), // GPS accuracy in meters
    },
    event_at: new Date().toISOString(),
  };
}

/**
 * Generates all 4 PID readings for a vehicle at once.
 * Values are context-aware: engine running vs idle affects readings.
 * Note: Currently unused - see generateSinglePidEvent for distributed generation.
 */
function generatePidEvents(vehicle, device) {
  const events = [];
  const now = new Date().toISOString();
  const isMoving = vehicle.last_speed > 5;

  for (const pid of config.pidTypes) {
    const value = calculatePidValue(pid.subtype, isMoving, vehicle.last_speed, pid);

    events.push({
      vehicle_id: vehicle.id,
      device_id: device.id,
      event_type: 'pid_reading',
      event_subtype: pid.subtype,
      severity: 'info',
      latitude: vehicle.last_latitude,
      longitude: vehicle.last_longitude,
      speed: vehicle.last_speed,
      event_data: {
        value: Math.round(value * 10) / 10,
        unit: pid.unit,
        description: pid.subtype.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      },
      event_at: now,
    });
  }

  return events;
}

/**
 * Generates a single random PID reading.
 * Used by the scheduler to distribute PID events throughout the minute.
 */
function generateSinglePidEvent(vehicle, device) {
  const now = new Date().toISOString();
  const isMoving = vehicle.last_speed > 5;
  const pid = config.pidTypes[Math.floor(Math.random() * config.pidTypes.length)];
  const value = calculatePidValue(pid.subtype, isMoving, vehicle.last_speed, pid);

  return {
    vehicle_id: vehicle.id,
    device_id: device.id,
    event_type: 'pid_reading',
    event_subtype: pid.subtype,
    severity: 'info',
    latitude: vehicle.last_latitude,
    longitude: vehicle.last_longitude,
    speed: vehicle.last_speed,
    event_data: {
      value: Math.round(value * 10) / 10,
      unit: pid.unit,
      description: pid.subtype.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    },
    event_at: now,
  };
}

/**
 * Calculates realistic PID values based on vehicle state.
 * Values change based on whether the engine is running (isMoving).
 */
function calculatePidValue(subtype, isMoving, currentSpeed, pid) {
  switch (subtype) {
    case 'battery_voltage':
      // Alternator charges at ~14V when running, ~12V when off
      return isMoving ? randomBetween(13.5, 14.5) : randomBetween(12.0, 12.8);
    case 'rpm':
      // Idle ~700 RPM, driving 1500-3500 RPM
      return isMoving ? randomBetween(1500, 3500) : randomBetween(650, 850);
    case 'speed':
      return currentSpeed || 0;
    case 'coolant_temp':
      // Operating temp ~90°C, lower when idle
      return isMoving ? randomBetween(85, 98) : randomBetween(75, 90);
    default:
      return randomBetween(pid.min, pid.max);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ALERT EVENT GENERATORS
// Simulates driver behavior events and vehicle diagnostics
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Probability-based event generator. May return null if no event triggers.
 * Uses config.eventProbabilities for each event type.
 * Note: Mostly unused - see generateRandomEventForVehicle for guaranteed generation.
 */
function generateRandomEvent(vehicle, device) {
  const { eventProbabilities } = config;

  for (const [eventType, probability] of Object.entries(eventProbabilities)) {
    if (Math.random() < probability) {
      return createEventOfType(eventType, vehicle, device);
    }
  }

  return null;
}

/**
 * Weighted random event generator. Always returns exactly one event.
 * Used by the scheduler to generate 1 alert per vehicle per minute.
 *
 * Weight distribution (total: 100):
 *   - Harsh driving events: 80% (braking, accel, cornering, overspeed)
 *   - Diagnostic events: 20% (DTC, collision, device, power)
 */
function generateRandomEventForVehicle(vehicle, device) {
  const eventWeights = [
    { type: 'harsh_braking', weight: 25 },
    { type: 'harsh_acceleration', weight: 20 },
    { type: 'harsh_cornering', weight: 15 },
    { type: 'overspeed', weight: 20 },
    { type: 'dtc_detected', weight: 10 },
    { type: 'collision_detected', weight: 2 },
    { type: 'device_offline', weight: 4 },
    { type: 'power_event', weight: 4 },
  ];

  const totalWeight = eventWeights.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  let selectedType = 'harsh_braking';

  for (const { type, weight } of eventWeights) {
    random -= weight;
    if (random <= 0) {
      selectedType = type;
      break;
    }
  }

  return createEventOfType(selectedType, vehicle, device);
}

/**
 * Factory function that builds event objects based on type.
 * Each event type has specific data fields and severity levels.
 */
function createEventOfType(eventType, vehicle, device) {
  const { dtcCodes } = config;

  // Base event structure (common to all event types)
  const event = {
    vehicle_id: vehicle.id,
    device_id: device.id,
    event_type: eventType,
    latitude: vehicle.last_latitude,
    longitude: vehicle.last_longitude,
    speed: vehicle.last_speed,
    event_at: new Date().toISOString(),
  };

  switch (eventType) {
    // Driver behavior events - measured in G-force
    case 'harsh_braking':
      event.severity = 'warning';
      event.event_subtype = null;
      event.event_data = { deceleration_g: randomBetween(0.5, 0.9) };
      break;

    case 'harsh_acceleration':
      event.severity = 'warning';
      event.event_subtype = null;
      event.event_data = { acceleration_g: randomBetween(0.45, 0.75) };
      break;

    case 'harsh_cornering':
      event.severity = 'warning';
      event.event_subtype = null;
      event.event_data = { lateral_g: randomBetween(0.4, 0.7) };
      break;

    case 'overspeed':
      event.severity = 'warning';
      event.event_subtype = null;
      const speedLimit = [50, 60, 80][Math.floor(Math.random() * 3)];
      event.event_data = {
        speed_limit: speedLimit,
        recorded_speed: speedLimit + randomBetween(10, 40),
      };
      event.speed = event.event_data.recorded_speed;
      break;

    // Critical safety event
    case 'collision_detected':
      event.severity = 'critical';
      event.event_subtype = null;
      event.event_data = {
        impact_g: randomBetween(1.5, 4.0),
        impact_direction: ['front', 'rear', 'left', 'right'][Math.floor(Math.random() * 4)],
      };
      break;

    // OBD-II diagnostic trouble code
    case 'dtc_detected':
      const dtc = dtcCodes[Math.floor(Math.random() * dtcCodes.length)];
      event.severity = dtc.severity;
      event.event_subtype = dtc.code;
      event.event_data = { dtc_description: dtc.description };
      break;

    // Device connectivity events
    case 'device_offline':
      event.severity = Math.random() < 0.3 ? 'critical' : 'warning';
      event.event_subtype = null;
      event.event_data = { offline_duration_minutes: Math.floor(randomBetween(5, 60)) };
      break;

    case 'power_event':
      event.severity = 'warning';
      event.event_subtype = ['low_battery', 'unplug', 'reconnect'][Math.floor(Math.random() * 3)];
      event.event_data = {
        battery_voltage: randomBetween(10.5, 12.0),
        event_description: event.event_subtype === 'unplug'
          ? 'Device unplugged from OBD port'
          : event.event_subtype === 'low_battery'
          ? 'Low battery voltage detected'
          : 'Device reconnected',
      };
      break;
  }

  return event;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // GPS simulation
  moveVehicle,
  generateLocationEvent,
  // PID telemetry
  generatePidEvents,
  generateSinglePidEvent,
  // Alert events
  generateRandomEvent,
  generateRandomEventForVehicle,
  // Utilities
  randomBetween,
};
