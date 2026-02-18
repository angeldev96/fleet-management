-- ============================================================================
-- FUNCTION: has_role(role_name TEXT)
-- Description: Checks if the currently authenticated user has a specific role
-- Used by: RLS policies and application logic for role-based access control
-- Security: SECURITY DEFINER to access user_profiles regardless of RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT r.name = role_name
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
    ),
    false
  );
$$;
