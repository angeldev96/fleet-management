import React, { useState, useEffect } from "react";

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

// @material-ui/icons
import Close from "@material-ui/icons/Close";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";

// hooks & utils
import { updateServiceEvent, createServiceEvent } from "hooks/useServiceEvents";
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
  vehicleInfo: {
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "16px",
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
}));

export default function EditEventModal({ open, onClose, onSuccess, event }) {
  const classes = useStyles();
  const { user } = useAuth();
  const [alert, setAlert] = useState(null);
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

      setAlert(
        <SweetAlert
          success
          title="Event Updated!"
          onConfirm={() => {
            setAlert(null);
            onSuccess && onSuccess();
            onClose();
          }}
          confirmBtnText="Continue"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          {followUpCreated
            ? "The service event has been updated successfully. A follow-up event has been created for " +
              formData.next_service_date +
              "."
            : "The service event has been updated successfully."}
        </SweetAlert>
      );
    } catch (err) {
      console.error("Error updating service event:", err);
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

  if (!event) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        classes={{ paper: classes.dialogPaper }}
        maxWidth="md"
      >
        <DialogTitle disableTypography className={classes.dialogTitle}>
          <h3 className={classes.titleText}>Edit Service Event</h3>
          <Close className={classes.closeButton} onClick={onClose} />
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <div className={classes.vehicleInfo}>
            <div className={classes.vehicleInfoItem}>
              <strong>Vehicle:</strong> {event.vehicle_name}
              {event.plate_number ? ` (${event.plate_number})` : ""}
            </div>
            {event.driver_name && (
              <div className={classes.vehicleInfoItem}>
                <strong>Driver:</strong> {event.driver_name}
              </div>
            )}
            {(event.make || event.model) && (
              <div className={classes.vehicleInfoItem}>
                <strong>Details:</strong> {event.make} {event.model}
                {event.year && ` (${event.year})`}
              </div>
            )}
          </div>

          <GridContainer>
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
            <Button className={classes.cancelButton} onClick={onClose}>
              Cancel
            </Button>
            <Button className={classes.submitButton} onClick={handleSubmit} disabled={submitting}>
              {submitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {alert}
    </>
  );
}
