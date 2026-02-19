import React, { useState, useEffect } from "react";

// lucide icons
import { Loader2 } from "lucide-react";

// shadcn components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";

// hooks & utils
import { updateDevice, deleteDevice } from "services/deviceService";

export default function EditDeviceModal({ open, onClose, device, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Alert dialog states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");
  const [successCallback, setSuccessCallback] = useState(null);

  const [deviceData, setDeviceData] = useState({
    imei: "",
    serial_number: "",
  });

  // Load device data when modal opens
  useEffect(() => {
    if (device && open) {
      setDeviceData({
        imei: device.imei || "",
        serial_number: device.serialNumber || "",
      });
    }
  }, [device, open]);

  const handleUpdateDevice = async () => {
    if (!deviceData.imei.trim()) {
      setAlertTitle("Missing Field");
      setAlertMessage("IMEI is required.");
      setShowWarning(true);
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await updateDevice(device.id, {
        imei: deviceData.imei,
        serial_number: deviceData.serial_number || null,
      });

      if (error) throw error;

      setAlertTitle("Device Updated!");
      setAlertMessage("The device has been successfully updated.");
      setSuccessCallback(() => () => {
        onSuccess && onSuccess();
        onClose();
      });
      setShowSuccess(true);
    } catch (err) {
      console.error("Error updating device:", err);
      setAlertTitle("Error");
      setAlertMessage(err.message);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDevice = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      const { error } = await deleteDevice(device.id);

      if (error) throw error;

      setAlertTitle("Device Deleted");
      setAlertMessage("The device has been permanently deleted.");
      setSuccessCallback(() => () => {
        onSuccess && onSuccess();
        onClose();
      });
      setShowSuccess(true);
    } catch (err) {
      console.error("Error deleting device:", err);
      setAlertTitle("Error");
      setAlertMessage(err.message);
      setShowError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="sm:max-w-[600px]" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-foreground">
              Edit Device
            </DialogTitle>
            <DialogDescription className="sr-only">
              Edit device IMEI and serial number
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <GridContainer>
              <GridItem xs={12}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    IMEI *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 860000000000001"
                    value={deviceData.imei}
                    onChange={(e) => setDeviceData({ ...deviceData, imei: e.target.value })}
                    className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </GridItem>
              <GridItem xs={12}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter serial number"
                    value={deviceData.serial_number}
                    onChange={(e) =>
                      setDeviceData({ ...deviceData, serial_number: e.target.value })
                    }
                    className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </GridItem>
            </GridContainer>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                className="mr-auto bg-red-600 text-white py-2.5 px-6 rounded-md text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleDeleteDevice}
                disabled={deleting || submitting}
              >
                {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Delete"}
              </button>
              <button
                className="bg-muted text-foreground py-2.5 px-6 rounded-md text-sm font-semibold hover:bg-muted/80 transition-colors"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="bg-primary text-white py-2.5 px-6 rounded-md text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpdateDevice}
                disabled={submitting || deleting}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The device will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
            >
              Yes, delete it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWarning(false)}>
              Got it
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccess(false);
                if (successCallback) successCallback();
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showError} onOpenChange={setShowError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertTitle}</AlertDialogTitle>
            <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowError(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
