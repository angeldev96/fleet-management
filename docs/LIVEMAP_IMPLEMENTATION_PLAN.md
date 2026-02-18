# LiveMap Implementation Plan

This document outlines the plan to implement real-time vehicle tracking on the LiveMap view using the existing Supabase infrastructure and Mapbox GL JS.

## 1. Context & Analysis

### Database Schema
The `vehicles` table already contains the necessary columns for tracking:
- **Location**: `last_latitude`, `last_longitude`
- **Orientation**: `last_heading`
- **Telemetry**: `last_speed`, `last_seen_at`
- **Identity**: `name`, `plate_number`, `driver_name`, `make`, `model`

These columns are updated by the backend/ingestion service when new events arrive.

### Architecture
- **Data Hook**: The existing `useVehicles` hook in `src/hooks/useVehicles.js` polls the `vehicles_with_status` view every 30 seconds (default). This hook returns the full vehicle object, including the location columns mentioned above.
- **Map Component**: `src/views/LiveMap/LiveMap.js` initializes a Mapbox GL map but currently does not render any data.

## 2. Implementation Steps

### Step 1: Integrate Data Fetching in `LiveMap.js`
- Import the `useVehicles` hook into `src/views/LiveMap/LiveMap.js`.
- Configure the hook with a reasonable refresh interval (e.g., 10-15 seconds) to balance "live" feel with API usage.

```javascript
const { vehicles, loading } = useVehicles({ refreshInterval: 10000 });
```

### Step 2: Implement Marker Management Logic
Since React re-renders can be frequent, we need to manage Mapbox markers carefully to avoid destroying and recreating them on every update (which causes flickering).

- **State Management**: Use a `useRef` to store references to active Mapbox markers, keyed by `vehicle.id`.
  ```javascript
  const markersRef = useRef({}); // { [vehicleId]: mapboxgl.Marker }
  ```

- **Update Effect**: create a `useEffect` that runs whenever the `vehicles` array changes.
  - **Create**: If a vehicle in the array does not have a marker in `markersRef`, create one.
  - **Update**: If a vehicle has an existing marker, update its position (`setLngLat`) and rotation.
  - **Remove**: Identify vehicle IDs that are in `markersRef` but no longer in the `vehicles` array (if applicable) and remove them.

### Step 3: Design Vehicle Markers
- Create a custom HTML element for the marker to allow styling (CSS) and rotation.
- **Visuals**:
  - Use a distinct icon (e.g., a truck SVG or FontAwesome icon).
  - Rotate the icon element based on `last_heading` to show direction of travel.
  - Color-code the marker based on status (e.g., Green for moving, Red for alert, Grey for offline), if status logic is available in `useVehicles`.

### Step 4: Add Popups
- Attach a `mapboxgl.Popup` to each marker.
- **Content**:
  - Vehicle Name / Plate
  - Driver Name
  - Current Speed (`last_speed` km/h)
  - Last Seen (relative time)

### Step 5: Map Controls & UX
- **Fit Bounds**: On the *initial* load (when vehicles first arrive), automatically adjust the map view (zoom/center) to fit all vehicles so the user sees the whole fleet.
- **Safety Check**: Ensure we only try to plot vehicles with valid numeric `lat` and `lng`.

## 3. Code Structure Preview

```javascript
// Inside LiveMap.js

// 1. Fetch data
const { vehicles } = useVehicles({ refreshInterval: 10000 });
const markersRef = useRef({});

// 2. Sync markers
useEffect(() => {
  if (!map.current || !vehicles) return;

  vehicles.forEach(vehicle => {
    const { id, last_latitude, last_longitude, last_heading } = vehicle;
    
    // Skip invalid coordinates
    if (!last_latitude || !last_longitude) return;

    if (markersRef.current[id]) {
        // UPDATE existing marker
        markersRef.current[id].setLngLat([last_longitude, last_latitude]);
        // Update rotation logic here...
    } else {
        // CREATE new marker
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        // ... set innerHTML or background image ...

        const marker = new mapboxgl.Marker(el)
            .setLngLat([last_longitude, last_latitude])
            .setPopup(new mapboxgl.Popup().setHTML(...))
            .addTo(map.current);
            
        markersRef.current[id] = marker;
    }
  });
  
  // Cleanup removed vehicles...
}, [vehicles]);
```

## 4. Dependencies
- No new NPM packages are strictly required.
- `mapbox-gl` CSS is already imported.
- `styles/mapbox/streets-v12` is already configured.

## 5. Next Actions
1. Apply changes to `src/views/LiveMap/LiveMap.js`.
2. Add CSS for `.vehicle-marker` class in the appropriate stylesheet (or inline styles).
3. Test with live data.
