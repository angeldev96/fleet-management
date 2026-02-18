import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

/**
 * Hook to fetch fleet report statistics
 * @returns {{ stats: Object, loading: boolean, error: Error|null, refetch: Function }}
 */
export function useFleetReport() {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    totalDistance: 0,
    totalDTCs: 0,
    totalBehaviorAlerts: 0,
    totalServiceCost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  const fetchFleetStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSuperAdmin && !fleetId) {
        if (!authLoading && isMounted.current) {
          setStats({
            totalVehicles: 0,
            activeVehicles: 0,
            totalDistance: 0,
            totalDTCs: 0,
            totalBehaviorAlerts: 0,
            totalServiceCost: 0,
          });
          setLoading(false);
        }
        return;
      }

      // Get all vehicles with status
      let vehiclesQuery = supabase.from("vehicles_with_status").select("id, status");

      if (!isSuperAdmin && fleetId) {
        vehiclesQuery = vehiclesQuery.eq("fleet_id", fleetId);
      }

      const { data: vehicles, error: vehiclesError } = await vehiclesQuery;

      if (vehiclesError) throw vehiclesError;

      const totalVehicles = vehicles?.length || 0;
      const activeVehicles = vehicles?.filter(v => v.status === "online" || v.status === "idle").length || 0;
      const vehicleIds = vehicles?.map(v => v.id) || [];

      if (vehicleIds.length === 0) {
        if (isMounted.current) {
          setStats({
            totalVehicles,
            activeVehicles,
            totalDistance: 0,
            totalDTCs: 0,
            totalBehaviorAlerts: 0,
            totalServiceCost: 0,
          });
          setLoading(false);
        }
        return;
      }

      // Get DTC count
      const { count: dtcCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .in("vehicle_id", vehicleIds)
        .eq("event_type", "dtc_detected");

      // Get driving behavior alerts count
      const { count: behaviorCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .in("vehicle_id", vehicleIds)
        .in("event_type", ["harsh_braking", "harsh_acceleration", "harsh_cornering", "overspeed"]);

      // Get total distance from location updates
      const { data: locationEvents } = await supabase
        .from("events")
        .select("event_data")
        .in("vehicle_id", vehicleIds)
        .eq("event_type", "location_update")
        .not("event_data", "is", null);

      // Calculate approximate distance from speed data (km)
      let totalDistance = 0;
      locationEvents?.forEach(event => {
        const speed = event.event_data?.speed || 0;
        // Approximate: assuming each event represents ~30 seconds of travel
        totalDistance += (speed * 30) / 3600;
      });

      // Get total service cost
      const { data: serviceEvents } = await supabase
        .from("service_events")
        .select("cost")
        .in("vehicle_id", vehicleIds)
        .not("cost", "is", null);

      let totalServiceCost = 0;
      serviceEvents?.forEach(event => {
        totalServiceCost += parseFloat(event.cost) || 0;
      });

      if (isMounted.current) {
        setStats({
          totalVehicles,
          activeVehicles,
          totalDistance: Math.round(totalDistance),
          totalDTCs: dtcCount || 0,
          totalBehaviorAlerts: behaviorCount || 0,
          totalServiceCost: Math.round(totalServiceCost * 100) / 100,
        });
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching fleet stats:", err);
      if (isMounted.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [fleetId, isSuperAdmin, authLoading]);

  useEffect(() => {
    isMounted.current = true;
    fetchFleetStats();
    return () => {
      isMounted.current = false;
    };
  }, [fetchFleetStats]);

  return { stats, loading, error, refetch: fetchFleetStats };
}
