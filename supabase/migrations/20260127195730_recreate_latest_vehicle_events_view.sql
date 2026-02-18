-- ============================================================================
-- MIGRATION: Update latest_vehicle_events view
-- Description: Adds event_subtype to the view for DTC codes display
-- Date: 2026-01-27
-- ============================================================================

-- Recreate view to include event_subtype
DROP VIEW IF EXISTS public.latest_vehicle_events;

CREATE VIEW public.latest_vehicle_events AS
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
