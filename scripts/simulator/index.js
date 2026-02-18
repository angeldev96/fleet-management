#!/usr/bin/env node

/**
 * Entry Fleet Simulator - Fleet Rotation Mode
 *
 * Simulates real-time telemetry data for vehicles in the database.
 * Processes one fleet per minute, rotating through all fleets.
 *
 * ARCHITECTURE (Fleet Rotation):
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  Every minute: Process ONE entire fleet (~100 vehicles)        │
 * │                                                                 │
 * │  Min 1: Fleet 1     Min 2: Fleet 2     Min 3: Fleet 3  ...     │
 * │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
 * │  │ 100 loc     │    │ 100 loc     │    │ 100 loc     │         │
 * │  │ 100 PID     │    │ 100 PID     │    │ 100 PID     │         │
 * │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
 * │         │                  │                  │                 │
 * │  Min 5: Fleet 1     Min 6: Fleet 2     Min 7: Fleet 3  ...     │
 * │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
 * │  │ 100 loc     │    │ 100 loc     │    │ 100 loc     │         │
 * │  │ 100 alert   │    │ 100 alert   │    │ 100 alert   │         │
 * │  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
 * │         └─────────────────┬┴───────────────────┘               │
 * │                           ▼                                     │
 * │                 ┌─────────────────┐                             │
 * │                 │  Supabase DB    │  ~200 events/min            │
 * │                 │  (events table) │  ~3.3 events/sec            │
 * │                 └─────────────────┘                             │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * EXPECTED THROUGHPUT:
 *   - 1 fleet per minute (~100 vehicles)
 *   - ~200 events per minute (100 location + 100 PID or alert)
 *   - ~3.3 events/sec (safe for Supabase Free/Pro plans)
 *   - Full rotation with 4 fleets: 4 minutes
 *   - Secondary event alternates each rotation: PID → Alert → PID → ...
 *
 * USAGE:
 *   node scripts/simulator/index.js
 *
 * ENVIRONMENT:
 *   SUPABASE_URL - Project URL (or REACT_APP_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 *   LOG_LEVEL - debug|info|warn|error (default: info)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const {
  moveVehicle,
  generateLocationEvent,
  generateSinglePidEvent,
  generateRandomEventForVehicle,
} = require('./generators');

// ═══════════════════════════════════════════════════════════════════════════
// RUNTIME CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING
// Color-coded console output with timestamps. Set LOG_LEVEL=debug for verbose.
// ═══════════════════════════════════════════════════════════════════════════

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

const log = {
  debug: (msg, ...args) => {
    if (LOG_LEVEL === 'debug') {
      console.log(`${colors.gray}[${timestamp()}] [DEBUG]${colors.reset} ${msg}`, ...args);
    }
  },
  info: (msg, ...args) => {
    if (['debug', 'info'].includes(LOG_LEVEL)) {
      console.log(`${colors.blue}[${timestamp()}] [INFO]${colors.reset} ${msg}`, ...args);
    }
  },
  success: (msg, ...args) => {
    console.log(`${colors.green}[${timestamp()}] [OK]${colors.reset} ${msg}`, ...args);
  },
  warn: (msg, ...args) => {
    if (['debug', 'info', 'warn'].includes(LOG_LEVEL)) {
      console.log(`${colors.yellow}[${timestamp()}] [WARN]${colors.reset} ${msg}`, ...args);
    }
  },
  error: (msg, ...args) => {
    console.error(`${colors.red}[${timestamp()}] [ERROR]${colors.reset} ${msg}`, ...args);
  },
  bottleneck: (msg, ...args) => {
    console.log(`${colors.magenta}[${timestamp()}] [⚠️ BOTTLENECK]${colors.reset} ${msg}`, ...args);
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE TRACKING
// Monitors throughput, latency, and errors for each operation type.
// Alerts when operations exceed the bottleneck threshold (5s).
// ═══════════════════════════════════════════════════════════════════════════

class PerformanceTracker {
  constructor() {
    this.metrics = {
      locationUpdates: { count: 0, totalTime: 0, errors: 0, lastBatchTime: 0 },
      pidReadings: { count: 0, totalTime: 0, errors: 0, lastBatchTime: 0 },
      alertEvents: { count: 0, totalTime: 0, errors: 0, lastBatchTime: 0 },
      vehicleUpdates: { count: 0, totalTime: 0, errors: 0, lastBatchTime: 0 },
    };
    this.startTime = Date.now();
    this.bottleneckThreshold = 5000; // Alert if operation takes >5s
  }

  /**
   * Wraps an async operation with timing and error tracking.
   * Logs a warning if the operation exceeds the bottleneck threshold.
   */
  async trackOperation(name, operation) {
    const start = Date.now();
    let result = null;
    let error = null;

    try {
      result = await operation();
    } catch (err) {
      error = err;
      this.metrics[name].errors++;
    }

    const duration = Date.now() - start;
    this.metrics[name].totalTime += duration;
    this.metrics[name].lastBatchTime = duration;

    if (duration > this.bottleneckThreshold) {
      log.bottleneck(`${name} took ${duration}ms (threshold: ${this.bottleneckThreshold}ms)`);
    }

    if (error) throw error;
    return { result, duration };
  }

  recordCount(name, count) {
    this.metrics[name].count += count;
  }

  recordError(name) {
    this.metrics[name].errors++;
  }

  /** Calculates aggregated statistics for reporting. */
  getStats() {
    const uptime = (Date.now() - this.startTime) / 1000;
    const uptimeMin = uptime / 60;

    const stats = {
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      throughput: {},
      avgLatency: {},
      errors: {},
      totals: {},
    };

    for (const [name, metric] of Object.entries(this.metrics)) {
      stats.totals[name] = metric.count;
      stats.throughput[name] = uptimeMin > 0 ? Math.round(metric.count / uptimeMin) : 0;
      stats.avgLatency[name] = metric.count > 0 ? Math.round(metric.totalTime / Math.max(1, Math.ceil(metric.count / 100))) : 0;
      stats.errors[name] = metric.errors;
    }

    stats.totalEvents = Object.values(stats.totals).reduce((a, b) => a + b, 0);
    stats.totalErrors = Object.values(stats.errors).reduce((a, b) => a + b, 0);
    stats.eventsPerSecond = uptime > 0 ? Math.round(stats.totalEvents / uptime) : 0;

    return stats;
  }

  /** Prints a formatted performance report to the console. */
  printReport() {
    const stats = this.getStats();

    console.log('\n');
    console.log('═'.repeat(70));
    console.log(`${colors.cyan}📊 PERFORMANCE REPORT${colors.reset}`);
    console.log('═'.repeat(70));
    console.log(`   Uptime: ${stats.uptime}`);
    console.log(`   Total events inserted: ${stats.totalEvents.toLocaleString()}`);
    console.log(`   Overall throughput: ${colors.green}${stats.eventsPerSecond} events/sec${colors.reset}`);
    console.log('');
    console.log('   ┌─────────────────────┬───────────┬────────────┬─────────────┬────────┐');
    console.log('   │ Operation           │ Total     │ Events/min │ Avg Latency │ Errors │');
    console.log('   ├─────────────────────┼───────────┼────────────┼─────────────┼────────┤');

    for (const [name, total] of Object.entries(stats.totals)) {
      const throughput = stats.throughput[name];
      const latency = stats.avgLatency[name];
      const errors = stats.errors[name];
      const errorColor = errors > 0 ? colors.red : colors.green;

      console.log(
        `   │ ${name.padEnd(19)} │ ${String(total).padStart(9)} │ ${String(throughput).padStart(10)} │ ${String(latency + 'ms').padStart(11)} │ ${errorColor}${String(errors).padStart(6)}${colors.reset} │`
      );
    }

    console.log('   └─────────────────────┴───────────┴────────────┴─────────────┴────────┘');

    if (stats.totalErrors > 0) {
      console.log(`\n   ${colors.red}⚠️  Total errors: ${stats.totalErrors}${colors.reset}`);
    }

    console.log('═'.repeat(70));
    console.log('');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SUPABASE CLIENT
// Uses service_role key to bypass RLS for bulk inserts.
// ═══════════════════════════════════════════════════════════════════════════

const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  log.error('Missing environment variables:');
  log.error('   SUPABASE_URL (or REACT_APP_SUPABASE_URL)');
  log.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL STATE
// In-memory cache of vehicles and devices, loaded at startup.
// ═══════════════════════════════════════════════════════════════════════════

let vehicles = [];
let deviceMap = {};           // vehicle_id -> device record
let fleetIds = [];            // Array of unique fleet IDs
let vehiclesByFleet = {};     // fleet_id -> array of vehicles
let currentFleetIndex = 0;    // Index for fleet rotation
let usePidThisCycle = true;   // Alternate between PID and alert events
const tracker = new PerformanceTracker();

// ═══════════════════════════════════════════════════════════════════════════
// DATA LOADING
// Fetches all vehicles and devices at startup. Exits if data is unavailable.
// ═══════════════════════════════════════════════════════════════════════════

async function loadVehicles() {
  log.info('Loading vehicles and devices from database...');

  const { data: vehicleData, error: vehicleError } = await supabase
    .from('vehicles')
    .select('*');

  if (vehicleError) {
    log.error('Failed to load vehicles:', vehicleError.message);
    process.exit(1);
  }

  const { data: deviceData, error: deviceError } = await supabase
    .from('devices')
    .select('*');

  if (deviceError) {
    log.error('Failed to load devices:', deviceError.message);
    process.exit(1);
  }

  // Build in-memory lookup structures
  vehicles = vehicleData;
  deviceMap = {};
  for (const device of deviceData) {
    deviceMap[device.vehicle_id] = device;
  }

  // Group vehicles by fleet for rotation
  vehiclesByFleet = {};
  for (const v of vehicles) {
    if (!vehiclesByFleet[v.fleet_id]) {
      vehiclesByFleet[v.fleet_id] = [];
    }
    vehiclesByFleet[v.fleet_id].push(v);
  }
  fleetIds = Object.keys(vehiclesByFleet);

  log.success(`Loaded ${vehicles.length} vehicles and ${deviceData.length} devices`);

  // Log fleet distribution for visibility
  log.info(`Fleet rotation order (${fleetIds.length} fleets):`);
  for (let i = 0; i < fleetIds.length; i++) {
    const fleetId = fleetIds[i];
    const count = vehiclesByFleet[fleetId].length;
    log.info(`   [${i + 1}] Fleet ${fleetId.slice(0, 8)}...: ${count} vehicles`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE OPERATIONS
// Batch inserts for all event types to minimize API calls.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Inserts events in batches of config.batchSize (default: 100).
 * Continues processing remaining batches even if one fails.
 */
async function batchInsertEvents(events, operationName) {
  if (events.length === 0) return 0;

  const batchSize = config.batchSize;
  let insertedCount = 0;

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);

    const { error } = await supabase.from('events').insert(batch);

    if (error) {
      log.error(`${operationName} batch failed: ${error.message}`);
      tracker.recordError(operationName);
    } else {
      insertedCount += batch.length;
      tracker.recordCount(operationName, batch.length);
    }
  }

  return insertedCount;
}

/**
 * Updates vehicle positions in the vehicles table.
 * Uses upsert to handle both inserts and updates.
 */
async function batchUpdateVehicles(updates) {
  if (updates.length === 0) return;

  const batchSize = config.batchSize;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    const { error } = await supabase.from('vehicles').upsert(batch, { onConflict: 'id' });

    if (error) {
      log.error(`Vehicle update batch failed: ${error.message}`);
      tracker.recordError('vehicleUpdates');
    } else {
      tracker.recordCount('vehicleUpdates', batch.length);
    }
  }
}

/**
 * Updates device heartbeat timestamps.
 * This keeps devices showing as "online" in the UI.
 */
async function batchUpdateDeviceHeartbeats(vehicleIds) {
  if (vehicleIds.length === 0) return;

  const now = new Date().toISOString();
  const batchSize = config.batchSize;

  for (let i = 0; i < vehicleIds.length; i += batchSize) {
    const batch = vehicleIds.slice(i, i + batchSize);

    const { error } = await supabase
      .from('devices')
      .update({ last_heartbeat_at: now })
      .in('vehicle_id', batch);

    if (error) {
      log.error(`Device heartbeat update failed: ${error.message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FLEET ROTATION
// Each cycle processes ONE entire fleet, then rotates to the next.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Gets all vehicles for the current fleet and advances to next fleet.
 * Returns { fleetId, vehicles } for the current fleet.
 */
function getNextFleet() {
  const fleetId = fleetIds[currentFleetIndex];
  const fleetVehicles = vehiclesByFleet[fleetId] || [];

  // Advance to next fleet (circular)
  currentFleetIndex = (currentFleetIndex + 1) % fleetIds.length;

  return { fleetId, vehicles: fleetVehicles };
}

// ═══════════════════════════════════════════════════════════════════════════
// SIMULATION PROCESSORS
// Core simulation logic: processes ONE fleet per minute with ~200 events.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Processes an entire fleet: location + secondary event for each vehicle.
 * Called every minute, rotates to the next fleet each time.
 * Secondary event alternates between PID and alert on each full rotation.
 *
 * Events per cycle: ~200 (100 location + 100 PID or 100 alert)
 */
async function processFleetCycle() {
  const { fleetId, vehicles: fleetVehicles } = getNextFleet();

  if (fleetVehicles.length === 0) {
    log.warn(`Fleet ${fleetId.slice(0, 8)}... has no vehicles, skipping`);
    return;
  }

  // Determine secondary event type (alternates each full rotation)
  const secondaryType = usePidThisCycle ? 'PID' : 'Alert';

  // When we complete a rotation (back to fleet 0), toggle the event type
  if (currentFleetIndex === 0) {
    usePidThisCycle = !usePidThisCycle;
  }

  log.info(`\n🔄 Fleet ${fleetId.slice(0, 8)}... (${fleetVehicles.length} vehicles) - Location + ${secondaryType}`);

  // Process all vehicles in this fleet
  const locationEvents = [];
  const secondaryEvents = [];
  const vehicleUpdates = [];

  for (const vehicle of fleetVehicles) {
    const device = deviceMap[vehicle.id];
    if (!device) continue;

    // Update vehicle position
    const newPosition = moveVehicle(vehicle);
    Object.assign(vehicle, newPosition);

    vehicleUpdates.push({
      id: vehicle.id,
      fleet_id: vehicle.fleet_id,
      ...newPosition
    });

    // Generate location event (always)
    locationEvents.push(generateLocationEvent(vehicle, device));

    // Generate secondary event (PID or alert, alternating each rotation)
    if (secondaryType === 'PID') {
      secondaryEvents.push(generateSinglePidEvent(vehicle, device));
    } else {
      secondaryEvents.push(generateRandomEventForVehicle(vehicle, device));
    }
  }

  // Insert all events and update vehicle/device records
  const vehicleIds = vehicleUpdates.map(v => v.id);
  const secondaryOpName = secondaryType === 'PID' ? 'pidReadings' : 'alertEvents';

  const { duration } = await tracker.trackOperation('locationUpdates', async () => {
    await Promise.all([
      batchInsertEvents(locationEvents, 'locationUpdates'),
      batchInsertEvents(secondaryEvents, secondaryOpName),
      batchUpdateVehicles(vehicleUpdates),
      batchUpdateDeviceHeartbeats(vehicleIds),
    ]);
  });

  const totalEvents = locationEvents.length + secondaryEvents.length;
  log.info(`   📍 ${totalEvents} events (${locationEvents.length} loc + ${secondaryEvents.length} ${secondaryType.toLowerCase()}) in ${duration}ms`);
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE STATS
// ═══════════════════════════════════════════════════════════════════════════

function displayLiveStats() {
  const stats = tracker.getStats();
  const line = `📊 Events: ${stats.totalEvents.toLocaleString()} | Rate: ${stats.eventsPerSecond}/sec | Errors: ${stats.totalErrors} | Uptime: ${stats.uptime}`;
  log.info(line);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// Orchestrates the simulation lifecycle:
//   1. Load data from database
//   2. Run initial location update
//   3. Start scheduled intervals for all event types
//   4. Handle graceful shutdown on Ctrl+C
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('═'.repeat(70));
  console.log(`${colors.cyan}🚗 ENTRY FLEET SIMULATOR - Fleet Rotation Mode${colors.reset}`);
  console.log('═'.repeat(70));
  console.log('');

  await loadVehicles();

  if (vehicles.length === 0) {
    log.error('No vehicles found in database. Exiting.');
    process.exit(1);
  }

  if (fleetIds.length === 0) {
    log.error('No fleets found. Exiting.');
    process.exit(1);
  }

  // Calculate timing for full rotation
  const cycleIntervalMs = 60 * 1000; // 1 minute per fleet
  const avgVehiclesPerFleet = Math.round(vehicles.length / fleetIds.length);
  const eventsPerCycle = avgVehiclesPerFleet * 2; // location + (PID or alert)
  const fullRotationMin = fleetIds.length; // 1 minute per fleet

  console.log('');
  log.info('Fleet Rotation Configuration:');
  log.info(`   Total fleets: ${fleetIds.length}`);
  log.info(`   Total vehicles: ${vehicles.length}`);
  log.info(`   Avg vehicles/fleet: ~${avgVehiclesPerFleet}`);
  log.info(`   Cycle interval: 1 minute (1 fleet per minute)`);
  log.info(`   ${colors.yellow}Events per minute: ~${eventsPerCycle} (${avgVehiclesPerFleet} loc + ${avgVehiclesPerFleet} PID/alert)${colors.reset}`);
  log.info(`   Full rotation: ${fullRotationMin} min (all fleets processed)`);
  log.info(`   Secondary event alternates: PID → Alert → PID → ...`);
  console.log('');
  log.info('Press Ctrl+C to stop and see final report');
  console.log('');

  // Run initial fleet cycle immediately
  log.info('Running initial fleet cycle...');
  await processFleetCycle();
  log.success('Initial cycle complete');

  // ─────────────────────────────────────────────────────────────────────────
  // INTERVAL SETUP - Fleet Rotation
  // Processes one entire fleet every minute, rotating through all fleets.
  // ─────────────────────────────────────────────────────────────────────────

  log.info(`Cycle interval: ${cycleIntervalMs / 1000}s (1 min per fleet)`);

  // Main cycle: process one fleet every minute
  const fleetInterval = setInterval(async () => {
    try {
      await processFleetCycle();
    } catch (err) {
      log.error('Fleet cycle failed:', err.message);
    }
  }, cycleIntervalMs);

  // Live stats: every 2 minutes
  const statsInterval = setInterval(displayLiveStats, 2 * 60 * 1000);

  // Full report: every 10 minutes
  const reportInterval = setInterval(() => {
    tracker.printReport();
  }, 10 * 60 * 1000);

  // ─────────────────────────────────────────────────────────────────────────
  // GRACEFUL SHUTDOWN
  // ─────────────────────────────────────────────────────────────────────────

  process.on('SIGINT', () => {
    console.log('\n');
    log.warn('Received SIGINT, shutting down...');

    clearInterval(fleetInterval);
    clearInterval(statsInterval);
    clearInterval(reportInterval);

    tracker.printReport();
    log.info('Simulator stopped.');
    process.exit(0);
  });

  process.on('uncaughtException', (err) => {
    log.error('Uncaught exception:', err);
  });

  process.on('unhandledRejection', (reason) => {
    log.error('Unhandled rejection:', reason);
  });
}

// Start the simulator
main().catch((err) => {
  log.error('Fatal error:', err);
  process.exit(1);
});
