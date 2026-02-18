# Entry Fleet Simulator - Documentation

## Executive Summary

### What is the Simulator?

The **Entry Fleet Simulator** is a tool that generates real-time telemetry data to test the Entry MVP system without requiring physical vehicles. It simulates the behavior of **400 vehicles** distributed across **4 different fleets**, generating:

- **GPS location updates** (realistic vehicle movement)
- **Vehicle sensor readings** (voltage, RPM, speed, temperature)
- **Alerts and events** (harsh braking, speeding, collisions, etc.)

### Use Cases

| Use Case | Description |
|----------|-------------|
| **Client demos** | Showcase the portal with live moving data |
| **Stress testing** | Verify the system handles high data loads |
| **Development** | Test new features without physical hardware |
| **QA** | Validate alerts, maps, and dashboards with consistent data |

### Key Metrics

| Metric | Value |
|--------|-------|
| Simulated vehicles | 400 |
| Independent fleets | 4 |
| Events per minute | ~1,600 |
| Events per second | ~27 |
| Geographic coverage | Jamaica (Kingston - Montego Bay) |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ENTRY FLEET SIMULATOR                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐            │
│   │   config    │    │ generators  │    │   index     │            │
│   │    .js      │───▶│    .js      │───▶│    .js      │            │
│   └─────────────┘    └─────────────┘    └─────────────┘            │
│         │                   │                   │                   │
│   Configuration       Generators          Orchestrator              │
│   - Intervals         - Location          - Scheduling              │
│   - Probabilities     - PIDs              - Batch inserts           │
│   - Limits            - Alerts            - Performance             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │       SUPABASE          │
                    │      (Database)         │
                    ├─────────────────────────┤
                    │ • vehicles              │
                    │ • devices               │
                    │ • events                │
                    └─────────────────────────┘
```

---

## Data Types Generated

### 1. Location Updates (GPS)

**Frequency:** Every 30 seconds (all vehicles in batch)

```json
{
  "event_type": "location_update",
  "latitude": 18.0179,
  "longitude": -76.8099,
  "speed": 45.5,
  "event_data": {
    "heading": 127.3,
    "accuracy": 8.5
  }
}
```

**Movement characteristics:**
- Maximum speed: 120 km/h
- Realistic acceleration: ±3 m/s²
- Maximum turns: 45° per interval
- Stop probability (traffic lights): 5%
- Area: Jamaica (17.7°N - 18.5°N, -78.4°W - -76.2°W)

### 2. PID Readings (OBD-II Sensors)

**Frequency:** 1 reading per vehicle per minute (random timing)

| PID | Description | Range | Unit |
|-----|-------------|-------|------|
| `battery_voltage` | Battery voltage | 12.0 - 14.5 | V |
| `rpm` | Engine revolutions | 650 - 3500 | RPM |
| `speed` | Vehicle speed | 0 - 120 | km/h |
| `coolant_temp` | Coolant temperature | 75 - 98 | °C |

```json
{
  "event_type": "pid_reading",
  "event_subtype": "battery_voltage",
  "severity": "info",
  "event_data": {
    "value": 13.8,
    "unit": "V",
    "description": "Battery Voltage"
  }
}
```

### 3. Alerts and Events

**Frequency:** 1 event per vehicle per minute (random timing)

| Event | Severity | Probability | Description |
|-------|----------|-------------|-------------|
| `harsh_braking` | warning | 25% | Hard braking detected |
| `harsh_acceleration` | warning | 20% | Aggressive acceleration |
| `overspeed` | warning | 20% | Speed limit exceeded |
| `harsh_cornering` | warning | 15% | Sharp turn detected |
| `dtc_detected` | variable | 10% | Diagnostic trouble code |
| `device_offline` | warning/critical | 4% | Device disconnected |
| `power_event` | warning | 4% | Power-related event |
| `collision_detected` | critical | 2% | Possible collision |

#### Simulated DTC Codes

| Code | Description | Severity |
|------|-------------|----------|
| P0300 | Random/Multiple Cylinder Misfire | warning |
| P0171 | System Too Lean (Bank 1) | warning |
| P0420 | Catalyst System Efficiency Below Threshold | warning |
| P0128 | Coolant Thermostat | info |
| P0562 | System Voltage Low | warning |
| P0507 | Idle Control System RPM Higher Than Expected | info |
| P0455 | Evaporative Emission System Leak Detected | warning |

---

## Data Flow

```
Time ───────────────────────────────────────────────────────────────▶

Second 0                     Second 30                    Second 60
    │                            │                            │
    ▼                            ▼                            ▼
┌─────────┐                ┌─────────┐                ┌─────────┐
│ Location│                │ Location│                │ Location│
│  Batch  │                │  Batch  │                │  Batch  │
│(400 evt)│                │(400 evt)│                │(400 evt)│
└─────────┘                └─────────┘                └─────────┘

    ════════════════════════════════════════════════════════════
    │     PIDs: 400 events randomly distributed                │
    │     ●  ●   ●●  ●   ● ●●   ● ●  ●●●  ●  ●●   ●  ●●  ●    │
    ════════════════════════════════════════════════════════════

    ════════════════════════════════════════════════════════════
    │    Alerts: 400 events randomly distributed               │
    │      ●●  ●   ● ●●  ●   ●●   ● ●  ●  ●●●  ●   ●●  ● ●    │
    ════════════════════════════════════════════════════════════
```

---

## Usage Guide

### Prerequisites

1. **Node.js** installed (v14+)
2. **Environment variables** configured in `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Running the Simulator

```bash
# From the project root
npm run simulator

# Or directly
node scripts/simulator/index.js
```

### Stopping the Simulator

Press `Ctrl+C` to stop and view the final performance report.

### Sample Output

```
══════════════════════════════════════════════════════════════════════
🚗 ENTRY FLEET SIMULATOR - High Ingestion Stress Test
══════════════════════════════════════════════════════════════════════

[INFO] Loading vehicles and devices from database...
[OK] Loaded 400 vehicles and 400 devices
[INFO] Fleet distribution:
[INFO]    Fleet 0da49a36...: 100 vehicles
[INFO]    Fleet 11111111...: 100 vehicles
[INFO]    Fleet 33333333...: 100 vehicles
[INFO]    Fleet 44444444...: 100 vehicles

[INFO] Expected data rates:
[INFO]    Location updates: 800/min (every 30s, batch)
[INFO]    PID readings: 400/min (1/vehicle, random timing)
[INFO]    Alert events: 400/min (1/vehicle, random timing)
[INFO]    Total: ~1600 events/min (~27 events/sec)

[INFO] Press Ctrl+C to stop and see final report

[INFO] Running initial location update...
[INFO] 📍 Location updates: 400 events in 1523ms (263 events/sec)
[OK] Initial location update complete
[INFO] 🔧 Scheduled 400 PID events distributed over next 60s
[INFO] 🚨 Scheduled 400 alert events distributed over next 60s
```

---

## Monitoring and Metrics

### Performance Report (every 2 minutes)

```
══════════════════════════════════════════════════════════════════════
📊 PERFORMANCE REPORT
══════════════════════════════════════════════════════════════════════
   Uptime: 6m 7s
   Total events inserted: 31,200
   Overall throughput: 85 events/sec

   ┌─────────────────────┬───────────┬────────────┬─────────────┬────────┐
   │ Operation           │ Total     │ Events/min │ Avg Latency │ Errors │
   ├─────────────────────┼───────────┼────────────┼─────────────┼────────┤
   │ locationUpdates     │      4800 │        784 │      1718ms │      0 │
   │ pidReadings         │     19200 │       3136 │      1195ms │      0 │
   │ alertEvents         │      2400 │        392 │      1456ms │      0 │
   │ vehicleUpdates      │      4800 │        784 │         0ms │      0 │
   └─────────────────────┴───────────┴────────────┴─────────────┴────────┘
══════════════════════════════════════════════════════════════════════
```

### Problem Indicators

| Indicator | Meaning | Action |
|-----------|---------|--------|
| `[⚠️ BOTTLENECK]` | Operation took >5 seconds | Check DB load |
| `[ERROR]` | Insert failed | Verify connection/permissions |
| High error count | Connectivity issues | Check Supabase status |

---

## File Structure

```
scripts/simulator/
├── index.js          # Main orchestrator
├── config.js         # Parameter configuration
├── generators.js     # Data generators
└── SIMULATOR_DOCUMENTATION.md  # This document
```

### config.js - Configurable Parameters

```javascript
module.exports = {
  // Batch size for insertions
  batchSize: 100,

  // Movement configuration
  movement: {
    maxSpeedKmh: 120,
    maxAcceleration: 3,    // m/s²
    maxTurnAngle: 45,      // degrees
    stopProbability: 0.05, // 5% chance to stop
  },

  // Geographic area (Jamaica)
  bounds: {
    minLat: 17.7,
    maxLat: 18.5,
    minLng: -78.4,
    maxLng: -76.2,
  },

  // PID types
  pidTypes: [
    { subtype: 'battery_voltage', unit: 'V', min: 11, max: 15 },
    { subtype: 'rpm', unit: 'RPM', min: 0, max: 6000 },
    { subtype: 'speed', unit: 'km/h', min: 0, max: 200 },
    { subtype: 'coolant_temp', unit: '°C', min: 60, max: 110 },
  ],

  // DTC codes
  dtcCodes: [
    { code: 'P0300', description: 'Random Misfire', severity: 'warning' },
    // ... more codes
  ],
};
```

---

## Technical Considerations

### Insertion Strategy

1. **Location Updates (Batch)**
   - All 400 vehicles are processed together every 30s
   - Inserts in batches of 100 to optimize performance
   - Also updates the `vehicles` table with last known position

2. **PIDs and Alerts (Distributed)**
   - Each vehicle receives 1 event per minute
   - Random timing using `setTimeout(fn, randomDelay)`
   - Simulates real behavior of independent devices

### Observed Performance

| Metric | Typical Value |
|--------|---------------|
| Sustained throughput | 80-90 events/sec |
| Average latency (batch) | 1-2 seconds |
| Error rate | <0.1% |
| Memory usage | ~50-80 MB |

### Scalability

The simulator can be adjusted by modifying:
- Number of vehicles in the database
- Intervals in `config.js`
- Batch size to optimize based on load

---

## Frequently Asked Questions (FAQ)

### Does the simulator affect production data?

No, if running against a development/staging environment. **Important:** Always verify environment variables before running.

### Can I simulate fewer vehicles?

Yes, the simulator uses existing vehicles in the database. To simulate fewer, simply reduce the number of records in the `vehicles` table.

### Is the data persisted?

Yes, all events are inserted into the Supabase `events` table and are visible in the portal.

### How do I clean up simulator data?

```sql
-- Delete events from the last X hours
DELETE FROM events
WHERE event_at > NOW() - INTERVAL '24 hours';
```

### Can I modify alert probabilities?

Yes, edit the weights in `generators.js` in the `generateRandomEventForVehicle()` function.

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-28 | 1.0.0 | Initial version with support for 400 vehicles |
| 2026-01-28 | 1.1.0 | Random timing for PIDs and alerts (1/min/vehicle) |

---

## Contact and Support

For technical issues or improvements, contact the development team.
