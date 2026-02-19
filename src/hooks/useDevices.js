import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";

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
 * Hook to fetch devices with their associated vehicle information, with server-side pagination and search
 * @param {Object} options
 * @param {number} options.refreshInterval - Polling interval in ms (default: 30000)
 * @param {number} options.page - Current page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 10)
 * @param {string} options.searchTerm - Search term for filtering (default: "")
 * @returns {{ devices: Array, loading: boolean, error: Error | null, totalCount: number, refetch: Function }}
 */
export function useDevices({
  refreshInterval = 30000,
  page = 1,
  pageSize = 10,
  searchTerm = "",
} = {}) {
  const { fleetId, isSuperAdmin, loading: authLoading } = useAuth();
  const [devices, setDevices] = useState([]);
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
      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build query for devices with vehicle info
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
          { count: "exact", head: false }
        )
        .order("created_at", { ascending: false });

      if (!isSuperAdmin && fleetId) {
        query = query.eq("vehicles.fleet_id", fleetId);
      }

      // Add server-side search filter using .or() with .ilike()
      // Note: Search on joined fields (vehicle name/plate) is limited;
      // we search on device direct fields (imei, serial_number)
      if (searchTerm) {
        query = query.or(
          `imei.ilike.%${searchTerm}%,` + `serial_number.ilike.%${searchTerm}%`
        );
      }

      // Add pagination with .range()
      query = query.range(from, to);

      const { data: devicesData, error: devicesError, count } = await withRetry(() => query);

      if (devicesError) throw devicesError;

      // Format the data for easier consumption
      const formattedDevices =
        devicesData?.map((device) => ({
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
          // Use the vehicle's status so devices and vehicles always match
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
    fetchDevices();

    const interval = setInterval(fetchDevices, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchDevices, refreshInterval]);

  return { devices, loading, error, totalCount, refetch: fetchDevices };
}

/**
 * Map the vehicle status to a device-compatible status.
 * Devices show three states: 'online', 'offline', 'inactive'.
 * Vehicles that have never been seen are treated as 'inactive'.
 * @param {string} vehicleStatus - The vehicle's status field (online, idle, offline)
 * @param {string} lastSeenAt - The vehicle's last_seen_at timestamp
 * @returns {string} - Device status: 'online', 'offline', 'inactive'
 */
function mapVehicleStatusToDevice(vehicleStatus, lastSeenAt) {
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
