-- ============================================================================
-- TABLE: devices
-- Description: GPS/OBD tracking devices linked to vehicles
-- ============================================================================

CREATE TABLE public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL UNIQUE REFERENCES public.vehicles(id) ON DELETE CASCADE,
    imei TEXT NOT NULL UNIQUE,
    serial_number TEXT,
    firmware_version TEXT,
    last_heartbeat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
