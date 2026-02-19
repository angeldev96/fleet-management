import React, { useState, useEffect, useMemo, useRef } from "react";

// lucide icons
import { X, Search, Loader2 } from "lucide-react";

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
import { useVehicles } from "hooks/useVehicles";
import { createServiceEvent } from "hooks/useServiceEvents";
import { useAuth } from "context/AuthContext";

const inputClasses =
  "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const selectClasses =
  "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none";

export default function NewEventModal({ open, onClose, onSuccess }) {
  const { user } = useAuth();
  const { vehicles, loading: vehiclesLoading } = useVehicles({ fetchAll: true });

  // AlertDialog states (replacing SweetAlert)
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    vehicle_id: "",
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

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);
  const wrapperRef = useRef(null);

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return vehicles;
    const q = vehicleSearch.toLowerCase();
    return vehicles.filter((v) => {
      const name = (v.name || "").toLowerCase();
      const plate = (v.plate_number || "").toLowerCase();
      const make = (v.make || "").toLowerCase();
      const model = (v.model || "").toLowerCase();
      const driver = (v.driver_name || "").toLowerCase();
      return name.includes(q) || plate.includes(q) || make.includes(q) || model.includes(q) || driver.includes(q);
    });
  }, [vehicles, vehicleSearch]);

  useEffect(() => {
    if (formData.vehicle_id && vehicles.length > 0) {
      const vehicle = vehicles.find((v) => v.id === formData.vehicle_id);
      setSelectedVehicle(vehicle || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [formData.vehicle_id, vehicles]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectVehicle = (vehicle) => {
    setFormData((prev) => ({ ...prev, vehicle_id: vehicle.id }));
    setVehicleSearch(
      `${vehicle.name}${vehicle.plate_number ? ` (${vehicle.plate_number})` : ""}${vehicle.make ? ` — ${vehicle.make} ${vehicle.model || ""}` : ""}`
    );
    setDropdownOpen(false);
  };

  const handleClearVehicle = () => {
    setFormData((prev) => ({ ...prev, vehicle_id: "" }));
    setSelectedVehicle(null);
    setVehicleSearch("");
    setDropdownOpen(false);
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const resetForm = () => {
    setFormData({
      vehicle_id: "",
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
    setSelectedVehicle(null);
    setVehicleSearch("");
    setDropdownOpen(false);
  };

  const handleSubmit = async () => {
    if (!formData.vehicle_id) {
      setWarningMessage("Please select a vehicle.");
      setShowWarning(true);
      return;
    }

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
      const eventData = {
        vehicle_id: formData.vehicle_id,
        service_type: formData.service_type,
        service_items: formData.service_items || null,
        mileage: formData.mileage ? parseFloat(formData.mileage) : null,
        service_date: formData.service_date,
        next_service_date: formData.next_service_date || null,
        location: formData.location || null,
        status: formData.status,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes || null,
        created_by: user?.id || null,
      };

      const { error } = await createServiceEvent(eventData);

      if (error) throw error;

      // If next_service_date is set, create a follow-up event for that date
      let followUpCreated = false;
      if (formData.next_service_date) {
        const followUpData = {
          vehicle_id: formData.vehicle_id,
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
          ? "The service event has been scheduled successfully. A follow-up event has been created for " +
              formData.next_service_date +
              "."
          : "The service event has been scheduled successfully."
      );
      setShowSuccess(true);
    } catch (err) {
      console.error("Error creating service event:", err);
      setErrorMessage(err.message);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
        <DialogContent className="sm:max-w-[800px]" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <DialogTitle className="text-xl font-semibold text-foreground">New Service Event</DialogTitle>
            <button
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="py-2">
            <GridContainer>
              <GridItem xs={12}>
                <div className="relative" ref={wrapperRef}>
                  <label className="block text-sm font-medium text-foreground mb-1">Vehicle *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search by name, plate, make, model..."
                      className={`${inputClasses} pl-9 pr-8`}
                      value={vehicleSearch}
                      onChange={(e) => {
                        const val = e.target.value;
                        setVehicleSearch(val);
                        setDropdownOpen(true);
                        if (formData.vehicle_id) {
                          handleClearVehicle();
                        }
                      }}
                      onFocus={() => {
                        if (!formData.vehicle_id) setDropdownOpen(true);
                      }}
                      disabled={vehiclesLoading}
                    />
                    {vehiclesLoading ? (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    ) : formData.vehicle_id ? (
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
                        onClick={handleClearVehicle}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  {dropdownOpen && !formData.vehicle_id && (
                    <div className="absolute top-full left-0 right-0 z-10 max-h-[200px] overflow-y-auto border border-border border-t-0 rounded-b bg-card shadow-md">
                      {filteredVehicles.length === 0 ? (
                        <div className="px-3.5 py-2.5 text-sm text-muted-foreground italic">
                          No vehicles match your search
                        </div>
                      ) : (
                        filteredVehicles.map((vehicle) => (
                          <div
                            key={vehicle.id}
                            className="px-3.5 py-2.5 text-sm text-foreground cursor-pointer hover:bg-muted"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectVehicle(vehicle);
                            }}
                          >
                            {vehicle.name} {vehicle.plate_number ? `(${vehicle.plate_number})` : ""}
                            {vehicle.make ? ` — ${vehicle.make} ${vehicle.model || ""}` : ""}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedVehicle && (
                  <div className="bg-muted/50 rounded-lg p-3 mt-2 text-sm text-muted-foreground">
                    {selectedVehicle.driver_name && (
                      <div className="mb-1 last:mb-0">
                        <strong>Driver:</strong> {selectedVehicle.driver_name}
                      </div>
                    )}
                    {(selectedVehicle.make || selectedVehicle.model) && (
                      <div className="mb-1 last:mb-0">
                        <strong>Vehicle:</strong> {selectedVehicle.make} {selectedVehicle.model}{" "}
                        {selectedVehicle.year && `(${selectedVehicle.year})`}
                      </div>
                    )}
                  </div>
                )}
              </GridItem>

              <GridItem xs={12}>
                <div className="mt-3">
                  <label className="block text-xs text-muted-foreground mb-2">Service Type *</label>
                  <RadioGroup
                    className="flex flex-row gap-6"
                    value={formData.service_type}
                    onValueChange={(value) => setFormData({ ...formData, service_type: value })}
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="scheduled_maintenance" id="type-scheduled" />
                      <Label htmlFor="type-scheduled" className="text-sm font-normal">Scheduled Maintenance</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="repair" id="type-repair" />
                      <Label htmlFor="type-repair" className="text-sm font-normal">Repair/Incident</Label>
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
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                className="bg-primary text-primary-foreground px-6 py-2.5 normal-case font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sync to Calendar"}
              </Button>
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
            <AlertDialogTitle>Service Event Created!</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccess(false);
                resetForm();
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
