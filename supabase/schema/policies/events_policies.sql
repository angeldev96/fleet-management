-- ============================================================================
-- RLS POLICIES: events
-- Access: Users can perform ALL operations on events linked to vehicles
--         in their fleet (through vehicle_id join)
--         Superadmins can perform ALL operations on any event
-- ============================================================================

CREATE POLICY "Event access by fleet"
    ON public.events
    FOR ALL
    TO public
    USING (
        vehicle_id IN (
            SELECT id FROM public.vehicles
            WHERE fleet_id = get_user_fleet_id()
               OR is_superadmin()
        )
    );
