#!/usr/bin/env node

/**
 * Fix Vehicles in Water
 *
 * This script finds all vehicles with coordinates in the water (outside Jamaica's
 * landmass) and moves them to valid land positions.
 *
 * USAGE:
 *   node scripts/simulator/fix-vehicles-in-water.js
 *
 * ENVIRONMENT:
 *   SUPABASE_URL - Project URL (or REACT_APP_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (bypasses RLS)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');
const { isOnLand, findNearestLandPoint, getRandomLandPoint } = require('./jamaica-polygon');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, prefix, msg) {
  console.log(`${color}[${prefix}]${colors.reset} ${msg}`);
}

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  log(colors.red, 'ERROR', 'Missing environment variables:');
  log(colors.red, 'ERROR', '   SUPABASE_URL (or REACT_APP_SUPABASE_URL)');
  log(colors.red, 'ERROR', '   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVehiclesInWater() {
  console.log('');
  console.log('='.repeat(60));
  log(colors.cyan, 'INFO', 'Fix Vehicles in Water - Starting...');
  console.log('='.repeat(60));
  console.log('');

  // 1. Fetch all vehicles with coordinates
  log(colors.blue, 'INFO', 'Fetching vehicles from database...');

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, name, last_latitude, last_longitude, last_heading')
    .not('last_latitude', 'is', null)
    .not('last_longitude', 'is', null);

  if (error) {
    log(colors.red, 'ERROR', `Failed to fetch vehicles: ${error.message}`);
    process.exit(1);
  }

  log(colors.green, 'OK', `Found ${vehicles.length} vehicles with coordinates`);

  // 2. Find vehicles in water
  const vehiclesInWater = [];

  for (const vehicle of vehicles) {
    const lat = parseFloat(vehicle.last_latitude);
    const lng = parseFloat(vehicle.last_longitude);

    if (!isOnLand(lat, lng)) {
      vehiclesInWater.push({
        ...vehicle,
        lat,
        lng,
      });
    }
  }

  if (vehiclesInWater.length === 0) {
    log(colors.green, 'OK', 'No vehicles found in water. All vehicles are on land!');
    console.log('');
    return;
  }

  log(colors.yellow, 'WARN', `Found ${vehiclesInWater.length} vehicles in water`);
  console.log('');

  // 3. Calculate new positions for each vehicle
  const updates = [];

  for (const vehicle of vehiclesInWater) {
    // Try to find nearest land point first
    let newPosition = findNearestLandPoint(vehicle.lat, vehicle.lng);

    // If still not on land (shouldn't happen), get a random land point
    if (!isOnLand(newPosition.lat, newPosition.lng)) {
      newPosition = getRandomLandPoint();
    }

    // Generate a new random heading since we're repositioning
    const newHeading = Math.random() * 360;

    updates.push({
      id: vehicle.id,
      name: vehicle.name,
      oldLat: vehicle.lat,
      oldLng: vehicle.lng,
      newLat: newPosition.lat,
      newLng: newPosition.lng,
      newHeading: newHeading,
    });

    log(
      colors.blue,
      'FIX',
      `${vehicle.name || vehicle.id.slice(0, 8)}: (${vehicle.lat.toFixed(4)}, ${vehicle.lng.toFixed(4)}) -> (${newPosition.lat.toFixed(4)}, ${newPosition.lng.toFixed(4)})`
    );
  }

  console.log('');

  // 4. Update vehicles in database
  log(colors.blue, 'INFO', 'Updating vehicles in database...');

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    const { error: updateError } = await supabase
      .from('vehicles')
      .update({
        last_latitude: update.newLat,
        last_longitude: update.newLng,
        last_heading: update.newHeading,
        last_seen_at: new Date().toISOString(),
      })
      .eq('id', update.id);

    if (updateError) {
      log(colors.red, 'ERROR', `Failed to update ${update.name || update.id}: ${updateError.message}`);
      errorCount++;
    } else {
      successCount++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  log(colors.cyan, 'SUMMARY', 'Fix Vehicles in Water - Complete');
  console.log('='.repeat(60));
  log(colors.green, 'OK', `Successfully updated: ${successCount} vehicles`);
  if (errorCount > 0) {
    log(colors.red, 'ERROR', `Failed to update: ${errorCount} vehicles`);
  }
  console.log('');
}

// Run the script
fixVehiclesInWater()
  .then(() => process.exit(0))
  .catch((err) => {
    log(colors.red, 'FATAL', err.message);
    process.exit(1);
  });
