-- ============================================================================
-- MIGRATION: Add pid_reading event type
-- Description: Adds pid_reading to event_type CHECK constraint for PID telemetry
-- Date: 2026-01-28
-- ============================================================================

-- PIDs (Parameter IDs) represent vehicle telemetry data:
-- - battery_voltage: Battery voltage in volts
-- - rpm: Engine RPM
-- - speed: Vehicle speed from OBD (km/h)
-- - coolant_temp: Engine coolant temperature (°C)
-- - fuel_level: Fuel level percentage (optional)
-- - engine_load: Engine load percentage (optional)
-- - throttle_position: Throttle position percentage (optional)
--
-- PID readings are stored as events with:
-- - event_type: 'pid_reading'
-- - event_subtype: the specific PID type (e.g., 'battery_voltage', 'rpm')
-- - severity: 'info' (PIDs are informational, not alerts)
-- - event_data: JSONB with { value, unit, description }

-- Drop existing constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_type_check;

-- Add new constraint with pid_reading included
ALTER TABLE public.events ADD CONSTRAINT events_event_type_check
CHECK (event_type IN (
    'location_update',
    'overspeed',
    'harsh_braking',
    'harsh_acceleration',
    'harsh_cornering',
    'collision_detected',
    'dtc_detected',
    'device_online',
    'device_offline',
    'power_event',
    'pid_reading'
));

-- Add comment for documentation
COMMENT ON COLUMN public.events.event_type IS 'Event type enum: location_update, overspeed, harsh_braking, harsh_acceleration, harsh_cornering, collision_detected, dtc_detected, device_online, device_offline, power_event, pid_reading';
