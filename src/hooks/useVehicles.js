import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

/**
 * Retry a function up to maxRetries times with exponential backoff.
 * Only retries on network-level errors (connection closed, timeout, etc).
 */
async function withRetry(fn, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isNetworkError =
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError") ||
        err?.message?.includes("ERR_CONNECTION") ||
        err?.code === "PGRST301";
      if (!isNetworkError || attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

/**
 * Hook to fetch vehicles with their status, with server-side pagination and search
 * @param {Object} options
 * @param {string} options.fleetId - Fleet ID to filter (optional, uses RLS)
 * @param {number} options.refreshInterval - Polling interval in ms (default: 30000)
 * @param {number} options.page - Current page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @param {string} options.searchTerm - Search term for filtering (default: "")
 * @param {boolean} options.fetchAll - If true, fetches all records without pagination (default: false)
 * @returns {{ vehicles: Array, loading: boolean, error: Error | null, totalCount: number, refetch: Function }}
 */
export function useVehicles({
  fleetId = null,
  refreshInterval = 30000,
  page = 1,
  pageSize = 10,
  searchTerm = "",
  fetchAll = false,
} = {}) {
  const { fleetId: authFleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const effectiveFleetId = fleetId ?? authFleetId;
  const [vehicles, setVehicles] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const hasData = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      if (!isSuperAdmin && !effectiveFleetId) {
        if (!authLoading && isMounted.current) {
          setVehicles([]);
          setTotalCount(0);
          setError(null);
          setLoading(false);
        }
        return;
      }
      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Query the vehicles_with_status view with count
      let query = supabase
        .from("vehicles_with_status")
        .select("*", { count: "exact", head: false })
        .order("last_seen_at", { ascending: false, nullsFirst: false });

      if (!isSuperAdmin && effectiveFleetId) {
        query = query.eq("fleet_id", effectiveFleetId);
      }

      // Add server-side search filter using .or() with .ilike()
      if (searchTerm) {
        query = query.or(
          `plate_number.ilike.%${searchTerm}%,` +
            `make.ilike.%${searchTerm}%,` +
            `model.ilike.%${searchTerm}%,` +
            `name.ilike.%${searchTerm}%`
        );
      }

      // Add pagination with .range() unless fetchAll is true
      if (!fetchAll) {
        query = query.range(from, to);
      }

      const { data, error: queryError, count } = await withRetry(() => query);

      if (queryError) throw queryError;

      if (isMounted.current) {
        setVehicles(data || []);
        setTotalCount(count || 0);
        setError(null);
        hasData.current = true;
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      if (isMounted.current) {
        // Only set error if we have no data yet (initial load).
        // During polling, keep stale data visible instead of flashing an error.
        if (!hasData.current) {
          setError(err);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [effectiveFleetId, isSuperAdmin, authLoading, page, pageSize, searchTerm, fetchAll]);

  useEffect(() => {
    setLoading(true);
    fetchVehicles();

    // Set up polling
    const interval = setInterval(fetchVehicles, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchVehicles, refreshInterval]);

  return { vehicles, loading, error, totalCount, refetch: fetchVehicles };
}

/**
 * Hook to fetch a single vehicle with details
 * @param {string} vehicleId
 * @returns {{ vehicle: Object | null, loading: boolean, error: Error | null, refetch: Function }}
 */
export function useVehicle(vehicleId) {
  const { fleetId: authFleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const effectiveFleetId = authFleetId;
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

  const fetchVehicle = useCallback(async () => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }

    try {
      if (!isSuperAdmin && !effectiveFleetId) {
        if (!authLoading && isMounted.current) {
          setVehicle(null);
          setError(null);
          setLoading(false);
        }
        return;
      }
      let query = supabase.from("vehicles_with_status").select("*").eq("id", vehicleId);

      if (!isSuperAdmin && effectiveFleetId) {
        query = query.eq("fleet_id", effectiveFleetId);
      }

      const { data, error: queryError } = await query.single();

      if (queryError) throw queryError;

      if (isMounted.current) {
        setVehicle(data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching vehicle:", err);
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
    fetchVehicle();
  }, [fetchVehicle]);

  return { vehicle, loading, error, refetch: fetchVehicle };
}

export default useVehicles;
