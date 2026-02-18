import { supabase } from "lib/supabase";

const BUCKET = "fleet-logos";

/**
 * Upload a logo for a fleet. Replaces existing logo if any.
 * @param {string} fleetId
 * @param {File} file - Image file (png, jpg, svg)
 * @returns {Promise<{ logoUrl: string|null, error: Error|null }>}
 */
export async function uploadFleetLogo(fleetId, file) {
  try {
    const ext = file.name.split(".").pop().toLowerCase();
    const filePath = `${fleetId}/logo.${ext}`;

    // Remove any existing logo files first
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET)
      .list(fleetId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles.map((f) => `${fleetId}/${f.name}`);
      await supabase.storage.from(BUCKET).remove(filesToRemove);
    }

    // Upload the new file
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // Get the public URL (v1 API returns { publicURL } or { data: { publicURL } })
    const result = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    const publicURL = result.publicURL || result.data?.publicURL;
    if (!publicURL) throw new Error("Could not generate public URL for logo");

    // Add cache-busting param to avoid stale logos
    const logoUrl = `${publicURL}?t=${Date.now()}`;

    // Update the fleets table
    const { error: updateError } = await supabase
      .from("fleets")
      .update({ logo_url: logoUrl })
      .eq("id", fleetId);

    if (updateError) throw updateError;

    return { logoUrl, error: null };
  } catch (err) {
    console.error("Error uploading fleet logo:", err);
    return { logoUrl: null, error: err };
  }
}

/**
 * Remove the logo for a fleet.
 * @param {string} fleetId
 * @returns {Promise<{ error: Error|null }>}
 */
export async function removeFleetLogo(fleetId) {
  try {
    // List and remove all files in fleet folder
    const { data: existingFiles } = await supabase.storage
      .from(BUCKET)
      .list(fleetId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToRemove = existingFiles.map((f) => `${fleetId}/${f.name}`);
      await supabase.storage.from(BUCKET).remove(filesToRemove);
    }

    // Clear the logo_url in fleets table
    const { error: updateError } = await supabase
      .from("fleets")
      .update({ logo_url: null })
      .eq("id", fleetId);

    if (updateError) throw updateError;

    return { error: null };
  } catch (err) {
    console.error("Error removing fleet logo:", err);
    return { error: err };
  }
}
