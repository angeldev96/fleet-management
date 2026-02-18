-- ============================================================================
-- MIGRATION: Fix avg_speed_24h to consider only moving speeds
-- Description: Average speed should be based on moving samples; zero when idle
-- Date: 2026-02-04
-- ============================================================================

CREATE OR REPLACE VIEW public.vehicles_with_status AS
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
        WHEN v.last_seen_at > (now() - INTERVAL '5 minutes') THEN 'online'
        ELSE 'offline'
    END AS status,
    s.avg_speed_24h
FROM public.vehicles v
LEFT JOIN public.devices d ON d.vehicle_id = v.id
LEFT JOIN LATERAL (
    SELECT COALESCE(AVG(e.speed), 0) AS avg_speed_24h
    FROM public.events e
    WHERE e.vehicle_id = v.id
      AND e.event_type = 'location_update'
      AND e.speed IS NOT NULL
      AND e.speed > 0
      AND e.event_at >= (now() - INTERVAL '24 hours')
) s ON true;
