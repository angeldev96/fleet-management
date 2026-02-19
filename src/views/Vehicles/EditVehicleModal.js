import React, { useState, useEffect } from "react";

// lucide icons
import { X, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";

// shadcn ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "components/ui/alert-dialog";

// hooks & utils
import { updateVehicle, deleteVehicle } from "services/vehicleService";

export default function EditVehicleModal({ open, onClose, vehicle, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // AlertDialog states
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successCallback, setSuccessCallback] = useState(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [vehicleData, setVehicleData] = useState({
    name: "",
    plate_number: "",
    make: "",
    model: "",
    year: "",
    driver_name: "",
  });

  // Load vehicle data when modal opens
  useEffect(() => {
    if (vehicle && open) {
      setVehicleData({
        name: vehicle.name || "",
        plate_number: vehicle.plate_number || "",
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year ? String(vehicle.year) : "",
        driver_name: vehicle.driver_name || "",
      });
    }
  }, [vehicle, open]);

  const handleUpdateVehicle = async () => {
    if (!vehicleData.name.trim()) {
      setWarningMessage("Vehicle name is required.");
      setShowWarning(true);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await updateVehicle(vehicle.id, {
        name: vehicleData.name,
        plate_number: vehicleData.plate_number || null,
        make: vehicleData.make || null,
        model: vehicleData.model || null,
        year: vehicleData.year ? parseInt(vehicleData.year) : null,
        driver_name: vehicleData.driver_name || null,
      });

      if (error) throw error;

      setSuccessMessage("The vehicle has been successfully updated.");
      setSuccessCallback(() => () => {
        onSuccess && onSuccess();
        onClose();
      });
      setShowSuccess(true);
    } catch (err) {
      console.error("Error updating vehicle:", err);
      setErrorMessage(err.message);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      const { error } = await deleteVehicle(vehicle.id);

      if (error) throw error;

      setSuccessMessage("The vehicle has been permanently deleted.");
      setSuccessCallback(() => () => {
        onSuccess && onSuccess();
        onClose();
      });
      setShowSuccess(true);
    } catch (err) {
      console.error("Error deleting vehicle:", err);
      setErrorMessage(err.message);
      setShowError(true);
    } finally {
      setDeleting(false);
    }
  };

  const inputClasses =
    "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <DialogTitle className="text-xl font-semibold text-foreground">Edit Vehicle</DialogTitle>
            <button
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="py-2">
            <GridContainer>
              <GridItem xs={12} sm={6}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Vehicle Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Truck 01"
                    className={inputClasses}
                    value={vehicleData.name}
                    onChange={(e) => setVehicleData({ ...vehicleData, name: e.target.value })}
                  />
                </div>
              </GridItem>
              <GridItem xs={12} sm={6}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Plate Number</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={vehicleData.plate_number}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, plate_number: e.target.value })
                    }
                  />
                </div>
              </GridItem>
              <GridItem xs={12} sm={4}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Make</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={vehicleData.make}
                    onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                  />
                </div>
              </GridItem>
              <GridItem xs={12} sm={4}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Model</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={vehicleData.model}
                    onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                  />
                </div>
              </GridItem>
              <GridItem xs={12} sm={4}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                  <input
                    type="number"
                    className={inputClasses}
                    value={vehicleData.year}
                    onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                  />
                </div>
              </GridItem>
              <GridItem xs={12}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Driver Name</label>
                  <input
                    type="text"
                    className={inputClasses}
                    value={vehicleData.driver_name}
                    onChange={(e) =>
                      setVehicleData({ ...vehicleData, driver_name: e.target.value })
                    }
                  />
                </div>
              </GridItem>
            </GridContainer>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                className="mr-auto inline-flex items-center rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                onClick={handleDeleteVehicle}
                disabled={deleting || submitting}
              >
                {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete"}
              </button>
              <button
                className="inline-flex items-center rounded-lg bg-muted px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                onClick={handleUpdateVehicle}
                disabled={submitting || deleting}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warning AlertDialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Missing Field</AlertDialogTitle>
            <AlertDialogDescription>{warningMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWarning(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success AlertDialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {successMessage.includes("deleted") ? "Vehicle Deleted" : "Vehicle Updated!"}
            </AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccess(false);
                successCallback && successCallback();
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error AlertDialog */}
      <AlertDialog open={showError} onOpenChange={setShowError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowError(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All data associated with this vehicle will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Yes, delete it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
