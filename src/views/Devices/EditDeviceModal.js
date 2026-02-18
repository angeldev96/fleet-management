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
import { updateDevice, deleteDevice } from "services/deviceService";
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

export default function EditDeviceModal({ open, onClose, device, onSuccess }) {
  const classes = useStyles();
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      setAlert(
        <SweetAlert
          warning
          title="Missing Field"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Got it"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          IMEI is required.
        </SweetAlert>
      );
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await updateDevice(device.id, {
        imei: deviceData.imei,
        serial_number: deviceData.serial_number || null,
      });

      if (error) throw error;

      setAlert(
        <SweetAlert
          success
          title="Device Updated!"
          onConfirm={() => {
            setAlert(null);
            onSuccess && onSuccess();
            onClose();
          }}
          confirmBtnText="Continue"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          The device has been successfully updated.
        </SweetAlert>
      );
    } catch (err) {
      console.error("Error updating device:", err);
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

  const handleDeleteDevice = () => {
    setAlert(
      <SweetAlert
        warning
        showCancel
        title="Delete Device?"
        onConfirm={confirmDelete}
        onCancel={() => setAlert(null)}
        confirmBtnText="Yes, delete it"
        cancelBtnText="Cancel"
        focusCancelBtn={false}
        focusConfirmBtn={false}
      >
        This action cannot be undone. The device will be permanently removed.
      </SweetAlert>
    );
  };

  const confirmDelete = async () => {
    setAlert(null);
    setDeleting(true);
    try {
      const { error } = await deleteDevice(device.id);

      if (error) throw error;

      setAlert(
        <SweetAlert
          success
          title="Device Deleted"
          onConfirm={() => {
            setAlert(null);
            onSuccess && onSuccess();
            onClose();
          }}
          confirmBtnText="Continue"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          The device has been permanently deleted.
        </SweetAlert>
      );
    } catch (err) {
      console.error("Error deleting device:", err);
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
          <h3 className={classes.titleText}>Edit Device</h3>
          <Close className={classes.closeButton} onClick={onClose} />
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <GridContainer>
            <GridItem xs={12}>
              <TextField
                margin="dense"
                label="IMEI *"
                placeholder="e.g. 860000000000001"
                fullWidth
                variant="outlined"
                value={deviceData.imei}
                onChange={(e) => setDeviceData({ ...deviceData, imei: e.target.value })}
              />
            </GridItem>
            <GridItem xs={12}>
              <TextField
                margin="dense"
                label="Serial Number"
                fullWidth
                variant="outlined"
                value={deviceData.serial_number}
                onChange={(e) =>
                  setDeviceData({ ...deviceData, serial_number: e.target.value })
                }
              />
            </GridItem>
          </GridContainer>

          <div className={classes.buttonRow}>
            <Button
              className={classes.deleteButton}
              onClick={handleDeleteDevice}
              disabled={deleting || submitting}
            >
              {deleting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
            </Button>
            <Button className={classes.cancelButton} onClick={onClose}>
              Cancel
            </Button>
            <Button
              className={classes.submitButton}
              onClick={handleUpdateDevice}
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
