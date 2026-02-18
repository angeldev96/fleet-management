/**
 * Jamaica Land Polygon and Point-in-Polygon Validation
 *
 * This module provides geographic boundaries for Jamaica's landmass
 * to prevent GPS coordinates from being placed in the ocean.
 *
 * Uses official GADM data for accurate coastline boundaries.
 * The ray-casting algorithm determines if a point is inside the polygon.
 */

// Load official GADM GeoJSON data
const gadmData = require('./gadm_jamaica.json');

// Extract all polygons from the MultiPolygon (main island + small cays)
// GADM format: coordinates[polygonIndex][ringIndex][pointIndex] = [lng, lat]
const JAMAICA_POLYGONS = gadmData.features[0].geometry.coordinates.map(
  polygon => polygon[0] // Get outer ring of each polygon
);

/**
 * Ray-casting algorithm to determine if a point is inside a polygon.
 *
 * @param {number} lat - Latitude of the point to check
 * @param {number} lng - Longitude of the point to check
 * @param {Array} polygon - Array of [lng, lat] coordinate pairs
 * @returns {boolean} True if the point is inside the polygon
 */
function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Checks if a coordinate is on land (inside any of Jamaica's polygons).
 * Uses official GADM data which includes main island and small cays.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if the point is on land
 */
function isOnLand(lat, lng) {
  // Check against all polygons (main island + cays)
  for (const polygon of JAMAICA_POLYGONS) {
    if (isPointInPolygon(lat, lng, polygon)) {
      return true;
    }
  }
  return false;
}

/**
 * Finds the nearest point on land from a given coordinate.
 * Uses a simple search pattern moving toward the island center.
 *
 * @param {number} lat - Current latitude (possibly in water)
 * @param {number} lng - Current longitude (possibly in water)
 * @returns {Object} { lat, lng } of the nearest land point
 */
function findNearestLandPoint(lat, lng) {
  // Island approximate center (for reference direction)
  const centerLat = 18.15;
  const centerLng = -77.30;

  // If already on land, return as-is
  if (isOnLand(lat, lng)) {
    return { lat, lng };
  }

  // Move toward island center in small steps until we hit land
  const stepSize = 0.01; // ~1.1 km per step
  let currentLat = lat;
  let currentLng = lng;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    // Calculate direction toward center
    const dLat = centerLat - currentLat;
    const dLng = centerLng - currentLng;
    const distance = Math.sqrt(dLat * dLat + dLng * dLng);

    if (distance < stepSize) {
      // We're very close to center, use it
      currentLat = centerLat;
      currentLng = centerLng;
    } else {
      // Normalize and step
      currentLat += (dLat / distance) * stepSize;
      currentLng += (dLng / distance) * stepSize;
    }

    if (isOnLand(currentLat, currentLng)) {
      return { lat: currentLat, lng: currentLng };
    }
  }

  // Fallback: return island center (Kingston area)
  return { lat: 18.00, lng: -76.80 };
}

/**
 * Generates a random point on land within Jamaica.
 * Useful for initializing vehicle positions.
 *
 * @returns {Object} { lat, lng } of a random land point
 */
function getRandomLandPoint() {
  // Try random points within bounding box until we find one on land
  const minLat = 17.70, maxLat = 18.55;
  const minLng = -78.40, maxLng = -76.20;

  for (let attempts = 0; attempts < 100; attempts++) {
    const lat = Math.random() * (maxLat - minLat) + minLat;
    const lng = Math.random() * (maxLng - minLng) + minLng;

    if (isOnLand(lat, lng)) {
      return { lat, lng };
    }
  }

  // Fallback: return a known land point (Kingston)
  return { lat: 18.00, lng: -76.80 };
}

module.exports = {
  JAMAICA_POLYGONS,
  isPointInPolygon,
  isOnLand,
  findNearestLandPoint,
  getRandomLandPoint,
};
