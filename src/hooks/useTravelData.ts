import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

interface LocationPoint {
  lat: number;
  lng: number;
  speed: number;
  time: string;
}

interface TravelStats {
  totalDistance: number;
  totalAlerts: number;
  majorStops: number;
  locationPoints: LocationPoint[];
  alertEvents: any[];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useTravelData(vehicleId: string | undefined, startDate: string, endDate: string) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<TravelStats>({
    totalDistance: 0,
    totalAlerts: 0,
    majorStops: 0,
    locationPoints: [],
    alertEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const fetchTravelData = useCallback(async () => {
    if (!vehicleId) return;

    try {
      setLoading(true);
      setError(null);

      if (!isSuperAdmin && !fleetId) {
        if (!authLoading && isMounted.current) {
          setStats({
            totalDistance: 0,
            totalAlerts: 0,
            majorStops: 0,
            locationPoints: [],
            alertEvents: [],
          });
          setLoading(false);
        }
        return;
      }

      const jamaicaOffsetMs = 5 * 60 * 60 * 1000;
      const startDateTime = new Date(`${startDate}T00:00:00`);
      startDateTime.setTime(
        startDateTime.getTime() + jamaicaOffsetMs + startDateTime.getTimezoneOffset() * 60000,
      );

      const endDateTime = new Date(`${endDate}T23:59:59.999`);
      endDateTime.setTime(
        endDateTime.getTime() + jamaicaOffsetMs + endDateTime.getTimezoneOffset() * 60000,
      );

      let locationQuery = supabase
        .from("events")
        .select("event_at, latitude, longitude, speed, vehicles!inner(fleet_id)")
        .eq("vehicle_id", vehicleId)
        .eq("event_type", "location_update")
        .gte("event_at", startDateTime.toISOString())
        .lte("event_at", endDateTime.toISOString())
        .order("event_at", { ascending: true });

      if (!isSuperAdmin && fleetId) {
        locationQuery = locationQuery.eq("vehicles.fleet_id", fleetId);
      }

      const { data: locationEvents } = await locationQuery;

      let alertsQuery = supabase
        .from("events")
        .select(
          "id, event_type, event_subtype, event_data, event_at, severity, latitude, longitude, speed, vehicles!inner(fleet_id)",
        )
        .eq("vehicle_id", vehicleId)
        .in("severity", ["warning", "critical"])
        .neq("event_type", "location_update")
        .gte("event_at", startDateTime.toISOString())
        .lte("event_at", endDateTime.toISOString())
        .order("event_at", { ascending: false });

      if (!isSuperAdmin && fleetId) {
        alertsQuery = alertsQuery.eq("vehicles.fleet_id", fleetId);
      }

      const { data: alertData } = await alertsQuery;

      const points: LocationPoint[] = [];
      let totalDistance = 0;
      let stops = 0;
      let lastPoint: LocationPoint | null = null;
      let stoppedTime = 0;

      const events = locationEvents || [];
      events.forEach((event: any) => {
        const lat = event.latitude !== null ? parseFloat(event.latitude) : null;
        const lng = event.longitude !== null ? parseFloat(event.longitude) : null;
        const speed =
          event.speed !== null && event.speed !== undefined ? Number(event.speed) : 0;

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          const point: LocationPoint = { lat, lng, speed, time: event.event_at };
          points.push(point);

          if (lastPoint) {
            const dist = calculateDistance(lastPoint.lat, lastPoint.lng, point.lat, point.lng);
            totalDistance += dist;
          }

          if (speed < 2) {
            stoppedTime++;
            if (stoppedTime === 3) {
              stops++;
            }
          } else {
            stoppedTime = 0;
          }

          lastPoint = point;
        }
      });

      if (isMounted.current) {
        setStats({
          totalDistance: Math.round(totalDistance * 10) / 10,
          totalAlerts: alertData?.length || 0,
          majorStops: stops,
          locationPoints: points,
          alertEvents: alertData || [],
        });
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching travel data:", err);
      if (isMounted.current) {
        setError(err as Error);
        setLoading(false);
      }
    }
  }, [vehicleId, startDate, endDate, fleetId, isSuperAdmin, authLoading]);

  useEffect(() => {
    isMounted.current = true;
    fetchTravelData();
    return () => {
      isMounted.current = false;
    };
  }, [fetchTravelData]);

  return { stats, loading, error };
}
