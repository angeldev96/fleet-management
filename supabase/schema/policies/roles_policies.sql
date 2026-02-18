-- ============================================================================
-- RLS POLICIES: roles
-- Description: Access control for roles table
-- ============================================================================

-- All authenticated users can view roles (needed for joins in queries)
CREATE POLICY "Roles are viewable by authenticated users"
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (true);

-- Only superadmins can modify roles
CREATE POLICY "Only superadmins can insert roles"
    ON public.roles
    FOR INSERT
    TO authenticated
    WITH CHECK (is_superadmin());

CREATE POLICY "Only superadmins can update roles"
    ON public.roles
    FOR UPDATE
    TO authenticated
    USING (is_superadmin())
    WITH CHECK (is_superadmin());

CREATE POLICY "Only superadmins can delete roles"
    ON public.roles
    FOR DELETE
    TO authenticated
    USING (is_superadmin());
