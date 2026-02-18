# Vehicle Details Page Implementation Plan

This plan details the creation of a dedicated page for individual vehicle details, providing a comprehensive view of status, telemetry, and recent activity.

## User Review Required

> [!IMPORTANT]
> The page will be accessible via `/admin/vehicle/:id`. New routes will be added to `routes.js`.

## Proposed Changes

### [Component Name] View Layer

#### [NEW] [VehicleDetails.js](file:///c:/Users/ariva/Desktop/BlackSigma/entrymvp-frontend/src/views/Vehicles/VehicleDetails.js)
A new view component that will:
- Use `useVehicle(id)` from `useVehicles.js` for core data.
- Fetch recent events from the `events` table.
- Display a summary card (Make, Model, Year, Plate, VIN, Driver).
- Display real-time status (Battery, Signal, Last Seen, Speed).
- Show a small Mapbox map with the current location.
- List recent events (Overspeeding, Harsh Braking, etc.) in a table or timeline.

### [Component Name] Routing

#### [MODIFY] [routes.js](file:///c:/Users/ariva/Desktop/BlackSigma/entrymvp-frontend/src/routes.js)
Add the detail route:
```javascript
{
  path: "/vehicle/:id",
  name: "Vehicle Details",
  component: VehicleDetails,
  layout: "/admin",
  hide: true // Hidden from sidebar
}
```

### [Component Name] Navigation

#### [MODIFY] [LiveMap.js](file:///c:/Users/ariva/Desktop/BlackSigma/entrymvp-frontend/src/views/LiveMap/LiveMap.js)
Update the popup to include a "View Details" button that links to `/admin/vehicle/${id}`.

#### [MODIFY] [Vehicles.js](file:///c:/Users/ariva/Desktop/BlackSigma/entrymvp-frontend/src/views/Vehicles/Vehicles.js)
Update the "View" button in the table to link to `/admin/vehicle/${id}`.

## Verification Plan

### Manual Verification
1.  Navigate to Live Map, click a vehicle, and verify the "View Details" button works.
2.  Navigate to Vehicles list, click "View" on a row, and verify it takes you to the correct detail page.
3.  Verify the Detail Page shows:
    -   Correct vehicle name/stats.
    -   Current location on map.
    -   Recent events list.
