-- ============================================================================
-- RLS POLICIES: devices
-- Access: Users can perform ALL operations on devices linked to vehicles
--         in their fleet (through vehicle_id join)
--         Superadmins can perform ALL operations on any device
-- ============================================================================

CREATE POLICY "Device access by fleet"
    ON public.devices
    FOR ALL
    TO public
    USING (
        vehicle_id IN (
            SELECT id FROM public.vehicles
            WHERE fleet_id = get_user_fleet_id()
               OR is_superadmin()
        )
    );
