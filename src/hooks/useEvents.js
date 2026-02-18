import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

/**
 * Hook to fetch events/alerts
 * @param {Object} options
 * @param {string} options.fleetId - Fleet ID to filter
 * @param {Array<string>} options.severity - Filter by severity ['warning', 'critical']
 * @param {Array<string>} options.eventTypes - Filter by event types
 * @param {number} options.limit - Limit results (default: 50)
 * @param {number} options.hoursAgo - Filter events from last N hours (default: 24)
 * @param {number} options.refreshInterval - Polling interval in ms (default: 30000)
 * @returns {{ events: Array, loading: boolean, error: Error | null, refetch: Function }}
 */
export function useEvents({
  fleetId = null,
  severity = ["info", "warning", "critical"],
  eventTypes = null,
  limit = 50,
  hoursAgo = 24,
  refreshInterval = 30000,
} = {}) {
  const { fleetId: authFleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const effectiveFleetId = fleetId ?? authFleetId;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      if (!isSuperAdmin && !effectiveFleetId) {
        if (!authLoading && isMounted.current) {
          setEvents([]);
          setError(null);
          setLoading(false);
        }
        return;
      }
      const sinceDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from("events")
        .select(
          `
          *,
          vehicles!inner (
            id,
            name,
            driver_name,
            plate_number,
            fleet_id
          )
        `
        )
        .in("severity", severity)
        .gte("event_at", sinceDate)
        .order("event_at", { ascending: false })
        .limit(limit);

      if (!isSuperAdmin && effectiveFleetId) {
        query = query.eq("vehicles.fleet_id", effectiveFleetId);
      }

      if (eventTypes && eventTypes.length > 0) {
        // When specific event types are requested, use them directly
        query = query.in("event_type", eventTypes);
      } else {
        // Default view: exclude noise event types
        query = query
          .neq("event_type", "location_update")
          .neq("event_type", "device_offline")
          .neq("event_type", "device_online")
          .neq("event_type", "power_event")
          .neq("event_type", "pid_reading");
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      if (isMounted.current) {
        setEvents(data || []);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      if (isMounted.current) {
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [effectiveFleetId, isSuperAdmin, authLoading, severity, eventTypes, limit, hoursAgo]);

  useEffect(() => {
    fetchEvents();

    const interval = setInterval(fetchEvents, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchEvents, refreshInterval]);

  return { events, loading, error, refetch: fetchEvents };
}

/**
 * Hook to fetch events for a specific vehicle
 * @param {string} vehicleId
 * @param {Object} options
 * @returns {{ events: Array, loading: boolean, error: Error | null }}
 */
export function useVehicleEvents(vehicleId, { limit = 50, eventTypes = null } = {}) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const fetchEvents = async () => {
      try {
        if (!isSuperAdmin && !fleetId) {
          if (!authLoading && isMounted.current) {
            setEvents([]);
            setError(null);
            setLoading(false);
          }
          return;
        }
        let query = supabase
          .from("events")
          .select("*, vehicles!inner(fleet_id)")
          .eq("vehicle_id", vehicleId)
          .neq("event_type", "location_update")
          .order("event_at", { ascending: false })
          .limit(limit);

        if (eventTypes && eventTypes.length > 0) {
          query = query.in("event_type", eventTypes);
        }

        if (!isSuperAdmin && fleetId) {
          query = query.eq("vehicles.fleet_id", fleetId);
        }

        const { data, error: queryError } = await query;

        if (queryError) throw queryError;

        if (isMounted.current) {
          setEvents(data || []);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching vehicle events:", err);
        if (isMounted.current) {
          setError(err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchEvents();
  }, [vehicleId, limit, fleetId, isSuperAdmin, authLoading, eventTypes]);

  return { events, loading, error };
}

/**
 * Hook to fetch recent alerts (warning + critical)
 * @param {Object} options
 * @param {number} options.limit - Number of alerts to fetch
 * @returns {{ alerts: Array, loading: boolean, error: Error | null, refetch: Function }}
 */
export function useRecentAlerts({ limit = 10, refreshInterval = 30000 } = {}) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      if (!isSuperAdmin && !fleetId) {
        if (!authLoading && isMounted.current) {
          setAlerts([]);
          setError(null);
          setLoading(false);
        }
        return;
      }
      let query = supabase
        .from("events")
        .select(
          `
          *,
          vehicles!inner (
            id,
            name,
            driver_name,
            plate_number,
            fleet_id
          )
        `
        )
        .in("severity", ["info", "warning", "critical"])
        .neq("event_type", "location_update")
        .neq("event_type", "device_offline")
        .neq("event_type", "device_online")
        .neq("event_type", "power_event")
        .neq("event_type", "pid_reading")
        .order("event_at", { ascending: false })
        .limit(limit);

      if (!isSuperAdmin && fleetId) {
        query = query.eq("vehicles.fleet_id", fleetId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      if (isMounted.current) {
        setAlerts(data || []);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching alerts:", err);
      if (isMounted.current) {
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [limit, fleetId, isSuperAdmin, authLoading]);

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(fetchAlerts, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchAlerts, refreshInterval]);

  return { alerts, loading, error, refetch: fetchAlerts };
}

/**
 * Hook to fetch vehicle alerts and DTC counts for a list of vehicles
 * @param {Array<string>} vehicleIds - Array of vehicle IDs to fetch alerts for
 * @returns {{ vehicleAlerts: Object, dtcCounts: Object, loading: boolean }}
 */
export function useVehicleAlerts(vehicleIds = []) {
  const [vehicleAlerts, setVehicleAlerts] = useState({});
  const [dtcCounts, setDtcCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchAlerts = useCallback(async () => {
    if (!vehicleIds || vehicleIds.length === 0) {
      if (isMounted.current) {
        setVehicleAlerts({});
        setDtcCounts({});
      }
      return;
    }

    setLoading(true);

    try {
      // Start of today in Jamaica timezone (America/Jamaica = UTC-5, no DST)
      const now = new Date();
      const jamaicaOffset = -5 * 60; // Jamaica is UTC-5
      const jamaicaTime = new Date(now.getTime() + (jamaicaOffset + now.getTimezoneOffset()) * 60000);
      const startOfDay = new Date(jamaicaTime.getFullYear(), jamaicaTime.getMonth(), jamaicaTime.getDate());
      const startOfDayUTC = new Date(startOfDay.getTime() - (jamaicaOffset + now.getTimezoneOffset()) * 60000);
      const sinceStartOfDay = startOfDayUTC.toISOString();

      // Get today's alerts for all vehicles (fleet-scoped via RLS)
      const { data: alerts, error: alertsError } = await supabase
        .from("events")
        .select("vehicle_id, severity, event_type")
        .in("severity", ["info", "warning", "critical"])
        .neq("event_type", "location_update")
        .neq("event_type", "device_offline")
        .neq("event_type", "device_online")
        .neq("event_type", "power_event")
        .neq("event_type", "pid_reading")
        .gte("event_at", sinceStartOfDay);

      if (alertsError) {
        console.error("Error fetching vehicle alerts:", alertsError);
      }

      // Get DTC counts
      const { data: dtcs, error: dtcsError } = await supabase
        .from("events")
        .select("vehicle_id")
        .in("vehicle_id", vehicleIds)
        .eq("event_type", "dtc_detected");

      if (dtcsError) {
        console.error("Error fetching DTC counts:", dtcsError);
      }

      // Group alerts by vehicle
      const alertsByVehicle = {};
      (alerts || [])
        .filter((alert) => vehicleIds.includes(alert.vehicle_id))
        .forEach((alert) => {
          if (!alertsByVehicle[alert.vehicle_id]) {
            alertsByVehicle[alert.vehicle_id] = {
              hasCritical: false,
              hasWarning: false,
              harshCount: 0,
            };
          }
          // Only DTCs and collisions count as "issues" (Warning/Alert status badge)
          const isIssue = ["dtc_detected", "collision_detected"].includes(alert.event_type);
          if (isIssue && alert.severity === "critical") alertsByVehicle[alert.vehicle_id].hasCritical = true;
          if (isIssue && alert.severity === "warning") alertsByVehicle[alert.vehicle_id].hasWarning = true;
          if (["harsh_braking", "harsh_acceleration", "harsh_cornering"].includes(alert.event_type)) {
            alertsByVehicle[alert.vehicle_id].harshCount++;
          }
        });

      if (isMounted.current) {
        setVehicleAlerts(alertsByVehicle);

        // Count DTCs by vehicle
        const dtcsByVehicle = {};
        dtcs?.forEach((dtc) => {
          dtcsByVehicle[dtc.vehicle_id] = (dtcsByVehicle[dtc.vehicle_id] || 0) + 1;
        });
        setDtcCounts(dtcsByVehicle);
      }
    } catch (err) {
      console.error("Error fetching vehicle alerts:", err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [JSON.stringify(vehicleIds)]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { vehicleAlerts, dtcCounts, loading };
}

export default useEvents;
