-- ============================================================================
-- FUNCTION: get_user_role()
-- Description: Returns the role name of the currently authenticated user
-- Used by: Frontend and RLS policies for role-based access control
-- Security: SECURITY DEFINER to access user_profiles regardless of RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT r.name
  FROM user_profiles up
  JOIN roles r ON up.role_id = r.id
  WHERE up.id = auth.uid();
$$;
