# Entry MVP - Complete Project Context

> **Purpose**: This document provides full context for AI-assisted development (Claude Code).
> **Last Updated**: January 2026
> **Demo Date**: February 4, 2026

---

## 1. Project Overview

### What is Entry?

Entry is a **fleet intelligence platform** that allows fleet operators to:

- Visually track vehicles in real-time on a map
- Detect risky driving and collision-related events
- View basic vehicle diagnostics (DTCs and PIDs)
- Onboard fleets quickly using OBD-only devices
- Pay a predictable monthly cost per vehicle

### Target Users

- Fleet managers
- Transportation companies
- Logistics operators

### Hardware

- **Device**: Sinocastel D-218L (OBD telematics device)
- **Connectivity**: TCP protocol
- **Data**: GPS, G-sensor, OBD-II diagnostics

---

## 2. System Architecture

```
Sinocastel D-218L (OBD Device)
         ↓
    TCP Ingestion Server
         ↓
    Protocol Decoder
         ↓
    Normalized JSON Events
         ↓
    Supabase (Postgres + RLS)
         ↓
    React Dashboard (Material Dashboard Pro)
         ↓
    Mapbox GL (Fleet Visualization)
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Frontend | React + Material Dashboard Pro |
| Maps | Mapbox GL JS (react-map-gl) |
| State Updates | Polling (10-30s), NOT realtime |

---

## 3. Database Schema

### 3.1 Tables Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           FLEETS                                │
│  (Tenant - each fleet is completely isolated)                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             │
┌─────────────┐  ┌───────────┐       │
│USER_PROFILES│  │ VEHICLES  │       │
├─────────────┤  ├───────────┤       │
│ id (PK/FK)  │  │ id (PK)   │       │
│ fleet_id    │  │ fleet_id  │◄──────┘
│ role        │  │ name      │
│ full_name   │  │ plate     │
│             │  │ driver_name│
│             │  │ make/model│
│             │  │ last_lat  │
│             │  │ last_lng  │
│             │  │ status    │
└─────────────┘  └─────┬─────┘
                       │ 1:1
                       ▼
                ┌───────────┐
                │  DEVICES  │
                ├───────────┤
                │ id (PK)   │
                │ vehicle_id│ (UNIQUE)
                │ imei      │ (UNIQUE)
                │ heartbeat │
                └─────┬─────┘
                      │ 1:N
                      ▼
                ┌───────────┐
                │  EVENTS   │
                ├───────────┤
                │ id (PK)   │
                │ vehicle_id│
                │ device_id │
                │ event_type│
                │ severity  │
                │ lat, lng  │
                │ event_data│ (JSONB)
                │ event_at  │
                └───────────┘
```

### 3.2 Table: `fleets`

The main tenant table. Each fleet is completely isolated.

```sql
CREATE TABLE fleets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.3 Table: `user_profiles`

Extends Supabase `auth.users`. One user belongs to one fleet.

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  fleet_id UUID REFERENCES fleets(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Roles:**
| Role | Permissions |
|------|-------------|
| `superadmin` | See ALL fleets (platform owner) |
| `admin` | Manage own fleet |
| `user` | Read-only in own fleet |

### 3.4 Table: `vehicles`

```sql
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
  
  -- Identification
  name TEXT,                          -- "Truck 01", "Route North"
  plate_number TEXT,
  vin TEXT,                           -- Optional
  
  -- Driver (simple field, not separate table)
  driver_name TEXT,
  
  -- Vehicle type
  make TEXT,                          -- "Ford", "Nissan"
  model TEXT,                         -- "F-150", "Xtrail"
  year INTEGER,                       -- 2022
  
  -- Last known location (for map)
  last_latitude DECIMAL(10, 7),
  last_longitude DECIMAL(10, 7),
  last_speed DECIMAL(5, 1),           -- km/h
  last_heading DECIMAL(5, 1),         -- Direction 0-360°
  last_seen_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 Table: `devices`

One device per vehicle (1:1 relationship).

```sql
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID UNIQUE NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- Device identification (Sinocastel D-218L)
  imei TEXT UNIQUE NOT NULL,
  serial_number TEXT,
  firmware_version TEXT,
  
  -- Connection state
  last_heartbeat_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.6 Table: `events`

All normalized events from the protocol.

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  
  -- Event classification
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'location_update',
      'overspeed',
      'harsh_braking',
      'harsh_acceleration',
      'harsh_cornering',
      'collision_detected',
      'dtc_detected',
      'device_online',
      'device_offline',
      'power_event'
    )
  ),
  
  -- Severity (derived server-side, NEVER frontend)
  severity TEXT NOT NULL DEFAULT 'info' CHECK (
    severity IN ('info', 'warning', 'critical')
  ),
  
  -- Event location
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  speed DECIMAL(5, 1),
  
  -- Additional data (DTCs, PIDs, g-force, etc.)
  event_data JSONB,
  
  -- Raw payload for debugging
  raw_payload JSONB,
  
  -- Timestamps
  event_at TIMESTAMPTZ NOT NULL,      -- When it happened (device time)
  created_at TIMESTAMPTZ DEFAULT now() -- When received (server time)
);
```

---

## 4. Event Types & Severity

### 4.1 Event Type Mapping

| Protocol Source | event_type | Notes |
|-----------------|------------|-------|
| GPS packet (0x4001) | `location_update` | Periodic telemetry |
| Speed exceeds threshold | `overspeed` | Server-derived |
| G-sensor deceleration | `harsh_braking` | Device event |
| G-sensor acceleration | `harsh_acceleration` | Device event |
| Lateral G-sensor | `harsh_cornering` | Device event |
| Impact/collision flag | `collision_detected` | Native device support |
| DTC packet (0x4006) | `dtc_detected` | Fault code present |
| Heartbeat resumes | `device_online` | State change |
| Heartbeat timeout | `device_offline` | Time-based |
| Power reset/unplug | `power_event` | OBD power behavior |

### 4.2 Severity Rules

**Severity is ALWAYS derived server-side, NEVER by frontend.**

| event_type | severity |
|------------|----------|
| location_update | `info` |
| device_online | `info` |
| overspeed | `warning` |
| harsh_braking | `warning` |
| harsh_acceleration | `warning` |
| harsh_cornering | `warning` |
| dtc_detected | `warning` → `critical` (if high-risk DTC) |
| device_offline | `warning` → `critical` (after 30min) |
| power_event | `warning` |
| collision_detected | `critical` |

### 4.3 Offline Escalation Rule

- 5 minutes offline → `warning`
- 30 minutes offline → `critical`

---

## 5. Frontend Display Rules

### 5.1 Severity Badge Colors

| Severity | Color Token | Hex | Text Color |
|----------|-------------|-----|------------|
| `info` | info | #1A73E8 | white |
| `warning` | warning | #F9A825 | dark/black |
| `critical` | error | #D32F2F | white |

### 5.2 Map Marker Colors

| Condition | Color |
|-----------|-------|
| No active alerts | Green |
| Warning present | Amber |
| Critical present | Red |

### 5.3 Vehicle Status

Derived from `last_seen_at`:
- `last_seen_at > now() - 5 minutes` → **Online**
- Otherwise → **Offline**

### 5.4 UI Wording (Liability-Safe)

| event_type | UI Text |
|------------|---------|
| harsh_braking | "Harsh braking detected" |
| harsh_acceleration | "Rapid acceleration detected" |
| overspeed | "Speed threshold exceeded" |
| collision_detected | "Potential collision detected" |
| dtc_detected | "Vehicle diagnostic fault detected" |
| device_offline | "Device not reporting" |

**❌ AVOID:** accident, crash confirmed, driver fault, unsafe driving

---

## 6. Views (Pre-built Queries)

### 6.1 `vehicles_with_status`

Returns vehicles with online/offline status for map display.

```sql
CREATE VIEW vehicles_with_status AS
SELECT 
  v.id,
  v.fleet_id,
  v.name,
  v.plate_number,
  v.driver_name,
  v.make,
  v.model,
  v.year,
  v.last_latitude,
  v.last_longitude,
  v.last_speed,
  v.last_heading,
  v.last_seen_at,
  d.imei,
  CASE 
    WHEN v.last_seen_at > now() - INTERVAL '5 minutes' THEN 'online'
    ELSE 'offline'
  END AS status
FROM vehicles v
LEFT JOIN devices d ON d.vehicle_id = v.id;
```

### 6.2 `latest_vehicle_events`

Returns the most recent non-location event per vehicle (for map alerts).

```sql
CREATE VIEW latest_vehicle_events AS
SELECT DISTINCT ON (vehicle_id)
  vehicle_id,
  event_type,
  severity,
  event_at,
  latitude,
  longitude
FROM events
WHERE event_type != 'location_update'
ORDER BY vehicle_id, event_at DESC;
```

---

## 7. Row Level Security (RLS)

### 7.1 Helper Functions

```sql
-- Get current user's fleet_id
CREATE FUNCTION get_user_fleet_id() RETURNS UUID AS $$
  SELECT fleet_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is superadmin
CREATE FUNCTION is_superadmin() RETURNS BOOLEAN AS $$
  SELECT COALESCE(
    (SELECT role = 'superadmin' FROM user_profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### 7.2 Policy Pattern

- **Superadmin**: Can see ALL data across all fleets
- **Admin/User**: Can only see data from their own fleet

```sql
-- Example pattern for all tables
CREATE POLICY "Superadmin sees all"
  ON table_name FOR SELECT
  USING (is_superadmin());

CREATE POLICY "Users see own fleet"
  ON table_name FOR SELECT
  USING (fleet_id = get_user_fleet_id());
```

---

## 8. Indexes

```sql
-- User profiles
CREATE INDEX idx_user_profiles_fleet_id ON user_profiles(fleet_id);

-- Vehicles
CREATE INDEX idx_vehicles_fleet_id ON vehicles(fleet_id);

-- Devices
CREATE INDEX idx_devices_imei ON devices(imei);
CREATE INDEX idx_devices_vehicle_id ON devices(vehicle_id);

-- Events (critical for dashboard performance)
CREATE INDEX idx_events_vehicle_id ON events(vehicle_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_severity ON events(severity);
CREATE INDEX idx_events_event_at ON events(event_at DESC);
CREATE INDEX idx_events_vehicle_time ON events(vehicle_id, event_at DESC);
```

---

## 9. Common Queries

### 9.1 Get Vehicles for Map

```sql
SELECT * FROM vehicles_with_status
WHERE fleet_id = get_user_fleet_id();
```

### 9.2 Get Recent Alerts

```sql
SELECT e.*, v.name as vehicle_name, v.driver_name
FROM events e
JOIN vehicles v ON e.vehicle_id = v.id
WHERE e.severity IN ('warning', 'critical')
  AND e.event_at > now() - interval '24 hours'
ORDER BY e.event_at DESC
LIMIT 50;
```

### 9.3 Get DTCs for a Vehicle

```sql
SELECT 
  event_data->>'dtc_code' as dtc_code,
  event_data->>'dtc_description' as description,
  severity,
  event_at
FROM events
WHERE vehicle_id = 'UUID_HERE'
  AND event_type = 'dtc_detected'
ORDER BY event_at DESC;
```

### 9.4 Get Driver List with Recent Events

```sql
SELECT 
  v.id,
  v.driver_name,
  v.name as vehicle_name,
  lve.event_type as recent_event,
  lve.severity,
  lve.event_at
FROM vehicles v
LEFT JOIN latest_vehicle_events lve ON lve.vehicle_id = v.id
WHERE v.fleet_id = get_user_fleet_id()
ORDER BY lve.event_at DESC NULLS LAST;
```

### 9.5 Get Vehicle Details with Diagnostics

```sql
-- Vehicle info
SELECT v.*, d.imei, d.firmware_version
FROM vehicles v
JOIN devices d ON d.vehicle_id = v.id
WHERE v.id = 'UUID_HERE';

-- Recent events for this vehicle
SELECT event_type, severity, event_data, event_at
FROM events
WHERE vehicle_id = 'UUID_HERE'
ORDER BY event_at DESC
LIMIT 20;
```

---

## 10. event_data JSONB Examples

### 10.1 DTC Detected

```json
{
  "dtc_code": "P0301",
  "dtc_description": "Cylinder 1 Misfire Detected",
  "mil_status": true
}
```

### 10.2 Harsh Braking

```json
{
  "g_force": 0.75,
  "duration_ms": 420
}
```

### 10.3 Location Update (with PIDs)

```json
{
  "battery_voltage": 12.6,
  "rpm": 2400,
  "coolant_temp": 92,
  "fuel_level": 65
}
```

### 10.4 Collision Detected

```json
{
  "g_force": 2.8,
  "impact_direction": "front_left",
  "airbag_deployed": false
}
```

### 10.5 Overspeed

```json
{
  "speed_limit": 80,
  "actual_speed": 95
}
```

---

## 11. Current Test Data

### 11.1 IDs

| Entity | ID |
|--------|-----|
| Fleet | `0da49a36-42a2-4789-acd3-d1b504dc9c26` |
| Superadmin User | `2005be9b-422d-4626-9c37-a90aa576efce` |

### 11.2 Test Vehicles

| Vehicle | Driver | Make/Model | Status |
|---------|--------|------------|--------|
| Vehicle 023 | James Murphy | 2022 Ford F-150 | Alert (harsh events) |
| Vehicle 045 | Megan Clark | 2023 Chevrolet Silverado | Online |
| Vehicle 015 | Chris Adams | 2008 Nissan Xtrail | Alert (DTCs) |
| Vehicle 067 | Maria Santos | 2011 Honda Accord | Online (clean) |
| Vehicle 089 | Roberto Diaz | 2020 Toyota Hilux | Offline |

### 11.3 Test Events

- Harsh braking events
- Harsh acceleration events
- DTC codes (P0301, P0171)
- Collision event
- Overspeed event
- Device online/offline events
- Location updates with PID data

---

## 12. Supabase Connection

### 12.1 Environment Variables

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 12.2 Supabase Client Setup

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 12.3 Example: Fetch Vehicles

```typescript
const { data: vehicles, error } = await supabase
  .from('vehicles_with_status')
  .select('*');
```

### 12.4 Example: Fetch Events

```typescript
const { data: events, error } = await supabase
  .from('events')
  .select(`
    *,
    vehicles (name, driver_name)
  `)
  .in('severity', ['warning', 'critical'])
  .order('event_at', { ascending: false })
  .limit(50);
```

---

## 13. MVP Scope

### 13.1 IN Scope

- ✅ Live Map with vehicle markers
- ✅ Vehicle status (online/offline)
- ✅ Driver behavior events (harsh braking, acceleration, cornering)
- ✅ Collision detection
- ✅ DTC display
- ✅ Basic PIDs (voltage, RPM, speed, temp)
- ✅ Marker clustering
- ✅ Severity badges

### 13.2 OUT of Scope (Post-MVP)

- ❌ Route replay / trip history
- ❌ Address search / reverse geocoding
- ❌ Driver scoring
- ❌ Insurance attribution
- ❌ Predictive maintenance
- ❌ Compliance automation
- ❌ AI recommendations
- ❌ Configurable alert settings (hardcoded for MVP)

---

## 14. Important Rules

### 14.1 Data Flow Rules

1. **Raw protocol IDs (0x4001, 0x4006) are NEVER exposed** to frontend
2. **Severity is ALWAYS derived server-side**, never by frontend
3. **Frontend never overrides severity**
4. All alerts originate from normalized events

### 14.2 UI Rules

1. Use calm, professional, enterprise tone
2. No flashing or alarmist effects
3. Critical alerts get subtle pulse (optional)
4. No fault attribution or insurance language

### 14.3 Development Rules

1. Demo stability > feature completeness
2. Clarity > cleverness
3. Fail visibly, never silently
4. Map must always load even if data is missing

---

## 15. File Structure Reference

```
entry-dashboard/
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── FleetMap.tsx
│   │   │   ├── VehicleMarker.tsx
│   │   │   └── MarkerCluster.tsx
│   │   ├── Vehicles/
│   │   │   ├── VehicleList.tsx
│   │   │   ├── VehicleDetail.tsx
│   │   │   └── VehicleCard.tsx
│   │   ├── Events/
│   │   │   ├── EventFeed.tsx
│   │   │   ├── EventCard.tsx
│   │   │   └── SeverityBadge.tsx
│   │   ├── Drivers/
│   │   │   └── DriverList.tsx
│   │   └── Diagnostics/
│   │       ├── DTCList.tsx
│   │       └── PIDDisplay.tsx
│   ├── hooks/
│   │   ├── useVehicles.ts
│   │   ├── useEvents.ts
│   │   └── usePolling.ts
│   ├── lib/
│   │   └── supabase.ts
│   ├── types/
│   │   └── database.ts
│   └── utils/
│       ├── severity.ts
│       └── status.ts
```

---

## 16. TypeScript Types

```typescript
// types/database.ts

export type UserRole = 'superadmin' | 'admin' | 'user';

export type EventType = 
  | 'location_update'
  | 'overspeed'
  | 'harsh_braking'
  | 'harsh_acceleration'
  | 'harsh_cornering'
  | 'collision_detected'
  | 'dtc_detected'
  | 'device_online'
  | 'device_offline'
  | 'power_event';

export type Severity = 'info' | 'warning' | 'critical';

export type VehicleStatus = 'online' | 'offline';

export interface Fleet {
  id: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  fleet_id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
}

export interface Vehicle {
  id: string;
  fleet_id: string;
  name: string | null;
  plate_number: string | null;
  vin: string | null;
  driver_name: string | null;
  make: string | null;
  model: string | null;
  year: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  last_speed: number | null;
  last_heading: number | null;
  last_seen_at: string | null;
  created_at: string;
}

export interface VehicleWithStatus extends Vehicle {
  imei: string | null;
  status: VehicleStatus;
}

export interface Device {
  id: string;
  vehicle_id: string;
  imei: string;
  serial_number: string | null;
  firmware_version: string | null;
  last_heartbeat_at: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  vehicle_id: string;
  device_id: string;
  event_type: EventType;
  severity: Severity;
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
  event_data: Record<string, any> | null;
  raw_payload: Record<string, any> | null;
  event_at: string;
  created_at: string;
}

// event_data specific types
export interface DTCEventData {
  dtc_code: string;
  dtc_description: string;
  mil_status: boolean;
}

export interface HarshEventData {
  g_force: number;
  duration_ms: number;
}

export interface CollisionEventData {
  g_force: number;
  impact_direction: string;
  airbag_deployed: boolean;
}

export interface OverspeedEventData {
  speed_limit: number;
  actual_speed: number;
}

export interface LocationEventData {
  battery_voltage?: number;
  rpm?: number;
  coolant_temp?: number;
  fuel_level?: number;
}
```

---

## 17. Utility Functions

```typescript
// utils/severity.ts

export const SEVERITY_COLORS = {
  info: { bg: '#1A73E8', text: 'white' },
  warning: { bg: '#F9A825', text: '#1a1a1a' },
  critical: { bg: '#D32F2F', text: 'white' },
} as const;

export const SEVERITY_LABELS = {
  info: 'Info',
  warning: 'Warning', 
  critical: 'Critical',
} as const;

// utils/status.ts

export const STATUS_COLORS = {
  online: '#4CAF50',  // Green
  offline: '#9E9E9E', // Gray
  alert: '#F44336',   // Red
} as const;

export function getVehicleStatus(lastSeenAt: string | null): 'online' | 'offline' {
  if (!lastSeenAt) return 'offline';
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastSeenAt) > fiveMinutesAgo ? 'online' : 'offline';
}

// utils/events.ts

export const EVENT_LABELS: Record<string, string> = {
  location_update: 'Location Update',
  overspeed: 'Speed Threshold Exceeded',
  harsh_braking: 'Harsh Braking Detected',
  harsh_acceleration: 'Rapid Acceleration Detected',
  harsh_cornering: 'Harsh Cornering Detected',
  collision_detected: 'Potential Collision Detected',
  dtc_detected: 'Vehicle Diagnostic Fault',
  device_online: 'Device Online',
  device_offline: 'Device Not Reporting',
  power_event: 'Power Event',
};
```

---

**End of Context Document**