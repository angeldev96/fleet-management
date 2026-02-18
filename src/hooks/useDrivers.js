import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

/**
 * Hook to fetch drivers with their recent events, with server-side pagination and search
 * @param {Object} options
 * @param {number} options.refreshInterval - Polling interval in ms (default: 30000)
 * @param {number} options.page - Current page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @param {string} options.searchTerm - Search term for filtering (default: "")
 * @returns {{ drivers: Array, loading: boolean, error: Error | null, totalCount: number, refetch: Function }}
 */
export function useDrivers({
  refreshInterval = 30000,
  page = 1,
  pageSize = 10,
  searchTerm = "",
} = {}) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      if (!isSuperAdmin && !fleetId) {
        if (!authLoading && isMounted.current) {
          setDrivers([]);
          setTotalCount(0);
          setError(null);
          setLoading(false);
        }
        return;
      }
      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build query for vehicles with driver info
      let query = supabase
        .from("vehicles")
        .select("id, name, driver_name, plate_number", { count: "exact", head: false })
        .not("driver_name", "is", null)
        .order("driver_name", { ascending: true });

      if (!isSuperAdmin && fleetId) {
        query = query.eq("fleet_id", fleetId);
      }

      // Add server-side search filter using .or() with .ilike()
      if (searchTerm) {
        query = query.or(
          `driver_name.ilike.%${searchTerm}%,` +
            `name.ilike.%${searchTerm}%`
        );
      }

      // Add pagination with .range()
      query = query.range(from, to);

      const { data: vehicles, error: vehiclesError, count } = await query;

      if (vehiclesError) throw vehiclesError;

      // Get latest driving event for each vehicle
      const vehicleIds = vehicles?.map((v) => v.id) || [];

      if (vehicleIds.length === 0) {
        if (isMounted.current) {
          setDrivers([]);
          setTotalCount(count || 0);
          setLoading(false);
        }
        return;
      }

      // Get recent driving events (not location updates)
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("vehicle_id, event_type, severity, event_at")
        .in("vehicle_id", vehicleIds)
        .in("event_type", [
          "harsh_braking",
          "harsh_acceleration",
          "harsh_cornering",
          "overspeed",
          "collision_detected",
        ])
        .order("event_at", { ascending: false });

      if (eventsError) throw eventsError;

      // Group events by vehicle and get the most recent
      const latestEventByVehicle = {};
      events?.forEach((event) => {
        if (!latestEventByVehicle[event.vehicle_id]) {
          latestEventByVehicle[event.vehicle_id] = event;
        }
      });

      // Combine vehicles with their latest events
      // Calculate index offset based on pagination
      const indexOffset = (page - 1) * pageSize;
      const driversWithEvents =
        vehicles?.map((vehicle, index) => ({
          id: `D${String(indexOffset + index + 1).padStart(3, "0")}`,
          vehicleId: vehicle.id,
          driverName: vehicle.driver_name,
          vehicleName: vehicle.name,
          plateNumber: vehicle.plate_number,
          recentEvent: latestEventByVehicle[vehicle.id] || null,
        })) || [];

      if (isMounted.current) {
        setDrivers(driversWithEvents);
        setTotalCount(count || 0);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching drivers:", err);
      if (isMounted.current) {
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [page, pageSize, searchTerm, fleetId, isSuperAdmin, authLoading]);

  useEffect(() => {
    setLoading(true);
    fetchDrivers();

    const interval = setInterval(fetchDrivers, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchDrivers, refreshInterval]);

  return { drivers, loading, error, totalCount, refetch: fetchDrivers };
}

export default useDrivers;
