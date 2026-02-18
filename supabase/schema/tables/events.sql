-- ============================================================================
-- TABLE: events
-- Description: Telemetry events and vehicle alerts
-- ============================================================================

CREATE TABLE public.events (
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
            'power_event',
            'pid_reading'
        )),
    event_subtype TEXT,  -- Additional classification (DTC codes, power event types, etc.)
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

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
