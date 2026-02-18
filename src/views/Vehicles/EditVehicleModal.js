import React, { useState, useEffect } from "react";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";

// @material-ui/icons
import Close from "@material-ui/icons/Close";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Button from "components/CustomButtons/Button.js";

// hooks & utils
import { updateVehicle, deleteVehicle } from "services/vehicleService";
import SweetAlert from "react-bootstrap-sweetalert";

const useStyles = makeStyles(() => ({
  dialogPaper: {
    minWidth: "500px",
    maxWidth: "600px",
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
  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #E0E4E8",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    "&:hover": {
      backgroundColor: "#E5E7EB",
    },
  },
  submitButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    "&:hover": {
      backgroundColor: "#2E3B55",
    },
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    marginRight: "auto",
    "&:hover": {
      backgroundColor: "#B91C1C",
    },
  },
}));

export default function EditVehicleModal({ open, onClose, vehicle, onSuccess }) {
  const classes = useStyles();
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setAlert(
        <SweetAlert
          warning
          title="Missing Field"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Got it"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          Vehicle name is required.
        </SweetAlert>
      );
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

      setAlert(
        <SweetAlert
          success
          title="Vehicle Updated!"
          onConfirm={() => {
            setAlert(null);
            onSuccess && onSuccess();
            onClose();
          }}
          confirmBtnText="Continue"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          The vehicle has been successfully updated.
        </SweetAlert>
      );
    } catch (err) {
      console.error("Error updating vehicle:", err);
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

  const handleDeleteVehicle = () => {
    setAlert(
      <SweetAlert
        warning
        showCancel
        title="Delete Vehicle?"
        onConfirm={confirmDelete}
        onCancel={() => setAlert(null)}
        confirmBtnText="Yes, delete it"
        cancelBtnText="Cancel"
        focusCancelBtn={false}
        focusConfirmBtn={false}
      >
        This action cannot be undone. All data associated with this vehicle will be permanently deleted.
      </SweetAlert>
    );
  };

  const confirmDelete = async () => {
    setAlert(null);
    setDeleting(true);
    try {
      const { error } = await deleteVehicle(vehicle.id);

      if (error) throw error;

      setAlert(
        <SweetAlert
          success
          title="Vehicle Deleted"
          onConfirm={() => {
            setAlert(null);
            onSuccess && onSuccess();
            onClose();
          }}
          confirmBtnText="Continue"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          The vehicle has been permanently deleted.
        </SweetAlert>
      );
    } catch (err) {
      console.error("Error deleting vehicle:", err);
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
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        classes={{ paper: classes.dialogPaper }}
        maxWidth="md"
      >
        <DialogTitle disableTypography className={classes.dialogTitle}>
          <h3 className={classes.titleText}>Edit Vehicle</h3>
          <Close className={classes.closeButton} onClick={onClose} />
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <GridContainer>
            <GridItem xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Vehicle Name *"
                placeholder="e.g. Truck 01"
                fullWidth
                variant="outlined"
                value={vehicleData.name}
                onChange={(e) => setVehicleData({ ...vehicleData, name: e.target.value })}
              />
            </GridItem>
            <GridItem xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Plate Number"
                fullWidth
                variant="outlined"
                value={vehicleData.plate_number}
                onChange={(e) =>
                  setVehicleData({ ...vehicleData, plate_number: e.target.value })
                }
              />
            </GridItem>
            <GridItem xs={12} sm={4}>
              <TextField
                margin="dense"
                label="Make"
                fullWidth
                variant="outlined"
                value={vehicleData.make}
                onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
              />
            </GridItem>
            <GridItem xs={12} sm={4}>
              <TextField
                margin="dense"
                label="Model"
                fullWidth
                variant="outlined"
                value={vehicleData.model}
                onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
              />
            </GridItem>
            <GridItem xs={12} sm={4}>
              <TextField
                margin="dense"
                label="Year"
                type="number"
                fullWidth
                variant="outlined"
                value={vehicleData.year}
                onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
              />
            </GridItem>
            <GridItem xs={12}>
              <TextField
                margin="dense"
                label="Driver Name"
                fullWidth
                variant="outlined"
                value={vehicleData.driver_name}
                onChange={(e) =>
                  setVehicleData({ ...vehicleData, driver_name: e.target.value })
                }
              />
            </GridItem>
          </GridContainer>

          <div className={classes.buttonRow}>
            <Button
              className={classes.deleteButton}
              onClick={handleDeleteVehicle}
              disabled={deleting || submitting}
            >
              {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
            </Button>
            <Button className={classes.cancelButton} onClick={onClose}>
              Cancel
            </Button>
            <Button
              className={classes.submitButton}
              onClick={handleUpdateVehicle}
              disabled={submitting || deleting}
            >
              {submitting ? <CircularProgress size={20} color="inherit" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {alert}
    </>
  );
}
