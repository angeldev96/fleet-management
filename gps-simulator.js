/**
 * GPS Device Simulator - Sinocastel D-218L
 *
 * Simulates a GPS device sending location updates every 15 seconds
 * Inserts into events table and updates vehicles table
 *
 * Usage:
 *   node gps-simulator.js
 *
 * Requirements:
 *   - .env file with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
 *   - Vehicle and device must exist in database
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// ============================================
// CONFIGURATION
// ============================================

// Vehicle to simulate (from testdata_jamaica.sql)
const VEHICLE_ID = "a1b2c3d4-1111-4000-8000-000000000001"; // Vehicle 023
const DEVICE_ID = "b1b2c3d4-1111-4000-8000-000000000001";
const IMEI = "861234500000001";

// Supabase client (uses SERVICE_ROLE_KEY to bypass RLS, like real IoT devices)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error("   Make sure REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set");
  console.error("   Get service_role key from: Supabase Dashboard → Settings → API");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulation interval (15 seconds)
const INTERVAL_MS = 15000;

// ============================================
// ROUTE DEFINITION (Kingston, Jamaica)
// ============================================
// Simulates a route from Downtown Kingston to Portmore
// Each step represents ~15 seconds of travel

const route = [
  // Downtown Kingston
  { lat: 18.0179, lng: -76.8099, speed: 0, heading: 180 }, // Start (stopped)
  { lat: 18.0175, lng: -76.8105, speed: 25, heading: 225 }, // Accelerating
  { lat: 18.0165, lng: -76.812, speed: 45, heading: 225 }, // Moving
  { lat: 18.015, lng: -76.814, speed: 55, heading: 225 }, // Highway
  { lat: 18.0135, lng: -76.816, speed: 60, heading: 225 },
  { lat: 18.012, lng: -76.818, speed: 60, heading: 225 },
  { lat: 18.0105, lng: -76.82, speed: 55, heading: 225 }, // Slowing
  { lat: 18.009, lng: -76.822, speed: 45, heading: 225 },
  { lat: 18.0075, lng: -76.824, speed: 35, heading: 225 },
  { lat: 18.006, lng: -76.826, speed: 30, heading: 225 },
  { lat: 18.005, lng: -76.828, speed: 20, heading: 225 }, // Approaching intersection
  { lat: 18.0045, lng: -76.829, speed: 0, heading: 225 }, // Stopped at light
  { lat: 18.004, lng: -76.83, speed: 15, heading: 225 }, // Starting again
  { lat: 18.003, lng: -76.832, speed: 40, heading: 225 },
  { lat: 18.0015, lng: -76.8345, speed: 50, heading: 225 },
  { lat: 18.0, lng: -76.837, speed: 55, heading: 225 },
  { lat: 17.9985, lng: -76.8395, speed: 60, heading: 225 },
  { lat: 17.997, lng: -76.842, speed: 60, heading: 225 },
  { lat: 17.9955, lng: -76.8445, speed: 55, heading: 225 },
  { lat: 17.994, lng: -76.847, speed: 45, heading: 225 }, // Slowing down
  { lat: 17.993, lng: -76.849, speed: 30, heading: 225 },
  { lat: 17.9925, lng: -76.85, speed: 15, heading: 225 }, // Arriving
  { lat: 17.992, lng: -76.8505, speed: 0, heading: 225 }, // Destination (Portmore area)
];

// ============================================
// STATE
// ============================================
let currentStep = 0;
let totalEvents = 0;

// ============================================
// FUNCTIONS
// ============================================

/**
 * Generate realistic OBD/telemetry data based on speed
 */
function generateTelemetry(speed) {
  const isMoving = speed > 0;

  return {
    battery_voltage: (12.4 + Math.random() * 0.4).toFixed(1),
    rpm: isMoving
      ? Math.floor(1500 + speed * 40 + Math.random() * 200)
      : Math.floor(700 + Math.random() * 100),
    coolant_temp: Math.floor(85 + Math.random() * 15),
    fuel_level: Math.floor(50 + Math.random() * 30),
    odometer: 45230 + currentStep * 0.25, // Incremental odometer
    throttle: isMoving ? Math.floor((speed / 100) * 60 + Math.random() * 20) : 0,
  };
}

/**
 * Generate raw payload (simulates D-218L protocol packet)
 */
function generateRawPayload(position, telemetry) {
  return {
    packet_type: "0x4001",
    imei: IMEI,
    timestamp_utc: new Date().toISOString(),
    gps: {
      lat: position.lat,
      lng: position.lng,
      speed_kmh: position.speed,
      heading: position.heading,
      altitude: Math.floor(10 + Math.random() * 20),
      hdop: (0.8 + Math.random() * 0.4).toFixed(1),
      satellites: Math.floor(8 + Math.random() * 4),
    },
    obd: {
      rpm: telemetry.rpm,
      speed: position.speed,
      coolant_temp: telemetry.coolant_temp,
      throttle: telemetry.throttle,
      voltage: parseFloat(telemetry.battery_voltage),
      fuel_level: telemetry.fuel_level,
      odometer: telemetry.odometer,
    },
    gsm: {
      signal: Math.floor(70 + Math.random() * 30),
      mcc: 338, // Jamaica
      mnc: 50,
    },
  };
}

/**
 * Send GPS update to database
 */
async function sendGPSUpdate() {
  const position = route[currentStep];
  const telemetry = generateTelemetry(position.speed);
  const rawPayload = generateRawPayload(position, telemetry);
  const now = new Date().toISOString();

  console.log(`\n📍 [${new Date().toLocaleTimeString()}] Step ${currentStep + 1}/${route.length}`);
  console.log(`   Position: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`);
  console.log(`   Speed: ${position.speed} km/h | Heading: ${position.heading}°`);

  try {
    // 1. INSERT into events table
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .insert({
        vehicle_id: VEHICLE_ID,
        device_id: DEVICE_ID,
        event_type: "location_update",
        severity: "info",
        latitude: position.lat,
        longitude: position.lng,
        speed: position.speed,
        event_data: telemetry,
        raw_payload: rawPayload,
        event_at: now,
      })
      .select();

    if (eventError) {
      console.error("   ❌ Error inserting event:", eventError.message);
      return;
    }

    console.log("   ✅ Event inserted");

    // 2. UPDATE vehicles table (last position)
    const { data: vehicleData, error: vehicleError } = await supabase
      .from("vehicles")
      .update({
        last_latitude: position.lat,
        last_longitude: position.lng,
        last_speed: position.speed,
        last_heading: position.heading,
        last_seen_at: now,
      })
      .eq("id", VEHICLE_ID)
      .select();

    if (vehicleError) {
      console.error("   ❌ Error updating vehicle:", vehicleError.message);
      return;
    }

    console.log("   ✅ Vehicle updated");
    totalEvents++;

    // Move to next position (loop back to start if finished)
    currentStep = (currentStep + 1) % route.length;

    if (currentStep === 0) {
      console.log("\n🔄 Route completed! Restarting from beginning...\n");
    }
  } catch (error) {
    console.error("   ❌ Unexpected error:", error);
  }
}

/**
 * Start the simulator
 */
async function startSimulator() {
  console.log("🚀 GPS Device Simulator Started");
  console.log("================================");
  console.log(`Vehicle ID: ${VEHICLE_ID}`);
  console.log(`Device ID: ${DEVICE_ID}`);
  console.log(`IMEI: ${IMEI}`);
  console.log(`Interval: ${INTERVAL_MS / 1000} seconds`);
  console.log(`Route: ${route.length} waypoints (Downtown Kingston → Portmore)`);
  console.log("================================\n");

  // Send first update immediately
  await sendGPSUpdate();

  // Then send updates every 15 seconds
  setInterval(sendGPSUpdate, INTERVAL_MS);
}

// ============================================
// MAIN
// ============================================

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n🛑 Simulator stopped");
  console.log(`📊 Total events sent: ${totalEvents}`);
  process.exit(0);
});

// Start the simulator
startSimulator();
