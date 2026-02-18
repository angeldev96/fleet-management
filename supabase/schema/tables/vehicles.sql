-- ============================================================================
-- TABLE: vehicles
-- Description: Vehicles belonging to each fleet
-- ============================================================================

CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_id UUID NOT NULL REFERENCES public.fleets(id) ON DELETE CASCADE,
    name TEXT,
    plate_number TEXT,
    vin TEXT,
    driver_name TEXT,
    make TEXT,
    model TEXT,
    year INTEGER,
    last_latitude NUMERIC,
    last_longitude NUMERIC,
    last_speed NUMERIC,
    last_heading NUMERIC,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
