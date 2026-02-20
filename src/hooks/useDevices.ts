import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";
import type { VehicleStatus } from "types/database";

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

export interface FormattedDevice {
  id: string;
  vehicleId: string;
  imei: string;
  serialNumber: string | null;
  firmwareVersion: string | null;
  lastHeartbeat: string | null;
  createdAt: string;
  vehicleName: string;
  plateNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number | string;
  status: "online" | "offline" | "inactive";
}

interface UseDevicesOptions {
  refreshInterval?: number;
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

export function useDevices({
  refreshInterval = 30000,
  page = 1,
  pageSize = 10,
  searchTerm = "",
}: UseDevicesOptions = {}) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [devices, setDevices] = useState<FormattedDevice[]>([]);
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

  const fetchDevices = useCallback(async () => {
    try {
      if (!isSuperAdmin && !fleetId) {
        if (!authLoading && isMounted.current) {
          setDevices([]);
          setTotalCount(0);
          setError(null);
          setLoading(false);
        }
        return;
      }
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("devices")
        .select(
          `
          id,
          vehicle_id,
          imei,
          serial_number,
          firmware_version,
          last_heartbeat_at,
          created_at,
          vehicles!inner (
            id,
            name,
            plate_number,
            make,
            model,
            year,
            fleet_id,
            status,
            last_seen_at
          )
        `,
          { count: "exact", head: false },
        )
        .order("created_at", { ascending: false });

      if (!isSuperAdmin && fleetId) {
        query = query.eq("vehicles.fleet_id", fleetId);
      }

      if (searchTerm) {
        query = query.or(`imei.ilike.%${searchTerm}%,` + `serial_number.ilike.%${searchTerm}%`);
      }

      query = query.range(from, to);

      const { data: devicesData, error: devicesError, count }: any = await withRetry(() => query as any);

      if (devicesError) throw devicesError;

      const formattedDevices: FormattedDevice[] =
        (devicesData as any[])?.map((device: any) => ({
          id: device.id,
          vehicleId: device.vehicle_id,
          imei: device.imei,
          serialNumber: device.serial_number,
          firmwareVersion: device.firmware_version,
          lastHeartbeat: device.last_heartbeat_at,
          createdAt: device.created_at,
          vehicleName: device.vehicles?.name || "Unassigned",
          plateNumber: device.vehicles?.plate_number || "N/A",
          vehicleMake: device.vehicles?.make || "",
          vehicleModel: device.vehicles?.model || "",
          vehicleYear: device.vehicles?.year || "",
          status: mapVehicleStatusToDevice(device.vehicles?.status, device.vehicles?.last_seen_at),
        })) || [];

      if (isMounted.current) {
        setDevices(formattedDevices);
        setTotalCount(count || 0);
        setError(null);
        hasData.current = true;
      }
    } catch (err) {
      console.error("Error fetching devices:", err);
      if (isMounted.current && !hasData.current) {
        setError(err as Error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [page, pageSize, searchTerm, fleetId, isSuperAdmin, authLoading]);

  useEffect(() => {
    setLoading(true);
    fetchDevices();

    const interval = setInterval(fetchDevices, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchDevices, refreshInterval]);

  return { devices, loading, error, totalCount, refetch: fetchDevices };
}

function mapVehicleStatusToDevice(
  vehicleStatus: VehicleStatus | null | undefined,
  lastSeenAt: string | null | undefined,
): "online" | "offline" | "inactive" {
  if (!vehicleStatus || !lastSeenAt) return "inactive";

  switch (vehicleStatus) {
    case "online":
    case "idle":
      return "online";
    case "offline":
      return "offline";
    default:
      return "inactive";
  }
}
