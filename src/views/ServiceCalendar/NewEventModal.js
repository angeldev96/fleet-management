import React, { useState, useEffect, useMemo, useRef } from "react";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import MenuItem from "@material-ui/core/MenuItem";
import InputAdornment from "@material-ui/core/InputAdornment";
import Paper from "@material-ui/core/Paper";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Search from "@material-ui/icons/Search";

// @material-ui/icons
import Close from "@material-ui/icons/Close";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";

// hooks & utils
import { useVehicles } from "hooks/useVehicles";
import { createServiceEvent } from "hooks/useServiceEvents";
import { useAuth } from "context/AuthContext";
import SweetAlert from "react-bootstrap-sweetalert";

const useStyles = makeStyles(() => ({
  dialogPaper: {
    minWidth: "600px",
    maxWidth: "800px",
  },
  dialogTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #E0E4E8",
    padding: "16px 24px",
  },
  titleText: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  closeButton: {
    cursor: "pointer",
    color: "#9CA3AF",
    "&:hover": {
      color: "#3E4D6C",
    },
  },
  dialogContent: {
    padding: "24px",
  },
  sectionTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "12px",
    marginTop: "16px",
  },
  vehicleInfo: {
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    padding: "12px",
    marginTop: "8px",
    fontSize: "13px",
    color: "#6B7280",
  },
  vehicleInfoItem: {
    marginBottom: "4px",
    "&:last-child": {
      marginBottom: 0,
    },
  },
  submitButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    marginTop: "24px",
    "&:hover": {
      backgroundColor: "#2E3B55",
    },
  },
  cancelButton: {
    backgroundColor: "#FFFFFF",
    color: "#3E4D6C",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    marginTop: "24px",
    marginRight: "12px",
    border: "1px solid #E0E4E8",
    "&:hover": {
      backgroundColor: "#F9FAFB",
    },
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "16px",
  },
  formControl: {
    marginTop: "12px",
  },
  radioGroup: {
    flexDirection: "row",
    gap: "24px",
  },
  vehicleSearchWrapper: {
    position: "relative",
  },
  vehicleDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 10,
    maxHeight: "200px",
    overflowY: "auto",
    border: "1px solid #E0E4E8",
    borderTop: "none",
    borderRadius: "0 0 4px 4px",
    backgroundColor: "#FFFFFF",
  },
  vehicleOption: {
    padding: "10px 14px",
    fontSize: "14px",
    color: "#374151",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#F3F4F6",
    },
  },
  vehicleOptionEmpty: {
    padding: "10px 14px",
    fontSize: "14px",
    color: "#9CA3AF",
    fontStyle: "italic",
  },
}));

export default function NewEventModal({ open, onClose, onSuccess }) {
  const classes = useStyles();
  const { user } = useAuth();
  const { vehicles, loading: vehiclesLoading } = useVehicles({ fetchAll: true });
  const [alert, setAlert] = useState(null);
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
      setAlert(
        <SweetAlert
          warning
          title="Missing Field"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Got it"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          Please select a vehicle.
        </SweetAlert>
      );
      return;
    }

    if (!formData.service_date) {
      setAlert(
        <SweetAlert
          warning
          title="Missing Field"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Got it"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          Please select a service date.
        </SweetAlert>
      );
      return;
    }

    if (formData.status === "completed") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const serviceDate = new Date(formData.service_date + "T00:00:00");
      if (serviceDate > today) {
        setAlert(
          <SweetAlert
            warning
            title="Invalid Date"
            onConfirm={() => setAlert(null)}
            confirmBtnText="Got it"
            focusCancelBtn={false}
            focusConfirmBtn={false}
          >
            A service event cannot be marked as completed with a future date. Please use today or a past date.
          </SweetAlert>
        );
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

      setAlert(
        <SweetAlert
          success
          title="Service Event Created!"
          onConfirm={() => {
            setAlert(null);
            resetForm();
            onSuccess && onSuccess();
            onClose();
          }}
          confirmBtnText="Continue"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          {followUpCreated
            ? "The service event has been scheduled successfully. A follow-up event has been created for " +
              formData.next_service_date +
              "."
            : "The service event has been scheduled successfully."}
        </SweetAlert>
      );
    } catch (err) {
      console.error("Error creating service event:", err);
      setAlert(
        <SweetAlert
          error
          title="Error"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Close"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          {err.message}
        </SweetAlert>
      );
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
      <Dialog
        open={open}
        onClose={handleClose}
        classes={{ paper: classes.dialogPaper }}
        maxWidth="md"
      >
        <DialogTitle disableTypography className={classes.dialogTitle}>
          <h3 className={classes.titleText}>New Service Event</h3>
          <Close className={classes.closeButton} onClick={handleClose} />
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <GridContainer>
            <GridItem xs={12}>
              <ClickAwayListener onClickAway={() => setDropdownOpen(false)}>
                <div className={classes.vehicleSearchWrapper}>
                  <TextField
                    inputRef={searchInputRef}
                    margin="dense"
                    label="Vehicle *"
                    placeholder="Search by name, plate, make, model..."
                    fullWidth
                    variant="outlined"
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search style={{ color: "#9CA3AF", fontSize: "20px" }} />
                        </InputAdornment>
                      ),
                      endAdornment: vehiclesLoading ? (
                        <InputAdornment position="end">
                          <CircularProgress size={18} />
                        </InputAdornment>
                      ) : formData.vehicle_id ? (
                        <InputAdornment position="end">
                          <Close
                            style={{ color: "#9CA3AF", fontSize: "18px", cursor: "pointer" }}
                            onClick={handleClearVehicle}
                          />
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                  {dropdownOpen && !formData.vehicle_id && (
                    <Paper className={classes.vehicleDropdown} elevation={3}>
                      {filteredVehicles.length === 0 ? (
                        <div className={classes.vehicleOptionEmpty}>No vehicles match your search</div>
                      ) : (
                        filteredVehicles.map((vehicle) => (
                          <div
                            key={vehicle.id}
                            className={classes.vehicleOption}
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
                    </Paper>
                  )}
                </div>
              </ClickAwayListener>
              {selectedVehicle && (
                <div className={classes.vehicleInfo}>
                  {selectedVehicle.driver_name && (
                    <div className={classes.vehicleInfoItem}>
                      <strong>Driver:</strong> {selectedVehicle.driver_name}
                    </div>
                  )}
                  {(selectedVehicle.make || selectedVehicle.model) && (
                    <div className={classes.vehicleInfoItem}>
                      <strong>Vehicle:</strong> {selectedVehicle.make} {selectedVehicle.model}{" "}
                      {selectedVehicle.year && `(${selectedVehicle.year})`}
                    </div>
                  )}
                </div>
              )}
            </GridItem>

            <GridItem xs={12}>
              <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel component="legend" style={{ fontSize: "12px", color: "#6B7280" }}>
                  Service Type *
                </FormLabel>
                <RadioGroup
                  className={classes.radioGroup}
                  value={formData.service_type}
                  onChange={handleChange("service_type")}
                >
                  <FormControlLabel
                    value="scheduled_maintenance"
                    control={<Radio color="primary" />}
                    label="Scheduled Maintenance"
                  />
                  <FormControlLabel
                    value="repair"
                    control={<Radio color="primary" />}
                    label="Repair/Incident"
                  />
                </RadioGroup>
              </FormControl>
            </GridItem>

            <GridItem xs={12}>
              <TextField
                margin="dense"
                label="Service Items"
                placeholder="e.g. Oil Change, Brake Inspection"
                fullWidth
                variant="outlined"
                value={formData.service_items}
                onChange={handleChange("service_items")}
              />
            </GridItem>

            <GridItem xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Mileage (km)"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.mileage}
                onChange={handleChange("mileage")}
              />
            </GridItem>

            <GridItem xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Cost"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.cost}
                onChange={handleChange("cost")}
                InputProps={{
                  startAdornment: <span style={{ marginRight: "4px", color: "#6B7280" }}>J$</span>,
                }}
              />
            </GridItem>

            <GridItem xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Service Date *"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.service_date}
                onChange={handleChange("service_date")}
                InputLabelProps={{ shrink: true }}
              />
            </GridItem>

            <GridItem xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Next Service Date"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.next_service_date}
                onChange={handleChange("next_service_date")}
                InputLabelProps={{ shrink: true }}
              />
            </GridItem>

            <GridItem xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Location"
                placeholder="e.g. Kingston Depot"
                fullWidth
                variant="outlined"
                value={formData.location}
                onChange={handleChange("location")}
              />
            </GridItem>

            <GridItem xs={12} sm={6}>
              <TextField
                select
                margin="dense"
                label="Status"
                fullWidth
                variant="outlined"
                value={formData.status}
                onChange={handleChange("status")}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </GridItem>

            <GridItem xs={12}>
              <TextField
                margin="dense"
                label="Notes"
                placeholder="Additional notes..."
                fullWidth
                multiline
                rows={3}
                variant="outlined"
                value={formData.notes}
                onChange={handleChange("notes")}
              />
            </GridItem>
          </GridContainer>

          <div className={classes.buttonContainer}>
            <Button className={classes.cancelButton} onClick={handleClose}>
              Cancel
            </Button>
            <Button className={classes.submitButton} onClick={handleSubmit} disabled={submitting}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : "Sync to Calendar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {alert}
    </>
  );
}
