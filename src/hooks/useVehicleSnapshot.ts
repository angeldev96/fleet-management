import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";
import type { Vehicle } from "types/database";

export interface VehicleSnapshot {
  battery_voltage: number | null;
  rpm: number | null;
  coolant_temp: number | null;
  fuel_level: number | null;
  speed: number | null;
  odometer: number | null;
  engine_load: number | null;
  throttle_position: number | null;
  signal_strength: number | null;
  timestamp: string | null;
  event_type: string | null;
  raw_data: Record<string, any>;
}

interface UseVehicleSnapshotOptions {
  refreshInterval?: number;
}

export function useVehicleSnapshot(
  vehicleId: string | undefined,
  { refreshInterval = 30000 }: UseVehicleSnapshotOptions = {},
) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [snapshot, setSnapshot] = useState<VehicleSnapshot | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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

      let vehicleQuery = supabase.from("vehicles").select("*").eq("id", vehicleId);

      if (!isSuperAdmin && fleetId) {
        vehicleQuery = vehicleQuery.eq("fleet_id", fleetId);
      }

      const { data: vehicleData, error: vehicleError } = await vehicleQuery.single();

      if (vehicleError) throw vehicleError;

      let pidQuery = supabase
        .from("events")
        .select("event_subtype, event_data, event_at, speed, vehicles!inner(fleet_id)")
        .eq("vehicle_id", vehicleId)
        .eq("event_type", "pid_reading")
        .order("event_at", { ascending: false })
        .limit(20);

      if (!isSuperAdmin && fleetId) {
        pidQuery = pidQuery.eq("vehicles.fleet_id", fleetId);
      }

      const { data: pidEvents, error: pidError } = await pidQuery;

      if (pidError) {
        console.warn("Error fetching PID events:", pidError);
      }

      let locationQuery = supabase
        .from("events")
        .select("event_data, event_at, speed, event_type, vehicles!inner(fleet_id)")
        .eq("vehicle_id", vehicleId)
        .in("event_type", ["location_update", "device_online"])
        .order("event_at", { ascending: false })
        .limit(5);

      if (!isSuperAdmin && fleetId) {
        locationQuery = locationQuery.eq("vehicles.fleet_id", fleetId);
      }

      const { data: recentEvents, error: locationError } = await locationQuery;

      if (locationError) {
        console.warn("Error fetching latest telemetry events:", locationError);
      }

      const latestLocation = recentEvents?.[0] || null;

      if (isMounted.current) {
        setVehicle(vehicleData as Vehicle);

        const pidMap: Record<string, any> = {};
        let latestTimestamp: string | null = null;

        (pidEvents || []).forEach((event: any) => {
          if (event.event_subtype && !pidMap[event.event_subtype]) {
            pidMap[event.event_subtype] = event.event_data?.value ?? null;
            if (!latestTimestamp || new Date(event.event_at) > new Date(latestTimestamp)) {
              latestTimestamp = event.event_at;
            }
          }
        });

        const locationData = (latestLocation as any)?.event_data || {};
        const locationTimestamp = (latestLocation as any)?.event_at || null;
        const fallbackTimestamp = latestTimestamp || locationTimestamp;

        const resolveValue = (pidKey: string, locationKey: string) => {
          if (pidMap[pidKey] !== undefined && pidMap[pidKey] !== null) {
            return pidMap[pidKey];
          }
          const locationValue = locationData?.[locationKey];
          return locationValue !== undefined ? locationValue : null;
        };

        let signalStrength: number | null = null;
        if (recentEvents && recentEvents.length > 0) {
          for (const event of recentEvents) {
            const eventData = (event as any).event_data || {};
            if (eventData.signal_strength !== undefined && eventData.signal_strength !== null) {
              signalStrength = eventData.signal_strength;
              break;
            }
          }
        }

        setSnapshot({
          battery_voltage: resolveValue("battery_voltage", "battery_voltage"),
          rpm: resolveValue("rpm", "rpm"),
          coolant_temp: resolveValue("coolant_temp", "coolant_temp"),
          fuel_level: resolveValue("fuel_level", "fuel_level"),
          speed: resolveValue("speed", "speed"),
          odometer: resolveValue("odometer", "odometer"),
          engine_load: resolveValue("engine_load", "engine_load"),
          throttle_position: resolveValue("throttle_position", "throttle"),
          signal_strength: signalStrength,
          timestamp: fallbackTimestamp,
          event_type: "pid_reading",
          raw_data: { pid: pidMap, location: locationData },
        });

        setError(null);
      }
    } catch (err) {
      console.error("Error fetching vehicle snapshot:", err);
      if (isMounted.current) {
        setError(err as Error);
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
