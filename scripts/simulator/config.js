/**
 * Simulator Configuration
 *
 * Central configuration for the fleet telemetry simulator.
 * Adjust these values to control simulation behavior and data generation rates.
 *
 * FLEET ROTATION MODE (current):
 *   - Processes 1 entire fleet per minute (~100 vehicles)
 *   - ~200 events per minute (100 location + 100 PID or alert)
 *   - ~3.3 events/sec (safe for Supabase Free/Pro plans)
 *   - Full rotation with 4 fleets: 4 minutes
 */

module.exports = {

  // ─────────────────────────────────────────────────────────────────────────
  // ALERT EVENT PROBABILITIES
  // Legacy: used by generateRandomEvent() for probability-based generation.
  // Note: generateRandomEventForVehicle() uses weights instead (see generators.js)
  // ─────────────────────────────────────────────────────────────────────────
  eventProbabilities: {
    harsh_braking: 0.02,
    harsh_acceleration: 0.02,
    harsh_cornering: 0.015,
    overspeed: 0.025,
    collision_detected: 0.001,
    dtc_detected: 0.01,
    device_offline: 0.005,
    power_event: 0.005,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // OBD-II DIAGNOSTIC TROUBLE CODES (DTC)
  // Real codes that can appear in vehicle diagnostics
  // ─────────────────────────────────────────────────────────────────────────
  dtcCodes: [
    { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'warning' },
    { code: 'P0171', description: 'System Too Lean (Bank 1)', severity: 'warning' },
    { code: 'P0420', description: 'Catalyst System Efficiency Below Threshold', severity: 'warning' },
    { code: 'P0128', description: 'Coolant Thermostat Below Regulating Temperature', severity: 'warning' },
    { code: 'P0562', description: 'System Voltage Low', severity: 'critical' },
    { code: 'P0507', description: 'Idle Air Control System RPM Higher Than Expected', severity: 'warning' },
    { code: 'P0455', description: 'Evaporative Emission System Leak (Large)', severity: 'warning' },
    { code: 'P0401', description: 'Exhaust Gas Recirculation Flow Insufficient', severity: 'warning' },
    { code: 'P0442', description: 'Evaporative Emission System Leak (Small)', severity: 'warning' },
    { code: 'P0340', description: 'Camshaft Position Sensor Circuit Malfunction', severity: 'critical' },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // OBD-II PID (Parameter IDs) CONFIGURATION
  // Defines vehicle telemetry parameters to simulate
  // ─────────────────────────────────────────────────────────────────────────
  pidTypes: [
    { subtype: 'battery_voltage', unit: 'V', min: 11.5, max: 14.8 },
    { subtype: 'rpm', unit: 'RPM', min: 600, max: 4500 },
    { subtype: 'speed', unit: 'km/h', min: 0, max: 120 },
    { subtype: 'coolant_temp', unit: '°C', min: 70, max: 105 },
  ],

  // ─────────────────────────────────────────────────────────────────────────
  // VEHICLE MOVEMENT PHYSICS
  // Parameters for realistic GPS movement simulation
  // ─────────────────────────────────────────────────────────────────────────
  movement: {
    maxSpeedKmh: 80,
    maxAcceleration: 0.5,   // Speed change per update cycle
    maxTurnAngle: 30,       // Degrees per update cycle
    stopProbability: 0.1,   // Simulates traffic lights, stops, etc.
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GEOGRAPHIC BOUNDS (Jamaica)
  // Vehicles are constrained within these coordinates
  // Note: These are outer bounds; actual land validation uses jamaica-polygon.js
  // ─────────────────────────────────────────────────────────────────────────
  bounds: {
    minLat: 17.86,
    maxLat: 18.50,
    minLng: -78.35,
    maxLng: -76.18,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DATABASE CONFIGURATION
  // ─────────────────────────────────────────────────────────────────────────
  batchSize: 100, // Events per batch insert (balances throughput vs memory)
};
