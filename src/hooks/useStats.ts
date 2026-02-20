import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

interface DashboardStats {
  vehiclesActive: number;
  vehiclesWithIssues: number;
  alertsToday: number;
  harshEvents: number;
  totalVehicles?: number;
}

interface UseStatsOptions {
  refreshInterval?: number;
}

export function useStats({ refreshInterval = 30000 }: UseStatsOptions = {}) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    vehiclesActive: 0,
    vehiclesWithIssues: 0,
    alertsToday: 0,
    harshEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      if (!isSuperAdmin && !fleetId) {
        if (!authLoading && isMounted.current) {
          setStats({
            vehiclesActive: 0,
            vehiclesWithIssues: 0,
            alertsToday: 0,
            harshEvents: 0,
            totalVehicles: 0,
          });
          setError(null);
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

      const vehicleIds = vehicles?.map((v: any) => v.id) || [];
      const vehiclesActive =
        vehicles?.filter((v: any) => v.status === "online" || v.status === "idle").length || 0;

      if (vehicleIds.length === 0) {
        if (isMounted.current) {
          setStats({
            vehiclesActive,
            vehiclesWithIssues: 0,
            alertsToday: 0,
            harshEvents: 0,
            totalVehicles: 0,
          });
          setError(null);
        }
        return;
      }

      const now = new Date();
      const jamaicaOffset = -5 * 60;
      const jamaicaTime = new Date(now.getTime() + (jamaicaOffset + now.getTimezoneOffset()) * 60000);
      const startOfDay = new Date(jamaicaTime.getFullYear(), jamaicaTime.getMonth(), jamaicaTime.getDate());
      const startOfDayUTC = new Date(
        startOfDay.getTime() - (jamaicaOffset + now.getTimezoneOffset()) * 60000,
      );
      const sinceStartOfDay = startOfDayUTC.toISOString();

      const [
        { data: alerts, error: alertsError },
        { data: vehicleAlerts, error: vehicleAlertsError },
      ] = await Promise.all([
        supabase
          .from("events")
          .select("id, severity, event_type")
          .in("severity", ["warning", "critical"])
          .in("vehicle_id", vehicleIds)
          .neq("event_type", "location_update")
          .neq("event_type", "device_offline")
          .neq("event_type", "device_online")
          .neq("event_type", "power_event")
          .gte("event_at", sinceStartOfDay),
        supabase
          .from("events")
          .select("vehicle_id")
          .in("vehicle_id", vehicleIds)
          .in("event_type", ["dtc_detected", "collision_detected"])
          .gte("event_at", sinceStartOfDay),
      ]);

      if (alertsError) throw alertsError;
      if (vehicleAlertsError) throw vehicleAlertsError;

      const vehiclesWithIssues = new Set(vehicleAlerts?.map((e: any) => e.vehicle_id) || []).size;

      const harshEventTypes = ["harsh_braking", "harsh_acceleration", "harsh_cornering"];
      const harshEvents = alerts?.filter((e: any) => harshEventTypes.includes(e.event_type)).length || 0;

      if (isMounted.current) {
        setStats({
          vehiclesActive,
          vehiclesWithIssues,
          alertsToday: alerts?.length || 0,
          harshEvents,
          totalVehicles: vehicles?.length || 0,
        });

        setError(null);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
      if (isMounted.current) {
        setError(err as Error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [fleetId, isSuperAdmin, authLoading]);

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return { stats, loading, error, refetch: fetchStats };
}
