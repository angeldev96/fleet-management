import { supabase } from "lib/supabase";

/**
 * Insert a single device
 * @param {Object} deviceData - { vehicle_id, imei, serial_number }
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function addDevice(deviceData) {
  try {
    const { data, error } = await supabase
      .from("devices")
      .insert(deviceData)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error("Error adding device:", err);
    return { data: null, error: err };
  }
}

/**
 * Insert devices in batch from parsed CSV rows
 * @param {Array<Object>} rows - Parsed CSV rows with { imei, serial_number, plate_number? (optional) }
 * @param {Array<Object>} vehicles - Array of vehicle objects for plate_number -> vehicle_id lookup (if plate_number provided)
 * @param {Function} onProgress - Callback(current, total) for progress updates
 * @returns {Promise<{ successCount: number, errorCount: number, errors: string[] }>}
 */
export async function batchAddDevices(rows, vehicles, onProgress) {
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (onProgress) onProgress(i + 1, rows.length);

    try {
      let vehicleId = null;

      // If plate_number provided, look up the vehicle
      if (row.plate_number) {
        const plateValue = row.plate_number.toLowerCase().trim();
        const vehicle = vehicles.find(
          (v) => v.plate_number?.toLowerCase().trim() === plateValue
        );

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
      errors.push(`Row ${i + 2}: ${err.message}`);
    }
  }

  return { successCount, errorCount, errors };
}

/**
 * Update an existing device
 * @param {string} deviceId - The device UUID
 * @param {Object} updates - Fields to update (e.g. { imei, serial_number, firmware_version })
 * @returns {Promise<{ data: Object|null, error: Error|null }>}
 */
export async function updateDevice(deviceId, updates) {
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
    return { data: null, error: err };
  }
}

/**
 * Delete a device
 * @param {string} deviceId - The device UUID
 * @returns {Promise<{ data: null, error: Error|null }>}
 */
export async function deleteDevice(deviceId) {
  try {
    const { error } = await supabase
      .from("devices")
      .delete()
      .eq("id", deviceId);

    if (error) throw error;
    return { data: null, error: null };
  } catch (err) {
    console.error("Error deleting device:", err);
    return { data: null, error: err };
  }
}
