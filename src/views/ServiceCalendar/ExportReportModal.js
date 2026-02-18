import React, { useState, useMemo } from "react";

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

// @material-ui/icons
import Close from "@material-ui/icons/Close";
import Assessment from "@material-ui/icons/Assessment";
import Search from "@material-ui/icons/Search";

// core components
import Button from "components/CustomButtons/Button.js";

// hooks & utils
import { useVehicles } from "hooks/useVehicles";
import { useVehicleServiceHistory } from "hooks/useServiceEvents";
import { SERVICE_STATUS_COLORS } from "types/database";
import { exportToCSV, exportToPDF } from "./exportService";

const useStyles = makeStyles(() => ({
  dialogPaper: {
    minWidth: "520px",
    maxWidth: "600px",
  },
  dialogTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #E0E4E8",
    padding: "16px 24px",
  },
  titleLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  titleIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: "#EEF2FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: "8px",
    marginTop: "20px",
    "&:first-child": {
      marginTop: 0,
    },
  },
  formControl: {
    marginTop: "4px",
    width: "100%",
  },
  radioGroup: {
    flexDirection: "row",
    gap: "24px",
  },
  previewBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    padding: "16px",
    marginTop: "20px",
  },
  previewLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },
  previewCount: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "10px",
  },
  previewBreakdown: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },
  previewChip: {
    fontSize: "11px",
    fontWeight: "600",
    borderRadius: "999px",
    padding: "4px 10px",
    display: "inline-flex",
    alignItems: "center",
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "24px",
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
  cancelButton: {
    backgroundColor: "#FFFFFF",
    color: "#3E4D6C",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    marginRight: "12px",
    border: "1px solid #E0E4E8",
    "&:hover": {
      backgroundColor: "#F9FAFB",
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "16px",
  },
  emptyState: {
    textAlign: "center",
    padding: "16px",
    color: "#6B7280",
    fontSize: "13px",
  },
}));

export default function ExportReportModal({ open, onClose, fleetEvents, fleetEventsLoading }) {
  const classes = useStyles();
  const [scope, setScope] = useState("fleet");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [format, setFormat] = useState("pdf");
  const [vehicleSearch, setVehicleSearch] = useState("");

  const { vehicles, loading: vehiclesLoading } = useVehicles({ fetchAll: true });

  const { events: vehicleEvents, loading: vehicleEventsLoading } = useVehicleServiceHistory(
    scope === "vehicle" ? selectedVehicleId : null
  );

  const filteredVehicles = useMemo(() => {
    if (!vehicleSearch.trim()) return vehicles;
    const q = vehicleSearch.toLowerCase();
    return vehicles.filter((v) => {
      const name = (v.name || "").toLowerCase();
      const plate = (v.plate_number || "").toLowerCase();
      const make = (v.make || "").toLowerCase();
      const model = (v.model || "").toLowerCase();
      return name.includes(q) || plate.includes(q) || make.includes(q) || model.includes(q);
    });
  }, [vehicles, vehicleSearch]);

  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId || !vehicles.length) return null;
    return vehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [selectedVehicleId, vehicles]);

  const exportEvents = scope === "fleet" ? fleetEvents : vehicleEvents;
  const dataLoading = scope === "fleet" ? fleetEventsLoading : vehicleEventsLoading;

  const statusBreakdown = useMemo(() => {
    if (!exportEvents || exportEvents.length === 0) return null;
    return {
      total: exportEvents.length,
      completed: exportEvents.filter((e) => (e.computed_status || e.status) === "completed").length,
      pending: exportEvents.filter((e) => (e.computed_status || e.status) === "pending").length,
      in_progress: exportEvents.filter((e) => (e.computed_status || e.status) === "in_progress").length,
      overdue: exportEvents.filter((e) => (e.computed_status || e.status) === "overdue").length,
    };
  }, [exportEvents]);

  const handleExport = () => {
    if (!exportEvents || exportEvents.length === 0) return;
    const vehicleName = scope === "vehicle" ? selectedVehicle?.name || null : null;
    if (format === "csv") {
      exportToCSV(exportEvents, vehicleName);
    } else {
      exportToPDF(exportEvents, vehicleName);
    }
    handleClose();
  };

  const handleClose = () => {
    setScope("fleet");
    setSelectedVehicleId("");
    setFormat("pdf");
    setVehicleSearch("");
    onClose();
  };

  const canExport = !dataLoading && exportEvents && exportEvents.length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      classes={{ paper: classes.dialogPaper }}
      maxWidth="sm"
    >
      <DialogTitle disableTypography className={classes.dialogTitle}>
        <div className={classes.titleLeft}>
          <div className={classes.titleIcon}>
            <Assessment style={{ color: "#4338CA" }} />
          </div>
          <h3 className={classes.titleText}>Export Service Report</h3>
        </div>
        <Close className={classes.closeButton} onClick={handleClose} />
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <div className={classes.sectionTitle}>Report Scope</div>
        <FormControl component="fieldset" className={classes.formControl}>
          <RadioGroup
            className={classes.radioGroup}
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setSelectedVehicleId("");
              setVehicleSearch("");
            }}
          >
            <FormControlLabel
              value="fleet"
              control={<Radio color="primary" />}
              label="Entire Fleet"
            />
            <FormControlLabel
              value="vehicle"
              control={<Radio color="primary" />}
              label="Specific Vehicle"
            />
          </RadioGroup>
        </FormControl>

        {scope === "vehicle" && (
          <>
            <TextField
              margin="dense"
              label="Search by name, plate, make, model..."
              fullWidth
              variant="outlined"
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              disabled={vehiclesLoading}
              style={{ marginTop: "12px" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search style={{ color: "#9CA3AF", fontSize: "20px" }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              margin="dense"
              label="Select Vehicle"
              fullWidth
              variant="outlined"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              disabled={vehiclesLoading}
            >
              {vehiclesLoading ? (
                <MenuItem disabled>Loading vehicles...</MenuItem>
              ) : filteredVehicles.length === 0 ? (
                <MenuItem disabled>No vehicles match your search</MenuItem>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} {vehicle.plate_number ? `(${vehicle.plate_number})` : ""}
                    {vehicle.make ? ` — ${vehicle.make} ${vehicle.model || ""}` : ""}
                  </MenuItem>
                ))
              )}
            </TextField>
          </>
        )}

        <div className={classes.sectionTitle} style={{ marginTop: "24px" }}>Export Format</div>
        <FormControl component="fieldset" className={classes.formControl}>
          <RadioGroup
            className={classes.radioGroup}
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <FormControlLabel
              value="pdf"
              control={<Radio color="primary" />}
              label="PDF Document"
            />
            <FormControlLabel
              value="csv"
              control={<Radio color="primary" />}
              label="CSV Spreadsheet"
            />
          </RadioGroup>
        </FormControl>

        <div className={classes.previewBox}>
          <div className={classes.previewLabel}>Export Preview</div>
          {dataLoading ? (
            <div className={classes.loadingContainer}>
              <CircularProgress size={20} />
            </div>
          ) : !exportEvents || exportEvents.length === 0 ? (
            <div className={classes.emptyState}>
              {scope === "vehicle" && !selectedVehicleId
                ? "Select a vehicle to preview"
                : "No service events found"}
            </div>
          ) : (
            <>
              <div className={classes.previewCount}>
                {statusBreakdown.total} service event{statusBreakdown.total !== 1 ? "s" : ""}
              </div>
              <div className={classes.previewBreakdown}>
                {statusBreakdown.completed > 0 && (
                  <span
                    className={classes.previewChip}
                    style={{
                      backgroundColor: SERVICE_STATUS_COLORS.completed.bg,
                      color: SERVICE_STATUS_COLORS.completed.text,
                    }}
                  >
                    {statusBreakdown.completed} Completed
                  </span>
                )}
                {statusBreakdown.pending > 0 && (
                  <span
                    className={classes.previewChip}
                    style={{
                      backgroundColor: SERVICE_STATUS_COLORS.pending.bg,
                      color: SERVICE_STATUS_COLORS.pending.text,
                    }}
                  >
                    {statusBreakdown.pending} Pending
                  </span>
                )}
                {statusBreakdown.in_progress > 0 && (
                  <span
                    className={classes.previewChip}
                    style={{
                      backgroundColor: SERVICE_STATUS_COLORS.in_progress.bg,
                      color: SERVICE_STATUS_COLORS.in_progress.text,
                    }}
                  >
                    {statusBreakdown.in_progress} In Progress
                  </span>
                )}
                {statusBreakdown.overdue > 0 && (
                  <span
                    className={classes.previewChip}
                    style={{
                      backgroundColor: SERVICE_STATUS_COLORS.overdue.bg,
                      color: SERVICE_STATUS_COLORS.overdue.text,
                    }}
                  >
                    {statusBreakdown.overdue} Overdue
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className={classes.buttonContainer}>
          <Button className={classes.cancelButton} onClick={handleClose}>
            Cancel
          </Button>
          <Button className={classes.submitButton} onClick={handleExport} disabled={!canExport}>
            {format === "pdf" ? "Export as PDF" : "Export as CSV"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
