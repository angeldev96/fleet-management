-- ============================================================================
-- PERFORMANCE INDEXES
-- Description: Additional indexes for query optimization
-- Note: Primary key and unique constraint indexes are created automatically
-- ============================================================================

-- Index for filtering vehicles by fleet (common query pattern)
CREATE INDEX IF NOT EXISTS idx_vehicles_fleet_id
    ON public.vehicles(fleet_id);

-- Index for filtering user_profiles by fleet (multitenancy queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_fleet_id
    ON public.user_profiles(fleet_id);

-- Index for filtering events by vehicle (common query pattern)
CREATE INDEX IF NOT EXISTS idx_events_vehicle_id
    ON public.events(vehicle_id);

-- Index for filtering events by event_at timestamp (time-series queries)
CREATE INDEX IF NOT EXISTS idx_events_event_at
    ON public.events(event_at DESC);

-- Index for filtering events by type (alert queries)
CREATE INDEX IF NOT EXISTS idx_events_event_type
    ON public.events(event_type);

-- Composite index for common event queries (vehicle + time)
CREATE INDEX IF NOT EXISTS idx_events_vehicle_event_at
    ON public.events(vehicle_id, event_at DESC);
