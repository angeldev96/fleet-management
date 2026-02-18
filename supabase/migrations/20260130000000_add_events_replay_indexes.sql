-- ============================================================================
-- MIGRATION: Add indexes for travel replay queries
-- Description: Adds indexes to speed up historical route and alert queries
-- Date: 2026-01-30
-- ============================================================================

-- Events: vehicle history by time
CREATE INDEX IF NOT EXISTS idx_events_vehicle_event_at
    ON public.events (vehicle_id, event_at DESC);

-- Events: vehicle history filtered by type
CREATE INDEX IF NOT EXISTS idx_events_vehicle_type_event_at
    ON public.events (vehicle_id, event_type, event_at DESC);

-- Events: type-based feeds by time
CREATE INDEX IF NOT EXISTS idx_events_type_event_at
    ON public.events (event_type, event_at DESC);
