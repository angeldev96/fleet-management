-- ============================================================================
-- MIGRATION: Add event_subtype column
-- Description: Adds event_subtype field for additional event classification
-- Date: 2026-01-27
-- ============================================================================

-- Add event_subtype column to events table
-- This field provides additional classification for events:
-- - dtc_detected: DTC code (e.g., "P0300", "P0171")
-- - power_event: type (e.g., "unplug", "low_battery", "reconnect")
-- - Other events: optional additional context

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_subtype TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.events.event_subtype IS 'Additional event classification (DTC codes, power event types, etc.)';
