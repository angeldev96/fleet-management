-- ============================================================================
-- RLS POLICIES: user_profiles
-- Access: Users can perform ALL operations on their own profile
--         Superadmins can perform ALL operations on any profile
-- ============================================================================

CREATE POLICY "Profile access by user id"
    ON public.user_profiles
    FOR ALL
    TO public
    USING (
        id = auth.uid()
        OR is_superadmin()
    );
