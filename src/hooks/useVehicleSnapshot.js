import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

/**
 * Hook to fetch the latest PID snapshot data for a vehicle
 * PID values include: Battery voltage, RPM, Coolant temperature, etc.
 * These are typically stored in the event_data jsonb field of location_update events
 *
 * @param {string} vehicleId - The vehicle UUID
 * @param {Object} options
 * @param {number} options.refreshInterval - Polling interval in ms (default: 30000)
 * @returns {{ snapshot: Object | null, vehicle: Object | null, loading: boolean, error: Error | null, refetch: Function }}
 */
export function useVehicleSnapshot(vehicleId, { refreshInterval = 30000 } = {}) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [snapshot, setSnapshot] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchSnapshot = useCallback(async () => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    try {
      if (!isSuperAdmin && !fleetId) {
        if (!authLoading && isMounted.current) {
          setVehicle(null);
          setSnapshot(null);
          setError(null);
          setLoading(false);
        }
        return;
      }
      // Fetch vehicle info
      let vehicleQuery = supabase.from("vehicles").select("*").eq("id", vehicleId);

      if (!isSuperAdmin && fleetId) {
        vehicleQuery = vehicleQuery.eq("fleet_id", fleetId);
      }

      const { data: vehicleData, error: vehicleError } = await vehicleQuery.single();

      if (vehicleError) throw vehicleError;

      // Fetch the most recent PID readings for this vehicle
      // PIDs are stored as separate events with event_type = 'pid_reading'
      // Each PID type is identified by event_subtype (battery_voltage, rpm, speed, coolant_temp)
      let pidQuery = supabase
        .from("events")
        .select("event_subtype, event_data, event_at, speed, vehicles!inner(fleet_id)")
        .eq("vehicle_id", vehicleId)
        .eq("event_type", "pid_reading")
        .order("event_at", { ascending: false })
        .limit(20); // Get recent readings to find latest of each type

      if (!isSuperAdmin && fleetId) {
        pidQuery = pidQuery.eq("vehicles.fleet_id", fleetId);
      }

      const { data: pidEvents, error: pidError } = await pidQuery;

      if (pidError) {
        console.warn("Error fetching PID events:", pidError);
      }

      // Fetch the most recent location_update and device_online for fallback last-known telemetry
      // Signal strength comes from these event types
      let locationQuery = supabase
        .from("events")
        .select("event_data, event_at, speed, event_type, vehicles!inner(fleet_id)")
        .eq("vehicle_id", vehicleId)
        .in("event_type", ["location_update", "device_online"])
        .order("event_at", { ascending: false })
        .limit(5); // Get recent events to find best signal data

      if (!isSuperAdmin && fleetId) {
        locationQuery = locationQuery.eq("vehicles.fleet_id", fleetId);
      }

      const { data: recentEvents, error: locationError } = await locationQuery;

      if (locationError) {
        console.warn("Error fetching latest telemetry events:", locationError);
      }

      // Use the most recent event for general data
      const latestLocation = recentEvents?.[0] || null;

      if (isMounted.current) {
        setVehicle(vehicleData);

        // Build snapshot from latest PID readings
        // Group by event_subtype and take the most recent of each
        const pidMap = {};
        let latestTimestamp = null;

        (pidEvents || []).forEach((event) => {
          if (event.event_subtype && !pidMap[event.event_subtype]) {
            pidMap[event.event_subtype] = event.event_data?.value ?? null;
            if (!latestTimestamp || new Date(event.event_at) > new Date(latestTimestamp)) {
              latestTimestamp = event.event_at;
            }
          }
        });

        const locationData = latestLocation?.event_data || {};
        const locationTimestamp = latestLocation?.event_at || null;
        const fallbackTimestamp = latestTimestamp || locationTimestamp;

        const resolveValue = (pidKey, locationKey) => {
          if (pidMap[pidKey] !== undefined && pidMap[pidKey] !== null) {
            return pidMap[pidKey];
          }
          const locationValue = locationData?.[locationKey];
          return locationValue !== undefined ? locationValue : null;
        };

        // Extract signal_strength from the most recent device_online or location_update event
        let signalStrength = null;
        if (recentEvents && recentEvents.length > 0) {
          for (const event of recentEvents) {
            const eventData = event.event_data || {};
            if (eventData.signal_strength !== undefined && eventData.signal_strength !== null) {
              signalStrength = eventData.signal_strength;
              break; // Use the first (most recent) event with signal data
            }
          }
        }

        setSnapshot({
          // Core PID values from pid_reading events
          battery_voltage: resolveValue("battery_voltage", "battery_voltage"),
          rpm: resolveValue("rpm", "rpm"),
          coolant_temp: resolveValue("coolant_temp", "coolant_temp"),
          fuel_level: resolveValue("fuel_level", "fuel_level"),
          speed: resolveValue("speed", "speed"),
          odometer: resolveValue("odometer", "odometer"),
          engine_load: resolveValue("engine_load", "engine_load"),
          throttle_position: resolveValue("throttle_position", "throttle"),
          signal_strength: signalStrength,
          // Metadata
          timestamp: fallbackTimestamp,
          event_type: "pid_reading",
          raw_data: { pid: pidMap, location: locationData },
        });

        setError(null);
      }
    } catch (err) {
      console.error("Error fetching vehicle snapshot:", err);
      if (isMounted.current) {
        setError(err);
        // Still set empty snapshot so UI can show "no data" state
        setSnapshot({
          battery_voltage: null,
          rpm: null,
          coolant_temp: null,
          fuel_level: null,
          speed: null,
          odometer: null,
          engine_load: null,
          throttle_position: null,
          signal_strength: null,
          timestamp: null,
          event_type: null,
          raw_data: {},
        });
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [vehicleId, fleetId, isSuperAdmin, authLoading]);

  useEffect(() => {
    fetchSnapshot();

    if (refreshInterval > 0) {
      const interval = setInterval(fetchSnapshot, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSnapshot, refreshInterval]);

  return { snapshot, vehicle, loading, error, refetch: fetchSnapshot };
}

export default useVehicleSnapshot;
