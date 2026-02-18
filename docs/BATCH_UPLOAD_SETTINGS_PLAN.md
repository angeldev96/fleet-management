# Batch Upload & Settings Migration Plan

This plan outlines moving vehicle/device creation logic to a new Settings page and adding batch upload capability via CSV.

## User Review Required

> [!IMPORTANT]
> - "Add Vehicle" and "Add Device" buttons will be removed from the main /vehicles list.
> - A new "Inventory Management" section will be added to the Settings page.
> - Batch upload will support CSV format with specific headers (Name, Plate, VIN, etc.).

## Proposed Changes

### [Component Name] Settings View

#### [NEW] [InventorySettings.js](file:///c:/Users/ariva/Desktop/BlackSigma/entrymvp-frontend/src/views/Settings/InventorySettings.js)
-   Create a new view that contains:
    -   "Single Add" forms for Vehicle and Device (extracted from Vehicles.js).
    -   "Batch Upload" section for CSV files.
-   **CSV Logic**:
    -   Input type="file" for .csv.
    -   Client-side parsing (split by lines/commas).
    -   Batch insert into Supabase `vehicles` or `devices` table.
    -   Validation: Ensure required fields are present.

### [Component Name] Routing

#### [MODIFY] [routes.js](file:///c:/Users/ariva/Desktop/BlackSigma/entrymvp-frontend/src/routes.js)
-   Update the `/settings` route to use `InventorySettings` instead of `Dashboard`.

### [Component Name] Vehicles View

#### [MODIFY] [Vehicles.js](file:///c:/Users/ariva/Desktop/BlackSigma/entrymvp-frontend/src/views/Vehicles/Vehicles.js)
-   Remove `handleAddVehicle`, `handleAddDevice` logic.
-   Remove the "Add Vehicle" and "Add Device" buttons and their modals.
-   Add a small note or link to Settings if the list is empty? (Optional).

## Verification Plan

### Manual Verification
1.  **Navigation**: Go to /admin/settings and verify the forms and upload sections are present.
2.  **Single Add**: Use the forms to add ONE vehicle and one device. Verify they appear in the /vehicles list.
3.  **Batch Upload**:
    -   Create a test CSV with 3 vehicles.
    -   Upload it in Settings.
    -   Verify the success message and check /vehicles list for the 3 new entries.
4.  **Cleanup**: Verify /admin/vehicles no longer has the "Add" buttons.
