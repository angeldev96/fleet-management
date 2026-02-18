-- ============================================================================
-- SEED DATA: Demo Data for Entry MVP
-- Description: Sample data for development and demo purposes
-- Warning: This will insert data - run only on dev/demo environments
-- ============================================================================

-- Note: This seed file assumes tables are empty or uses ON CONFLICT
-- For production, never run seed files

-- ============================================================================
-- FLEETS
-- ============================================================================
INSERT INTO public.fleets (id, name) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Demo Fleet Alpha'),
    ('22222222-2222-2222-2222-222222222222', 'Demo Fleet Beta')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Note: user_profiles require auth.users entries first
-- Create users via Supabase Auth, then run:
-- ============================================================================
-- INSERT INTO public.user_profiles (id, fleet_id, role, full_name) VALUES
--     ('<auth_user_id>', '11111111-1111-1111-1111-111111111111', 'admin', 'Demo Admin'),
--     ('<auth_user_id>', '11111111-1111-1111-1111-111111111111', 'user', 'Demo User');

-- ============================================================================
-- VEHICLES (Sample - 5 vehicles per fleet)
-- ============================================================================
INSERT INTO public.vehicles (id, fleet_id, name, plate_number, driver_name, make, model, year, last_latitude, last_longitude, last_speed, last_heading, last_seen_at) VALUES
    -- Fleet Alpha vehicles
    ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Truck 001', 'ABC-1234', 'John Smith', 'Ford', 'F-150', 2022, 25.7617, -80.1918, 45.5, 180, now() - interval '2 minutes'),
    ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Truck 002', 'ABC-5678', 'Jane Doe', 'Chevrolet', 'Silverado', 2023, 25.7747, -80.1897, 0, 0, now() - interval '10 minutes'),
    ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Van 001', 'DEF-1234', 'Bob Wilson', 'Mercedes', 'Sprinter', 2021, 25.7850, -80.2100, 32.0, 90, now() - interval '1 minute'),
    ('a4444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Sedan 001', 'DEF-5678', 'Alice Brown', 'Toyota', 'Camry', 2023, 25.7500, -80.2200, 55.0, 270, now() - interval '30 seconds'),
    ('a5555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Truck 003', 'GHI-1234', 'Charlie Davis', 'RAM', '1500', 2022, 25.7900, -80.1800, 0, 45, now() - interval '45 minutes'),
    -- Fleet Beta vehicles
    ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Delivery 001', 'XYZ-1111', 'Mike Johnson', 'Ford', 'Transit', 2023, 26.1224, -80.1373, 28.0, 0, now() - interval '3 minutes'),
    ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Delivery 002', 'XYZ-2222', 'Sarah Lee', 'Mercedes', 'Sprinter', 2022, 26.1100, -80.1500, 40.0, 180, now() - interval '1 minute')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DEVICES
-- ============================================================================
INSERT INTO public.devices (id, vehicle_id, imei, serial_number, firmware_version, last_heartbeat_at) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '860000000000001', 'SN-DEMO-001', 'v2.1.0', now() - interval '2 minutes'),
    ('d2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', '860000000000002', 'SN-DEMO-002', 'v2.1.0', now() - interval '10 minutes'),
    ('d3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', '860000000000003', 'SN-DEMO-003', 'v2.0.5', now() - interval '1 minute'),
    ('d4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', '860000000000004', 'SN-DEMO-004', 'v2.1.0', now() - interval '30 seconds'),
    ('d5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', '860000000000005', 'SN-DEMO-005', 'v2.0.5', now() - interval '45 minutes'),
    ('d6666666-6666-6666-6666-666666666666', 'b1111111-1111-1111-1111-111111111111', '860000000000006', 'SN-DEMO-006', 'v2.1.0', now() - interval '3 minutes'),
    ('d7777777-7777-7777-7777-777777777777', 'b2222222-2222-2222-2222-222222222222', '860000000000007', 'SN-DEMO-007', 'v2.1.0', now() - interval '1 minute')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EVENTS (Sample events)
-- ============================================================================
INSERT INTO public.events (vehicle_id, device_id, event_type, event_subtype, severity, latitude, longitude, speed, event_at) VALUES
    -- Location updates
    ('a1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'location_update', NULL, 'info', 25.7617, -80.1918, 45.5, now() - interval '2 minutes'),
    ('a3333333-3333-3333-3333-333333333333', 'd3333333-3333-3333-3333-333333333333', 'location_update', NULL, 'info', 25.7850, -80.2100, 32.0, now() - interval '1 minute'),
    -- Driver behavior events
    ('a1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'harsh_braking', NULL, 'warning', 25.7600, -80.1900, 50.0, now() - interval '15 minutes'),
    ('a4444444-4444-4444-4444-444444444444', 'd4444444-4444-4444-4444-444444444444', 'overspeed', NULL, 'warning', 25.7500, -80.2200, 75.0, now() - interval '5 minutes'),
    -- DTC event with subtype
    ('a2222222-2222-2222-2222-222222222222', 'd2222222-2222-2222-2222-222222222222', 'dtc_detected', 'P0300', 'warning', 25.7747, -80.1897, 0, now() - interval '1 hour'),
    -- Device events
    ('a5555555-5555-5555-5555-555555555555', 'd5555555-5555-5555-5555-555555555555', 'device_offline', NULL, 'warning', 25.7900, -80.1800, 0, now() - interval '30 minutes'),
    -- Collision event
    ('b1111111-1111-1111-1111-111111111111', 'd6666666-6666-6666-6666-666666666666', 'collision_detected', NULL, 'critical', 26.1200, -80.1400, 35.0, now() - interval '2 hours')
ON CONFLICT DO NOTHING;
