import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

/**
 * Haversine formula to calculate distance between two points in km
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
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

/**
 * Hook to fetch travel data for a vehicle within a date range
 * @param {string} vehicleId
 * @param {string} startDate - Date string (YYYY-MM-DD)
 * @param {string} endDate - Date string (YYYY-MM-DD)
 * @returns {{ stats: Object, loading: boolean, error: Error|null }}
 */
export function useTravelData(vehicleId, startDate, endDate) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    totalDistance: 0,
    totalAlerts: 0,
    majorStops: 0,
    locationPoints: [],
    alertEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

      // Convert selected dates to Jamaica timezone (UTC-5) boundaries
      // "2026-02-12" in Jamaica = 2026-02-12 05:00:00 UTC to 2026-02-13 04:59:59 UTC
      const jamaicaOffsetMs = 5 * 60 * 60 * 1000; // Jamaica is UTC-5
      const startDateTime = new Date(`${startDate}T00:00:00`);
      startDateTime.setTime(startDateTime.getTime() + jamaicaOffsetMs + startDateTime.getTimezoneOffset() * 60000);

      const endDateTime = new Date(`${endDate}T23:59:59.999`);
      endDateTime.setTime(endDateTime.getTime() + jamaicaOffsetMs + endDateTime.getTimezoneOffset() * 60000);

      // Fetch location updates
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

      // Fetch alert events (full details for report)
      let alertsQuery = supabase
        .from("events")
        .select(
          "id, event_type, event_subtype, event_data, event_at, severity, latitude, longitude, speed, vehicles!inner(fleet_id)"
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

      // Process location points
      const points = [];
      let totalDistance = 0;
      let stops = 0;
      let lastPoint = null;
      let stoppedTime = 0;

      const events = locationEvents || [];
      events.forEach((event) => {
        const lat = event.latitude !== null ? parseFloat(event.latitude) : null;
        const lng = event.longitude !== null ? parseFloat(event.longitude) : null;
        const speed = event.speed !== null && event.speed !== undefined ? Number(event.speed) : 0;

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          const point = { lat, lng, speed, time: event.event_at };
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
        setError(err);
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
