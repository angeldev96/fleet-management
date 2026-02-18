-- ============================================================================
-- RLS POLICIES: vehicles
-- Access: Users can perform ALL operations on vehicles in their fleet
--         Superadmins can perform ALL operations on any vehicle
-- Note: get_user_fleet_id() IS NOT NULL check prevents access when user
--       has no fleet assigned
-- ============================================================================

CREATE POLICY "Vehicle access by fleet"
    ON public.vehicles
    FOR ALL
    TO public
    USING (
        (fleet_id = get_user_fleet_id() AND get_user_fleet_id() IS NOT NULL)
        OR is_superadmin()
    );
