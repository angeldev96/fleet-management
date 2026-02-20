import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";
import type { Vehicle } from "types/database";

async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isNetworkError =
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("NetworkError") ||
        err?.message?.includes("ERR_CONNECTION") ||
        err?.code === "PGRST301";
      if (!isNetworkError || attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("Unreachable");
}

interface UseVehiclesOptions {
  fleetId?: string | null;
  refreshInterval?: number;
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  fetchAll?: boolean;
}

export function useVehicles({
  fleetId = null,
  refreshInterval = 30000,
  page = 1,
  pageSize = 10,
  searchTerm = "",
  fetchAll = false,
}: UseVehiclesOptions = {}) {
  const { fleetId: authFleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const effectiveFleetId = fleetId ?? authFleetId;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("vehicles_with_status")
        .select("*", { count: "exact", head: false })
        .order("last_seen_at", { ascending: false, nullsFirst: false });

      if (!isSuperAdmin && effectiveFleetId) {
        query = query.eq("fleet_id", effectiveFleetId);
      }

      if (searchTerm) {
        query = query.or(
          `plate_number.ilike.%${searchTerm}%,` +
            `make.ilike.%${searchTerm}%,` +
            `model.ilike.%${searchTerm}%,` +
            `name.ilike.%${searchTerm}%`,
        );
      }

      if (!fetchAll) {
        query = query.range(from, to);
      }

      const { data, error: queryError, count }: any = await withRetry(() => query as any);

      if (queryError) throw queryError;

      if (isMounted.current) {
        setVehicles((data as Vehicle[]) || []);
        setTotalCount(count || 0);
        setError(null);
        hasData.current = true;
      }
    } catch (err) {
      console.error("Error fetching vehicles:", err);
      if (isMounted.current) {
        if (!hasData.current) {
          setError(err as Error);
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

    const interval = setInterval(fetchVehicles, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchVehicles, refreshInterval]);

  return { vehicles, loading, error, totalCount, refetch: fetchVehicles };
}

export function useVehicle(vehicleId: string | undefined) {
  const { fleetId: authFleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const effectiveFleetId = authFleetId;
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
        setVehicle(data as Vehicle);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching vehicle:", err);
      if (isMounted.current) {
        setError(err as Error);
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
