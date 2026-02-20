import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useVehicles } from "hooks/useVehicles";
import { useHistory } from "react-router-dom";
import "./LiveMap.css";

// Mapbox Public Access Token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN_PUBLIC;

// Kingston, Jamaica center coordinates
const JAMAICA_CENTER = {
  lng: -76.8099,
  lat: 18.0179,
  zoom: 12,
};

// Source and layer IDs
const SOURCE_ID = "vehicles-source";
const CLUSTER_LAYER_ID = "clusters";
const CLUSTER_COUNT_LAYER_ID = "cluster-count";
const UNCLUSTERED_LAYER_ID = "unclustered-point";

// Cluster configuration
const CLUSTER_MAX_ZOOM = 14;
const CLUSTER_RADIUS = 50;

// Helper function to format relative time
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return "Unknown";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

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
const vehiclesToGeoJSON = (vehicles: any[]) => {
  const features = vehicles
    .filter(
      (v) =>
        v.last_latitude && v.last_longitude && !isNaN(v.last_latitude) && !isNaN(v.last_longitude)
    )
    .map((vehicle) => {
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
          make: vehicle.make || "",
          model: vehicle.model || "",
          year: vehicle.year || "",
          plate_number: vehicle.plate_number || "",
          driver_name: vehicle.driver_name || "",
          last_speed: vehicle.last_speed || 0,
          last_heading: vehicle.last_heading || 0,
          last_seen_at: vehicle.last_seen_at || "",
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

// Helper function to create popup content with View Details button
function createPopupContent(properties: any) {
  const title =
    properties.make && properties.model
      ? `${properties.make} ${properties.model}${properties.year ? ` (${properties.year})` : ""}`
      : properties.name;

  const speedDisplay = properties.last_speed ? `${Math.round(properties.last_speed)} km/h` : "N/A";

  return `
    <div class="vehicle-popup">
      <h3 class="vehicle-popup-title">${title}</h3>
      <div class="vehicle-popup-subtitle">${properties.name}</div>
      <div class="vehicle-popup-details">
        ${
          properties.plate_number
            ? `<div><strong>Plate:</strong> ${properties.plate_number}</div>`
            : ""
        }
        ${
          properties.driver_name
            ? `<div><strong>Driver:</strong> ${properties.driver_name}</div>`
            : ""
        }
        <div><strong>Speed:</strong> ${speedDisplay}</div>
        <div><strong>Status:</strong> <span class="status-badge status-${properties.status}">${
    properties.status.charAt(0).toUpperCase() + properties.status.slice(1)
  }</span></div>
        <div><strong>Last Seen:</strong> ${formatRelativeTime(properties.last_seen_at)}</div>
      </div>
      <button class="vehicle-popup-btn" data-vehicle-id="${properties.id}">
        View Details
      </button>
    </div>
  `;
}

export default function LiveMap() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasFitBounds, setHasFitBounds] = useState(false);
  const history = useHistory();

  // Fetch all vehicles with 10-second refresh interval (no pagination for map)
  const { vehicles, loading } = useVehicles({ refreshInterval: 10000, fetchAll: true });

  // Navigate to vehicle details
  const handleViewDetails = useCallback(
    (vehicleId: any) => {
      history.push(`/admin/vehicle/${vehicleId}`);
    },
    [history]
  );

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [JAMAICA_CENTER.lng, JAMAICA_CENTER.lat],
      zoom: JAMAICA_CENTER.zoom,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

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
            "#22D3EE", // Bright cyan for small clusters (2-10)
            11,
            "#0EA5E9", // Vibrant sky blue for medium clusters (11-50)
            51,
            "#2563EB", // Bright blue for large clusters (51+)
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            22, // 22px for < 10
            10,
            32, // 32px for 11-50
            50,
            42, // 42px for 51+
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

      // Layer 3: Unclustered vehicle points (Simple dots)
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

    // Click on cluster -> zoom in
    map.current.on("click", CLUSTER_LAYER_ID, (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: [CLUSTER_LAYER_ID],
      });
      const clusterId = features[0].properties!.cluster_id;
      (map.current!.getSource(SOURCE_ID) as any).getClusterExpansionZoom(clusterId, (err: any, zoom: any) => {
        if (err) return;
        map.current!.easeTo({
          center: (features[0].geometry as any).coordinates,
          zoom: zoom,
        });
      });
    });

    // Click on unclustered vehicle -> show popup
    map.current.on("click", UNCLUSTERED_LAYER_ID, (e) => {
      const coordinates = (e.features![0].geometry as any).coordinates.slice();
      const properties = e.features![0].properties;

      // Ensure that if the map is zoomed out, popup appears at correct location
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      // Close existing popup
      if (popupRef.current) {
        popupRef.current.remove();
      }

      // Create new popup
      popupRef.current = new mapboxgl.Popup({
        offset: 15,
        closeButton: true,
        maxWidth: "320px",
      })
        .setLngLat(coordinates)
        .setHTML(createPopupContent(properties))
        .addTo(map.current!);

      // Add click listener for View Details button after popup is added
      setTimeout(() => {
        const btn = document.querySelector(`[data-vehicle-id="${properties!.id}"]`);
        if (btn) {
          btn.addEventListener("click", () => {
            handleViewDetails(properties!.id);
          });
        }
      }, 0);
    });

    // Change cursor on hover
    map.current.on("mouseenter", CLUSTER_LAYER_ID, () => {
      map.current!.getCanvas().style.cursor = "pointer";
    });
    map.current.on("mouseleave", CLUSTER_LAYER_ID, () => {
      map.current!.getCanvas().style.cursor = "";
    });
    map.current.on("mouseenter", UNCLUSTERED_LAYER_ID, () => {
      map.current!.getCanvas().style.cursor = "pointer";
    });
    map.current.on("mouseleave", UNCLUSTERED_LAYER_ID, () => {
      map.current!.getCanvas().style.cursor = "";
    });

    // Cleanup on unmount
    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [handleViewDetails]);

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
      geojson.features.forEach((feature) => {
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
    <div className="livemap-container">
      <div ref={mapContainer} className="livemap-map" />
      {loading && !vehicles?.length && (
        <div className="livemap-loading">
          <div className="livemap-loading-spinner" />
          <span>Loading vehicles...</span>
        </div>
      )}
      <div className="livemap-legend">
        <div className="legend-title">Vehicle Status</div>
        <div className="legend-item">
          <span className="legend-color bg-emerald-500" />
          <span>Online</span>
        </div>
        <div className="legend-item">
          <span className="legend-color bg-amber-500" />
          <span>Idle</span>
        </div>
        <div className="legend-item">
          <span className="legend-color bg-red-500" />
          <span>Fault / Event</span>
        </div>
        <div className="legend-item">
          <span className="legend-color bg-purple-600" />
          <span>Offline</span>
        </div>
        <div className="legend-divider" />
        <div className="legend-title">Clusters</div>
        <div className="legend-item">
          <span className="legend-color legend-cluster bg-cyan-400" />
          <span>2-10 vehicles</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-cluster bg-sky-500" />
          <span>11-50 vehicles</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-cluster bg-blue-600" />
          <span>51+ vehicles</span>
        </div>
      </div>
    </div>
  );
}
