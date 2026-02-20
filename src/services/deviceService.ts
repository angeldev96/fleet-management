import { supabase } from "lib/supabase";
import type { Device, Vehicle, ServiceResult, BatchResult } from "types/database";

interface DeviceInput {
  vehicle_id?: string | null;
  imei: string;
  serial_number?: string | null;
}

interface DeviceCsvRow {
  imei: string;
  serial_number?: string;
  plate_number?: string;
}

export async function addDevice(deviceData: DeviceInput): Promise<ServiceResult<Device>> {
  try {
    const { data, error } = await supabase.from("devices").insert(deviceData).select().single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error adding device:", err);
    return { data: null, error: err as Error };
  }
}

export async function batchAddDevices(
  rows: DeviceCsvRow[],
  vehicles: Vehicle[],
  onProgress?: (current: number, total: number) => void,
): Promise<BatchResult> {
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (onProgress) onProgress(i + 1, rows.length);

    try {
      let vehicleId: string | null = null;

      if (row.plate_number) {
        const plateValue = row.plate_number.toLowerCase().trim();
        const vehicle = vehicles.find((v) => v.plate_number?.toLowerCase().trim() === plateValue);

        if (!vehicle) {
          throw new Error(`Vehicle with plate "${row.plate_number}" not found`);
        }
        vehicleId = vehicle.id;
      }

      const deviceInsert = {
        vehicle_id: vehicleId,
        imei: row.imei,
        serial_number: row.serial_number || null,
      };

      const { error } = await supabase.from("devices").insert(deviceInsert);
      if (error) throw error;
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push(`Row ${i + 2}: ${(err as Error).message}`);
    }
  }

  return { successCount, errorCount, errors };
}

export async function updateDevice(
  deviceId: string,
  updates: Partial<DeviceInput>,
): Promise<ServiceResult<Device>> {
  try {
    const { data, error } = await supabase
      .from("devices")
      .update(updates)
      .eq("id", deviceId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error updating device:", err);
    return { data: null, error: err as Error };
  }
}

export async function deleteDevice(deviceId: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from("devices").delete().eq("id", deviceId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    console.error("Error deleting device:", err);
    return { data: null, error: err as Error };
  }
}
