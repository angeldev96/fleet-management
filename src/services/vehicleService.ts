import { supabase } from "lib/supabase";
import type { Vehicle, ServiceResult, BatchResult } from "types/database";

interface VehicleInput {
  name?: string;
  plate_number?: string;
  make?: string;
  model?: string;
  year?: string | number;
  driver_name?: string;
}

export async function addVehicle(vehicleData: VehicleInput, fleetId: string): Promise<ServiceResult<Vehicle>> {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        ...vehicleData,
        fleet_id: fleetId,
        year: vehicleData.year ? parseInt(String(vehicleData.year)) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error adding vehicle:", err);
    return { data: null, error: err as Error };
  }
}

export async function batchAddVehicles(
  rows: VehicleInput[],
  fleetId: string,
  onProgress?: (current: number, total: number) => void,
): Promise<BatchResult> {
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (onProgress) onProgress(i + 1, rows.length);

    try {
      const make = row.make || null;
      const model = row.model || null;
      const plate = row.plate_number || null;
      const autoName = [make, model].filter(Boolean).join(" ") || "Vehicle";
      const name = row.name || (plate ? `${autoName} (${plate})` : autoName);

      const vehicleInsert = {
        name,
        plate_number: plate,
        make,
        model,
        year: row.year ? parseInt(String(row.year)) : null,
        driver_name: row.driver_name || null,
        fleet_id: fleetId,
      };

      const { error } = await supabase.from("vehicles").insert(vehicleInsert);
      if (error) throw error;
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push(`Row ${i + 2}: ${(err as Error).message}`);
    }
  }

  return { successCount, errorCount, errors };
}

export async function updateVehicle(
  vehicleId: string,
  updates: Partial<VehicleInput>,
): Promise<ServiceResult<Vehicle>> {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .update(updates)
      .eq("id", vehicleId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error updating vehicle:", err);
    return { data: null, error: err as Error };
  }
}

export async function deleteVehicle(vehicleId: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    return { data: null, error: err as Error };
  }
}
