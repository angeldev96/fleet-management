-- ============================================================================
-- FUNCTION: is_superadmin()
-- Description: Checks if the currently authenticated user has superadmin role
-- Used by: RLS policies to grant full access to superadmins
-- Security: SECURITY DEFINER to access user_profiles regardless of RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (
      SELECT r.name = 'superadmin'
      FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid()
    ),
    false
  );
$$;
