-- ============================================================================
-- MIGRATION: Initial Schema
-- Description: Creates the base schema for Entry MVP
-- Date: 2026-01-27
-- ============================================================================

-- ============================================================================
-- TABLES
-- ============================================================================

-- Fleets (must be created first - parent table)
CREATE TABLE IF NOT EXISTS public.fleets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User Profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    fleet_id UUID REFERENCES public.fleets(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('superadmin', 'admin', 'user')),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Vehicles
CREATE TABLE IF NOT EXISTS public.vehicles (
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

-- Devices
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL UNIQUE REFERENCES public.vehicles(id) ON DELETE CASCADE,
    imei TEXT NOT NULL UNIQUE,
    serial_number TEXT,
    firmware_version TEXT,
    last_heartbeat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL
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
            'power_event'
        )),
    severity TEXT NOT NULL DEFAULT 'info'
        CHECK (severity IN ('info', 'warning', 'critical')),
    latitude NUMERIC,
    longitude NUMERIC,
    speed NUMERIC,
    event_data JSONB,
    raw_payload JSONB,
    event_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_fleet_id ON public.vehicles(fleet_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_fleet_id ON public.user_profiles(fleet_id);
CREATE INDEX IF NOT EXISTS idx_events_vehicle_id ON public.events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_events_event_at ON public.events(event_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_vehicle_event_at ON public.events(vehicle_id, event_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_fleet_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT fleet_id FROM user_profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role = 'superadmin' FROM user_profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ============================================================================
-- VIEWS
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
    END AS status
FROM public.vehicles v
LEFT JOIN public.devices d ON d.vehicle_id = v.id;

CREATE OR REPLACE VIEW public.latest_vehicle_events AS
SELECT DISTINCT ON (vehicle_id)
    vehicle_id,
    event_type,
    severity,
    event_at,
    latitude,
    longitude
FROM public.events
WHERE event_type <> 'location_update'
ORDER BY vehicle_id, event_at DESC;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.fleets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Fleets policy
CREATE POLICY "Fleet access by fleet_id"
    ON public.fleets
    FOR SELECT
    TO public
    USING (id = get_user_fleet_id() OR is_superadmin());

-- User Profiles policy
CREATE POLICY "Profile access by user id"
    ON public.user_profiles
    FOR ALL
    TO public
    USING (id = auth.uid() OR is_superadmin());

-- Vehicles policy
CREATE POLICY "Vehicle access by fleet"
    ON public.vehicles
    FOR ALL
    TO public
    USING ((fleet_id = get_user_fleet_id() AND get_user_fleet_id() IS NOT NULL) OR is_superadmin());

-- Devices policy
CREATE POLICY "Device access by fleet"
    ON public.devices
    FOR ALL
    TO public
    USING (vehicle_id IN (
        SELECT id FROM public.vehicles
        WHERE fleet_id = get_user_fleet_id() OR is_superadmin()
    ));

-- Events policy
CREATE POLICY "Event access by fleet"
    ON public.events
    FOR ALL
    TO public
    USING (vehicle_id IN (
        SELECT id FROM public.vehicles
        WHERE fleet_id = get_user_fleet_id() OR is_superadmin()
    ));
