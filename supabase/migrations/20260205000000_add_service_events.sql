-- ============================================================================
-- MIGRATION: Add Service Events
-- Description: Creates service_events table for Service Calendar feature
-- Date: 2026-02-05
-- ============================================================================

-- ============================================================================
-- TABLE: service_events
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('scheduled_maintenance', 'repair')),
    service_items TEXT,
    mileage NUMERIC,
    service_date DATE NOT NULL,
    next_service_date DATE,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    cost NUMERIC(10, 2),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_service_events_vehicle_id ON public.service_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_events_service_date ON public.service_events(service_date);
CREATE INDEX IF NOT EXISTS idx_service_events_next_service_date ON public.service_events(next_service_date);
CREATE INDEX IF NOT EXISTS idx_service_events_status ON public.service_events(status);
CREATE INDEX IF NOT EXISTS idx_service_events_vehicle_date ON public.service_events(vehicle_id, service_date DESC);

-- ============================================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_service_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_service_events_updated_at
    BEFORE UPDATE ON public.service_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_service_events_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.service_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service event access by fleet"
    ON public.service_events
    FOR ALL
    TO public
    USING (vehicle_id IN (
        SELECT id FROM public.vehicles
        WHERE fleet_id = get_user_fleet_id() OR is_superadmin()
    ));

-- ============================================================================
-- VIEW: service_events_with_vehicle
-- ============================================================================

CREATE OR REPLACE VIEW public.service_events_with_vehicle AS
SELECT
    se.id,
    se.vehicle_id,
    se.service_type,
    se.service_items,
    se.mileage,
    se.service_date,
    se.next_service_date,
    se.location,
    se.status,
    se.cost,
    se.notes,
    se.created_by,
    se.created_at,
    se.updated_at,
    v.name AS vehicle_name,
    v.plate_number,
    v.driver_name,
    v.make,
    v.model,
    v.year,
    v.fleet_id,
    -- Computed status: auto-detect overdue
    CASE
        WHEN se.status = 'completed' THEN 'completed'
        WHEN se.status = 'in_progress' THEN 'in_progress'
        WHEN se.service_date < CURRENT_DATE AND se.status != 'completed' THEN 'overdue'
        ELSE se.status
    END AS computed_status
FROM public.service_events se
JOIN public.vehicles v ON v.id = se.vehicle_id;
