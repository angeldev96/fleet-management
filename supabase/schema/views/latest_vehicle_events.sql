-- ============================================================================
-- VIEW: latest_vehicle_events
-- Description: Returns the most recent non-location event for each vehicle.
--              Excludes 'location_update' events to show only meaningful alerts.
-- ============================================================================

CREATE OR REPLACE VIEW public.latest_vehicle_events AS
SELECT DISTINCT ON (vehicle_id)
    vehicle_id,
    event_type,
    event_subtype,  -- DTC code, power event type, etc.
    severity,
    event_at,
    latitude,
    longitude
FROM public.events
WHERE event_type <> 'location_update'
ORDER BY vehicle_id, event_at DESC;
