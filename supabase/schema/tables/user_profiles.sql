-- ============================================================================
-- TABLE: user_profiles
-- Description: User profiles linked to auth.users
-- ============================================================================

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    fleet_id UUID REFERENCES public.fleets(id) ON DELETE SET NULL,
    role_id INTEGER NOT NULL REFERENCES public.roles(id),
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Index for role lookups
CREATE INDEX idx_user_profiles_role_id ON public.user_profiles(role_id);
