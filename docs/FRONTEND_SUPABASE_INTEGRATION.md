# Frontend-Supabase Integration Guide

> **Date**: January 2026
> **Purpose**: Document the integration between the React frontend and Supabase backend for the Entry MVP fleet intelligence platform.

---

## Overview

This document explains how the frontend views were connected to real data from Supabase, replacing the hardcoded mock data that was previously used during UI development.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Views     │  │   Hooks     │  │   Types     │         │
│  │  (UI Layer) │◄─│ (Data Layer)│◄─│ (Utilities) │         │
│  └─────────────┘  └──────┬──────┘  └─────────────┘         │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │  Supabase   │                           │
│                   │   Client    │                           │
│                   └──────┬──────┘                           │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │   Supabase Backend     │
              │  ┌──────────────────┐  │
              │  │    PostgreSQL    │  │
              │  │  - vehicles      │  │
              │  │  - devices       │  │
              │  │  - events        │  │
              │  │  - fleets        │  │
              │  └──────────────────┘  │
              └────────────────────────┘
```

---

## Files Created

### 1. Types and Utilities (`src/types/database.js`)

Contains shared constants and utility functions used across the application:

```javascript
// Event labels for UI display (liability-safe wording)
export const EVENT_LABELS = {
  harsh_braking: 'Harsh Braking Detected',
  collision_detected: 'Potential Collision Detected',
  dtc_detected: 'Vehicle Diagnostic Fault',
  // ... etc
};

// Severity and status colors
export const SEVERITY_COLORS = { ... };
export const STATUS_COLORS = { ... };

// Utility functions
export function getVehicleStatus(lastSeenAt) { ... }
export function formatRelativeTime(date) { ... }
export function formatDateTime(date) { ... }
```

### 2. Custom Hooks (`src/hooks/`)

#### `useVehicles.js`
Fetches vehicles with their online/offline status.

```javascript
import { useVehicles } from 'hooks/useVehicles';

// Usage
const { vehicles, loading, error, refetch } = useVehicles({
  fleetId: null,        // Optional: filter by fleet
  refreshInterval: 30000 // Polling interval (default: 30s)
});
```

**Supabase Query:**
```sql
SELECT * FROM vehicles_with_status ORDER BY name ASC;
```

#### `useEvents.js`
Fetches events/alerts with filtering capabilities.

```javascript
import { useEvents, useRecentAlerts } from 'hooks/useEvents';

// Fetch filtered events
const { events, loading, error } = useEvents({
  severity: ['warning', 'critical'],
  eventTypes: ['harsh_braking', 'collision_detected'],
  hoursAgo: 24,
  limit: 50
});

// Fetch recent alerts (shorthand)
const { alerts } = useRecentAlerts({ limit: 10 });
```

**Supabase Query:**
```sql
SELECT e.*, v.name, v.driver_name, v.plate_number
FROM events e
JOIN vehicles v ON e.vehicle_id = v.id
WHERE e.severity IN ('warning', 'critical')
  AND e.event_at > now() - interval '24 hours'
ORDER BY e.event_at DESC
LIMIT 50;
```

#### `useStats.js`
Fetches dashboard statistics (aggregated metrics).

```javascript
import { useStats } from 'hooks/useStats';

const { stats, loading } = useStats();
// stats = {
//   vehiclesActive: 3,
//   vehiclesWithIssues: 2,
//   alertsLast24h: 14,
//   harshEvents: 5,
//   totalVehicles: 5
// }
```

#### `useDrivers.js`
Fetches drivers with their most recent driving events.

```javascript
import { useDrivers } from 'hooks/useDrivers';

const { drivers, loading } = useDrivers();
// drivers = [{
//   id: 'D001',
//   driverName: 'James Murphy',
//   vehicleName: 'Vehicle 023',
//   recentEvent: { event_type: 'harsh_braking', ... }
// }, ...]
```

---

## Views Updated

### 1. Overview (`src/views/Overview/Overview.js`)

**Before:** Hardcoded metrics (96 vehicles, 7 issues, etc.)

**After:** Dynamic metrics from `useStats()` + recent alerts from `useRecentAlerts()`

| Metric | Data Source |
|--------|-------------|
| Vehicles Active Today | Vehicles with `status = 'online'` |
| Vehicles With Issues | Unique vehicles with warning/critical events in 24h |
| Alerts Last 24h | Count of warning + critical events |
| Harsh Events | Count of harsh_braking, harsh_acceleration, harsh_cornering |

### 2. Vehicles (`src/views/Vehicles/Vehicles.js`)

**Before:** Hardcoded table with 4 rows

**After:** Dynamic table from `useVehicles()` with:
- Vehicle info (name, make, model, year)
- Status badge (Alert/Warning/Normal/Offline)
- Last seen (relative time)
- DTC count (from events table)
- Behavior badge (Good/Fair/Poor based on harsh event count)

### 3. Alerts (`src/views/Alerts/Alerts.js`)

**Before:** Static list of 3 alerts

**After:** Dynamic list from `useEvents()` with:
- Working filter buttons (All, DTCs, Collisions, Driving Events)
- Time filter (Last Hour, Today, This Week)
- Event details (g-force, DTC codes, speed data)
- Vehicle and driver information

### 4. Drivers (`src/views/Drivers/Drivers.js`)

**Before:** Hardcoded table with 3 drivers

**After:** Dynamic table from `useDrivers()` with:
- Driver names from `vehicles.driver_name`
- Assigned vehicle
- Most recent driving event
- Working search functionality

### 5. Live Map (`src/views/LiveMap/LiveMap.js`)

**Before:** Static markers at fixed positions

**After:** Dynamic markers from `useVehicles()` with:
- Marker colors based on alert status (green/amber/red/gray)
- Clickable vehicle list panel
- Vehicle info overlay with real data
- Position mapping from lat/lng coordinates

---

## Data Flow

### Polling Strategy

All hooks use polling (not real-time subscriptions) with configurable intervals:

```javascript
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, refreshInterval);
  return () => clearInterval(interval);
}, [fetchData, refreshInterval]);
```

Default intervals:
- Overview stats: 30 seconds
- Vehicles list: 30 seconds
- Alerts: 30 seconds
- Live Map: 15 seconds

### Error Handling

Each hook returns an `error` state that views use to display error messages:

```javascript
if (error) {
  return <div>Error loading data: {error.message}</div>;
}
```

### Loading States

Each hook returns a `loading` state used to show spinners:

```javascript
if (loading) {
  return <CircularProgress />;
}
```

---

## Database Requirements

### Required Tables

| Table | Purpose |
|-------|---------|
| `vehicles` | Vehicle information and last known location |
| `devices` | Device IMEI and heartbeat |
| `events` | All telemetry events |
| `fleets` | Tenant isolation |

### Required View

The `vehicles_with_status` view must exist:

```sql
CREATE VIEW vehicles_with_status AS
SELECT
  v.*,
  d.imei,
  CASE
    WHEN v.last_seen_at > now() - INTERVAL '5 minutes' THEN 'online'
    ELSE 'offline'
  END AS status
FROM vehicles v
LEFT JOIN devices d ON d.vehicle_id = v.id;
```

---

## Environment Variables

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

---

## Testing the Integration

1. **Insert test data** using `testdata.sql`
2. **Start the development server**: `npm start`
3. **Verify each view**:
   - `/admin/dashboard` - Check metrics update
   - `/admin/vehicles` - Check vehicle table loads
   - `/admin/alerts` - Check filters work
   - `/admin/drivers` - Check driver list loads
   - `/admin/live-map` - Check markers appear

---

## Troubleshooting

### "No vehicles found"
- Check that `vehicles_with_status` view exists
- Verify RLS policies allow read access
- Check browser console for Supabase errors

### Alerts not showing
- Events may be older than 24 hours (timestamps use `now()`)
- Re-run `testdata.sql` to refresh timestamps

### Markers not appearing on map
- Check `last_latitude` and `last_longitude` are not null
- Verify coordinates are within expected range

---

## Future Improvements

- [ ] Add real-time subscriptions for critical alerts
- [ ] Implement Mapbox GL for actual map rendering
- [ ] Add vehicle detail pages with historical data
- [ ] Implement trip replay functionality
- [ ] Add user authentication flow

---

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/supabase.js` | Supabase client initialization |
| `src/context/AuthContext.js` | Authentication context |
| `testdata.sql` | Test data for development |
| `context.md` | Full project context and schema |
