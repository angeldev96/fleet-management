-- ============================================================================
-- TABLE: roles
-- Description: Lookup table for user roles (flexible role management)
-- ============================================================================

CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Default roles
INSERT INTO public.roles (name, description) VALUES
    ('superadmin', 'Full system access to all fleets and data'),
    ('admin', 'Fleet-level admin with management capabilities'),
    ('user', 'Regular user access limited to their fleet'),
    ('viewer', 'Read-only access to fleet data');
