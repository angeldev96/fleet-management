import React, { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useVehicles } from "hooks/useVehicles";
import "./MapPreview.css";

// Mapbox Public Access Token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN_PUBLIC;

// Kingston, Jamaica center coordinates
const JAMAICA_CENTER = {
  lng: -76.8099,
  lat: 18.0179,
  zoom: 12,
};

// Source and layer IDs
const SOURCE_ID = "vehicles-preview-source";
const CLUSTER_LAYER_ID = "clusters-preview";
const CLUSTER_COUNT_LAYER_ID = "cluster-count-preview";
const UNCLUSTERED_LAYER_ID = "unclustered-point-preview";

// Cluster configuration
const CLUSTER_MAX_ZOOM = 14;
const CLUSTER_RADIUS = 50;

// Helper function to determine vehicle status and color
// Uses the pre-calculated status from the vehicles_with_status view
const getVehicleStatus = (vehicle: any) => {
  const STATUS_MAP = {
    online: { color: "#10B981", status: "online" },
    idle: { color: "#F59E0B", status: "idle" },
    offline: { color: "#9C27B0", status: "offline" },
  };
  return STATUS_MAP[vehicle.status as keyof typeof STATUS_MAP] || STATUS_MAP.offline;
};

// Convert vehicles array to GeoJSON FeatureCollection
const vehiclesToGeoJSON = (vehicles: any) => {
  const features = vehicles
    .filter(
      (v: any) =>
        v.last_latitude && v.last_longitude && !isNaN(v.last_latitude) && !isNaN(v.last_longitude)
    )
    .map((vehicle: any) => {
      const { color, status } = getVehicleStatus(vehicle);
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [vehicle.last_longitude, vehicle.last_latitude],
        },
        properties: {
          id: vehicle.id,
          name: vehicle.name || "Unknown Vehicle",
          color: color,
          status: status,
        },
      };
    });

  return {
    type: "FeatureCollection",
    features,
  };
};

export default function MapPreview() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasFitBounds, setHasFitBounds] = useState(false);
  const history = useHistory();

  // Fetch vehicles with 30-second refresh interval (less frequent than live map)
  const { vehicles, loading } = useVehicles({ refreshInterval: 30000 });

  // Navigate to live map on click
  const handleMapClick = () => {
    history.push("/admin/live-map");
  };

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [JAMAICA_CENTER.lng, JAMAICA_CENTER.lat],
      zoom: JAMAICA_CENTER.zoom,
      interactive: false, // Disable default interactions
    });

    map.current.on("load", () => {
      // Add empty source initially
      map.current!.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
        clusterRadius: CLUSTER_RADIUS,
      });

      // Layer 1: Cluster circles
      map.current!.addLayer({
        id: CLUSTER_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#22D3EE", // Bright cyan for small clusters
            11,
            "#0EA5E9", // Vibrant sky blue for medium clusters
            51,
            "#2563EB", // Bright blue for large clusters
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            22,
            10,
            32,
            50,
            42,
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.95,
        },
      });

      // Layer 2: Cluster count text
      map.current!.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-size": 14,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Layer 3: Unclustered vehicle points
      map.current!.addLayer({
        id: UNCLUSTERED_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      setMapLoaded(true);
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update GeoJSON source when vehicles change
  useEffect(() => {
    if (!map.current || !mapLoaded || !vehicles) return;

    const source = map.current.getSource(SOURCE_ID);
    if (!source) return;

    const geojson = vehiclesToGeoJSON(vehicles);
    (source as any).setData(geojson);

    // Fit bounds on initial load
    if (!hasFitBounds && geojson.features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      geojson.features.forEach((feature: any) => {
        bounds.extend(feature.geometry.coordinates as [number, number]);
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
        duration: 1000,
      });

      setHasFitBounds(true);
    }
  }, [vehicles, mapLoaded, hasFitBounds]);

  return (
    <div className="map-preview-container">
      <div ref={mapContainer} className="map-preview-map" />

      {/* Clickable overlay */}
      <div className="map-preview-overlay" onClick={handleMapClick}>
        <div className="map-preview-hint">Click to view full map</div>
      </div>

      {loading && !vehicles?.length && (
        <div className="map-preview-loading">
          <div className="map-preview-loading-spinner" />
          <span>Loading vehicles...</span>
        </div>
      )}
    </div>
  );
}
