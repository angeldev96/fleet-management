import { supabase } from "lib/supabase";

/**
 * Insert a single vehicle
 * @param {Object} vehicleData - { name, plate_number, make, model, year, driver_name }
 * @param {string} fleetId - The fleet ID to associate
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function addVehicle(vehicleData, fleetId) {
  try {
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        ...vehicleData,
        fleet_id: fleetId,
        year: vehicleData.year ? parseInt(vehicleData.year) : null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error adding vehicle:", err);
    return { data: null, error: err };
  }
}

/**
 * Insert vehicles in batch from parsed CSV rows
 * @param {Array<Object>} rows - Parsed CSV rows with { name, plate_number, make, model, year, driver_name }
 * @param {string} fleetId - The fleet ID to associate
 * @param {Function} onProgress - Callback(current, total) for progress updates
 * @returns {Promise<{ successCount: number, errorCount: number, errors: string[] }>}
 */
export async function batchAddVehicles(rows, fleetId, onProgress) {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

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
        year: row.year ? parseInt(row.year) : null,
        driver_name: row.driver_name || null,
        fleet_id: fleetId,
      };

      const { error } = await supabase.from("vehicles").insert(vehicleInsert);
      if (error) throw error;
      successCount++;
    } catch (err) {
      errorCount++;
      errors.push(`Row ${i + 2}: ${err.message}`);
    }
  }

  return { successCount, errorCount, errors };
}

/**
 * Update an existing vehicle
 * @param {string} vehicleId
 * @param {Object} updates - { name, plate_number, make, model, year, driver_name }
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateVehicle(vehicleId, updates) {
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
    return { data: null, error: err };
  }
}

/**
 * Delete a vehicle
 * @param {string} vehicleId
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function deleteVehicle(vehicleId) {
  try {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    return { data: null, error: err };
  }
}
