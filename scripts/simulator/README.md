# Entry Fleet Simulator

High-ingestion stress test simulator for the Entry fleet management platform.

## Data Rates (400 vehicles)

| Data Type | Frequency | Events/min | Events/sec |
|-----------|-----------|------------|------------|
| Location updates | Every 30s | 800 | ~13 |
| PID readings (4 types) | Every 30s | 3,200 | ~53 |
| Alert events | Every 60s | 400 | ~7 |
| **Total** | - | **~4,400** | **~73** |

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Supabase URL
SUPABASE_URL=https://qhsquyccwnmyxpgfigru.supabase.co

# Service Role Key (from Supabase Dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Log level (debug, info, warn, error)
LOG_LEVEL=info
```

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is required because the simulator needs to bypass Row Level Security (RLS) to insert data for all fleets.

### 3. Run the simulator

```bash
npm run simulator
```

Or directly:

```bash
node scripts/simulator/index.js
```

## Features

### Real-time Logging

- Color-coded log levels (DEBUG, INFO, WARN, ERROR)
- Timestamps on all log entries
- Throughput metrics (events/sec) for each operation

### Bottleneck Detection

Operations taking longer than 5 seconds are flagged as potential bottlenecks:

```
[BOTTLENECK] locationUpdates took 6234ms (threshold: 5000ms)
```

### Performance Reports

Automatic reports every 2 minutes showing:

- Total events inserted
- Throughput per operation (events/min)
- Average latency per batch
- Error counts

Example output:

```
═══════════════════════════════════════════════════════════════════════
📊 PERFORMANCE REPORT
═══════════════════════════════════════════════════════════════════════
   Uptime: 5m 30s
   Total events inserted: 24,200
   Overall throughput: 73 events/sec

   ┌─────────────────────┬───────────┬────────────┬─────────────┬────────┐
   │ Operation           │ Total     │ Events/min │ Avg Latency │ Errors │
   ├─────────────────────┼───────────┼────────────┼─────────────┼────────┤
   │ locationUpdates     │     4,400 │        800 │       450ms │      0 │
   │ pidReadings         │    17,600 │      3,200 │       890ms │      0 │
   │ alertEvents         │     2,200 │        400 │       320ms │      0 │
   │ vehicleUpdates      │     4,400 │        800 │       180ms │      0 │
   └─────────────────────┴───────────┴────────────┴─────────────┴────────┘
═══════════════════════════════════════════════════════════════════════
```

### Graceful Shutdown

Press `Ctrl+C` to stop the simulator. A final performance report will be displayed.

## Configuration

Edit `config.js` to adjust:

- **Intervals**: Timing for each operation
- **Event weights**: Probability distribution for alert types
- **DTC codes**: Available diagnostic trouble codes
- **PID types**: Vehicle telemetry data types
- **Batch size**: Number of records per database insert

## Event Types Generated

### Alert Events (1 per vehicle per minute)

| Event Type | Weight | Severity |
|------------|--------|----------|
| harsh_braking | 25% | warning |
| harsh_acceleration | 20% | warning |
| overspeed | 20% | warning |
| harsh_cornering | 15% | warning |
| dtc_detected | 10% | warning/critical |
| device_offline | 4% | warning/critical |
| power_event | 4% | warning |
| collision_detected | 2% | critical |

### PID Readings

- `battery_voltage` (V)
- `rpm` (RPM)
- `speed` (km/h)
- `coolant_temp` (°C)

## Troubleshooting

### "Missing environment variables"

Make sure your `.env` file exists and contains both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### High latency / Bottlenecks

- Check Supabase dashboard for database load
- Reduce `batchSize` in config.js
- Increase intervals between operations

### Errors during insert

- Check Supabase logs for specific error messages
- Verify database schema matches expected structure
- Check for RLS policy issues (service role should bypass)
