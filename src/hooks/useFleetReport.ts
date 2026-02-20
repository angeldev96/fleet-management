import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

interface FleetReportStats {
  totalVehicles: number;
  activeVehicles: number;
  totalDistance: number;
  totalDTCs: number;
  totalBehaviorAlerts: number;
  totalServiceCost: number;
}

export function useFleetReport() {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<FleetReportStats>({
    totalVehicles: 0,
    activeVehicles: 0,
    totalDistance: 0,
    totalDTCs: 0,
    totalBehaviorAlerts: 0,
    totalServiceCost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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

      let vehiclesQuery = supabase.from("vehicles_with_status").select("id, status");

      if (!isSuperAdmin && fleetId) {
        vehiclesQuery = vehiclesQuery.eq("fleet_id", fleetId);
      }

      const { data: vehicles, error: vehiclesError } = await vehiclesQuery;

      if (vehiclesError) throw vehiclesError;

      const totalVehicles = vehicles?.length || 0;
      const activeVehicles =
        vehicles?.filter((v: any) => v.status === "online" || v.status === "idle").length || 0;
      const vehicleIds = vehicles?.map((v: any) => v.id) || [];

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

      const { count: dtcCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .in("vehicle_id", vehicleIds)
        .eq("event_type", "dtc_detected");

      const { count: behaviorCount } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .in("vehicle_id", vehicleIds)
        .in("event_type", ["harsh_braking", "harsh_acceleration", "harsh_cornering", "overspeed"]);

      const { data: locationEvents } = await supabase
        .from("events")
        .select("event_data")
        .in("vehicle_id", vehicleIds)
        .eq("event_type", "location_update")
        .not("event_data", "is", null);

      let totalDistance = 0;
      locationEvents?.forEach((event: any) => {
        const speed = event.event_data?.speed || 0;
        totalDistance += (speed * 30) / 3600;
      });

      const { data: serviceEvents } = await supabase
        .from("service_events")
        .select("cost")
        .in("vehicle_id", vehicleIds)
        .not("cost", "is", null);

      let totalServiceCost = 0;
      serviceEvents?.forEach((event: any) => {
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
        setError(err as Error);
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
