import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

/**
 * Hook to fetch service events with pagination and filters
 * @param {Object} options
 * @param {string} options.vehicleId - Filter by vehicle ID (optional)
 * @param {string} options.status - Filter by status (optional)
 * @param {number} options.month - Filter by month (1-12, optional)
 * @param {number} options.year - Filter by year (optional)
 * @param {number} options.page - Current page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @returns {{ events: Array, loading: boolean, error: Error | null, totalCount: number, refetch: Function }}
 */
export function useServiceEvents({
  vehicleId = null,
  status = null,
  month = null,
  year = null,
  page = 1,
  pageSize = 10,
} = {}) {
  const { fleetId: authFleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const effectiveFleetId = authFleetId;
  const [events, setEvents] = useState([]);
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

  const fetchEvents = useCallback(async () => {
    try {
      if (!isSuperAdmin && !effectiveFleetId) {
        if (!authLoading && isMounted.current) {
          setEvents([]);
          setTotalCount(0);
          setError(null);
          setLoading(false);
        }
        return;
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("service_events_with_vehicle")
        .select("*", { count: "exact", head: false })
        .order("service_date", { ascending: false });

      if (!isSuperAdmin && effectiveFleetId) {
        query = query.eq("fleet_id", effectiveFleetId);
      }

      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

      if (status) {
        query = query.eq("computed_status", status);
      }

      if (month && year) {
        const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
        const endDate = new Date(year, month, 0).toISOString().split("T")[0];
        query = query.gte("service_date", startDate).lte("service_date", endDate);
      }

      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      if (isMounted.current) {
        setEvents(data || []);
        setTotalCount(count || 0);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching service events:", err);
      if (isMounted.current) {
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [effectiveFleetId, isSuperAdmin, authLoading, vehicleId, status, month, year, page, pageSize]);

  useEffect(() => {
    setLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, totalCount, refetch: fetchEvents };
}

/**
 * Hook to fetch service stats for dashboard cards
 * @returns {{ stats: Object, loading: boolean, error: Error | null, refetch: Function }}
 */
export function useServiceStats() {
  const { fleetId: authFleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const effectiveFleetId = authFleetId;
  const [stats, setStats] = useState({
    scheduledThisMonth: 0,
    upcoming7Days: 0,
    overdue: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      if (!isSuperAdmin && !effectiveFleetId) {
        if (!authLoading && isMounted.current) {
          setStats({
            scheduledThisMonth: 0,
            upcoming7Days: 0,
            overdue: 0,
            completed: 0,
          });
          setError(null);
          setLoading(false);
        }
        return;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      const today = now.toISOString().split("T")[0];
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      let baseQuery = supabase.from("service_events_with_vehicle").select("id, service_date, computed_status");

      if (!isSuperAdmin && effectiveFleetId) {
        baseQuery = baseQuery.eq("fleet_id", effectiveFleetId);
      }

      const { data, error: queryError } = await baseQuery;

      if (queryError) throw queryError;

      const events = data || [];

      const scheduledThisMonth = events.filter(
        (e) => e.service_date >= startOfMonth && e.service_date <= endOfMonth
      ).length;

      const upcoming7Days = events.filter(
        (e) => e.service_date >= today && e.service_date <= in7Days && e.computed_status !== "completed"
      ).length;

      const overdue = events.filter((e) => e.computed_status === "overdue").length;

      const completed = events.filter((e) => e.computed_status === "completed").length;

      if (isMounted.current) {
        setStats({
          scheduledThisMonth,
          upcoming7Days,
          overdue,
          completed,
        });
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching service stats:", err);
      if (isMounted.current) {
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [effectiveFleetId, isSuperAdmin, authLoading]);

  useEffect(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}

/**
 * Hook to fetch vehicle service history
 * @param {string} vehicleId
 * @returns {{ events: Array, loading: boolean, error: Error | null, refetch: Function }}
 */
export function useVehicleServiceHistory(vehicleId) {
  const { fleetId: authFleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const effectiveFleetId = authFleetId;
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

  const fetchHistory = useCallback(async () => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    try {
      if (!isSuperAdmin && !effectiveFleetId) {
        if (!authLoading && isMounted.current) {
          setEvents([]);
          setError(null);
          setLoading(false);
        }
        return;
      }

      let query = supabase
        .from("service_events_with_vehicle")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("service_date", { ascending: false });

      if (!isSuperAdmin && effectiveFleetId) {
        query = query.eq("fleet_id", effectiveFleetId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      if (isMounted.current) {
        setEvents(data || []);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching vehicle service history:", err);
      if (isMounted.current) {
        setError(err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [vehicleId, effectiveFleetId, isSuperAdmin, authLoading]);

  useEffect(() => {
    setLoading(true);
    fetchHistory();
  }, [fetchHistory]);

  return { events, loading, error, refetch: fetchHistory };
}

/**
 * Function to create a new service event
 * @param {Object} eventData
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function createServiceEvent(eventData) {
  try {
    const { data, error } = await supabase
      .from("service_events")
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error creating service event:", err);
    return { data: null, error: err };
  }
}

/**
 * Function to update a service event
 * @param {string} eventId
 * @param {Object} updates
 * @returns {Promise<{data: Object | null, error: Error | null}>}
 */
export async function updateServiceEvent(eventId, updates) {
  try {
    const { data, error } = await supabase
      .from("service_events")
      .update(updates)
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error updating service event:", err);
    return { data: null, error: err };
  }
}

/**
 * Function to delete a service event
 * @param {string} eventId
 * @returns {Promise<{error: Error | null}>}
 */
export async function deleteServiceEvent(eventId) {
  try {
    const { error } = await supabase.from("service_events").delete().eq("id", eventId);

    if (error) throw error;
    return { error: null };
  } catch (err) {
    console.error("Error deleting service event:", err);
    return { error: err };
  }
}
