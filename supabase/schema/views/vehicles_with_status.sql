-- ============================================================================
-- VIEW: vehicles_with_status
-- Description: Vehicles with hybrid status determination. Uses the explicit
--              `status` column set by the telemetry-ingest edge function for
--              immediate state transitions (e.g. device_offline → offline).
--              Falls back to offline if no data received in 5 minutes (safety
--              net for devices that disappear without sending device_offline).
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
        -- Safety net: if no data in 5 minutes, force offline regardless of stored status
        WHEN v.last_seen_at IS NULL OR v.last_seen_at <= (now() - INTERVAL '5 minutes') THEN 'offline'
        -- Otherwise trust the explicit status set by the edge function
        ELSE COALESCE(v.status, 'offline')
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
      AND e.event_at >= (now() - INTERVAL '5 minutes')
) s ON true;
