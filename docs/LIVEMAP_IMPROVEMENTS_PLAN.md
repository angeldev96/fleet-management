# LiveMap Improvements Plan

This document outlines the changes to address product owner feedback regarding clustering, popup details, and navigation.

## 1. Clustering Implementation
**Goal**: Handle 50+ vehicles in the same area without being messy.

### Current State
- Vehicles are rendered as individual `mapboxgl.Marker` DOM elements.
- No clustering is implemented.

### Proposed Change
Refactor `LiveMap.js` to use Mapbox GL JS **GeoJSON Source** and **Layers** instead of markers. This enables native, performant clustering.

1.  **Data Transformation**: Convert `vehicles` array to a GeoJSON FeatureCollection.
2.  **Source**: Add a source `vehicles-source` with `cluster: true`, `clusterMaxZoom: 14`, `clusterRadius: 50`.
3.  **Layers**:
    -   **Clusters Circle**: Circles colored by point count (Blue for low, Yellow for medium, Red for high).
    -   **Cluster Count**: Text layer showing the number of vehicles in the cluster.
    -   **Unclustered Point**: SymbolLayer using a truck icon.
        -   *Note*: To maintain the "heading" rotation, we will use `icon-rotate` property.
        -   *Asset*: We need a truck icon image. We can load an image into the map style or use a marker-like approach for unclustered points if strictly necessary, but SymbolLayer is better for performance.
        -   *Fallback*: If no custom icon asset is available, we will use a standard circle with an arrow or a simple shape, but we will try to load a "truck" node/image.

## 2. Popup Improvements
**Goal**: Show "Make Model" instead of "Vehicle ID" at the top.

### Changes
- Update the `createPopupContent` function (or the HTML generation logic in the new layer click handler).
- Header: `${vehicle.make} ${vehicle.model} (${vehicle.year})` (fallback to Name if missing).
- Sub-details: Driver, Plate, Speed, Last Seen.
- **Action**: Add a "View Details" button.

## 3. Navigation to Vehicle Profile
**Goal**: Click on vehicle -> Go to "Vehicles" page for details.

### Changes
- Add a button in the Popup: `<button id="btn-view-details-${id}" ...>View Details</button>`
- Add event listener to the button after popup is added to the DOM (or use event delegation).
- **Navigation**: Use `window.location.href = '/admin/vehicles'` (simplest) or `history.push('/admin/vehicles')` if accessible.
- ideally, filter the vehicle list if possible, but for now just navigating to the list is the scope.

## Verification
- **Clustering**: Zoom out to see clusters. Zoom in to see individual vehicles.
- **Popup**: distinct make/model header.
- **Navigation**: Click "View Details" takes user to `/admin/vehicles`.
