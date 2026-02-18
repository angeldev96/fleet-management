-- ============================================================================
-- TABLE: fleets
-- Description: Fleet tenants - primary entity for multitenancy
-- ============================================================================

CREATE TABLE public.fleets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleets ENABLE ROW LEVEL SECURITY;
