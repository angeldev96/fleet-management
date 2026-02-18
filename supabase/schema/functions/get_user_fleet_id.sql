-- ============================================================================
-- FUNCTION: get_user_fleet_id()
-- Description: Returns the fleet_id of the currently authenticated user
-- Used by: RLS policies for multitenancy isolation
-- Security: SECURITY DEFINER to access user_profiles regardless of RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_fleet_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT fleet_id FROM user_profiles WHERE id = auth.uid();
$$;
