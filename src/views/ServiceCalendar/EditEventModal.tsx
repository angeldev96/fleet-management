import React, { useState, useEffect } from "react";

// lucide icons
import { X, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";

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
} from "components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "components/ui/radio-group";
import { Label } from "components/ui/label";

// hooks & utils
import { updateServiceEvent, createServiceEvent } from "hooks/useServiceEvents";
import { useAuth } from "context/AuthContext";

const inputClasses =
  "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const selectClasses =
  "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none";

export default function EditEventModal({ open, onClose, onSuccess, event }) {
  const { user } = useAuth();

  // AlertDialog states (replacing SweetAlert)
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    service_type: "scheduled_maintenance",
    service_items: "",
    mileage: "",
    service_date: "",
    next_service_date: "",
    location: "",
    status: "pending",
    cost: "",
    notes: "",
  });

  useEffect(() => {
    if (event && open) {
      setFormData({
        service_type: event.service_type || "scheduled_maintenance",
        service_items: event.service_items || "",
        mileage: event.mileage ? String(event.mileage) : "",
        service_date: event.service_date || "",
        next_service_date: event.next_service_date || "",
        location: event.location || "",
        status: event.status || "pending",
        cost: event.cost ? String(event.cost) : "",
        notes: event.notes || "",
      });
    }
  }, [event, open]);

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.service_date) {
      setWarningMessage("Please select a service date.");
      setShowWarning(true);
      return;
    }

    if (formData.status === "completed") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const serviceDate = new Date(formData.service_date + "T00:00:00");
      if (serviceDate > today) {
        setWarningMessage(
          "A service event cannot be marked as completed with a future date. Please use today or a past date."
        );
        setShowWarning(true);
        return;
      }
    }

    setSubmitting(true);
    try {
      const updates = {
        service_type: formData.service_type,
        service_items: formData.service_items || null,
        mileage: formData.mileage ? parseFloat(formData.mileage) : null,
        service_date: formData.service_date,
        next_service_date: formData.next_service_date || null,
        location: formData.location || null,
        status: formData.status,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes || null,
      };

      const { error } = await updateServiceEvent(event.id, updates);

      if (error) throw error;

      // If next_service_date was set or changed, create a follow-up event
      let followUpCreated = false;
      const nextDateChanged =
        formData.next_service_date && formData.next_service_date !== (event.next_service_date || "");
      if (nextDateChanged) {
        const followUpData = {
          vehicle_id: event.vehicle_id,
          service_type: formData.service_type,
          service_items: formData.service_items || null,
          mileage: null,
          service_date: formData.next_service_date,
          next_service_date: null,
          location: formData.location || null,
          status: "pending",
          cost: null,
          notes: null,
          created_by: user?.id || null,
        };

        const { error: followUpError } = await createServiceEvent(followUpData);
        if (followUpError) {
          console.error("Error creating follow-up event:", followUpError);
        } else {
          followUpCreated = true;
        }
      }

      setSuccessMessage(
        followUpCreated
          ? "The service event has been updated successfully. A follow-up event has been created for " +
              formData.next_service_date +
              "."
          : "The service event has been updated successfully."
      );
      setShowSuccess(true);
    } catch (err) {
      console.error("Error updating service event:", err);
      setErrorMessage(err.message);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (!event) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="sm:max-w-[800px]" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <DialogTitle className="text-xl font-semibold text-foreground">Edit Service Event</DialogTitle>
            <button
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="py-2">
            <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
              <div className="mb-1 last:mb-0">
                <strong>Vehicle:</strong> {event.vehicle_name}
                {event.plate_number ? ` (${event.plate_number})` : ""}
              </div>
              {event.driver_name && (
                <div className="mb-1 last:mb-0">
                  <strong>Driver:</strong> {event.driver_name}
                </div>
              )}
              {(event.make || event.model) && (
                <div className="mb-1 last:mb-0">
                  <strong>Details:</strong> {event.make} {event.model}
                  {event.year && ` (${event.year})`}
                </div>
              )}
            </div>

            <GridContainer>
              <GridItem xs={12}>
                <div className="mt-3">
                  <label className="block text-xs text-muted-foreground mb-2">Service Type *</label>
                  <RadioGroup
                    className="flex flex-row gap-6"
                    value={formData.service_type}
                    onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="scheduled_maintenance" id="edit-type-scheduled" />
                      <Label htmlFor="edit-type-scheduled" className="text-sm font-normal">Scheduled Maintenance</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="repair" id="edit-type-repair" />
                      <Label htmlFor="edit-type-repair" className="text-sm font-normal">Repair/Incident</Label>
                    </div>
                  </RadioGroup>
                </div>
              </GridItem>

              <GridItem xs={12}>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Service Items</label>
                  <input
                    type="text"
                    placeholder="e.g. Oil Change, Brake Inspection"
                    className={inputClasses}
                    value={formData.service_items}
                    onChange={handleChange("service_items")}
                  />
                </div>
              </GridItem>

              <GridItem xs={12} sm={6}>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    className={inputClasses}
                    value={formData.mileage}
                    onChange={handleChange("mileage")}
                  />
                </div>
              </GridItem>

              <GridItem xs={12} sm={6}>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">J$</span>
                    <input
                      type="number"
                      className={`${inputClasses} pl-9`}
                      value={formData.cost}
                      onChange={handleChange("cost")}
                    />
                  </div>
                </div>
              </GridItem>

              <GridItem xs={12} sm={6}>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Service Date *</label>
                  <input
                    type="date"
                    className={inputClasses}
                    value={formData.service_date}
                    onChange={handleChange("service_date")}
                  />
                </div>
              </GridItem>

              <GridItem xs={12} sm={6}>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Next Service Date</label>
                  <input
                    type="date"
                    className={inputClasses}
                    value={formData.next_service_date}
                    onChange={handleChange("next_service_date")}
                  />
                </div>
              </GridItem>

              <GridItem xs={12} sm={6}>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Kingston Depot"
                    className={inputClasses}
                    value={formData.location}
                    onChange={handleChange("location")}
                  />
                </div>
              </GridItem>

              <GridItem xs={12} sm={6}>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                  <select
                    className={selectClasses}
                    value={formData.status}
                    onChange={handleChange("status")}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </GridItem>

              <GridItem xs={12}>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Additional notes..."
                    className="flex w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    value={formData.notes}
                    onChange={handleChange("notes")}
                  />
                </div>
              </GridItem>
            </GridContainer>

            <div className="flex justify-end mt-6">
              <Button
                className="bg-background text-primary px-6 py-2.5 normal-case font-semibold mr-3 border border-border rounded-lg hover:bg-muted/50"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground px-6 py-2.5 normal-case font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warning AlertDialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {warningMessage.includes("future date") ? "Invalid Date" : "Missing Field"}
            </AlertDialogTitle>
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
            <AlertDialogTitle>Event Updated!</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccess(false);
                onSuccess && onSuccess();
                onClose();
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
    </>
  );
}
