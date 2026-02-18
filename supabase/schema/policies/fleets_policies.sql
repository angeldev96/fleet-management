-- ============================================================================
-- RLS POLICIES: fleets
-- Access: Users can only SELECT their own fleet
--         Superadmins can SELECT all fleets
-- ============================================================================

CREATE POLICY "Fleet access by fleet_id"
    ON public.fleets
    FOR SELECT
    TO public
    USING (
        id = get_user_fleet_id()
        OR is_superadmin()
    );
