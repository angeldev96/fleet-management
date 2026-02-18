import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import CircularProgress from "@material-ui/core/CircularProgress";
import LinearProgress from "@material-ui/core/LinearProgress";
import IconButton from "@material-ui/core/IconButton";

// @material-ui/icons
import DirectionsCar from "@material-ui/icons/DirectionsCar";
import Router from "@material-ui/icons/Router";
import CloudUpload from "@material-ui/icons/CloudUpload";
import CheckCircle from "@material-ui/icons/CheckCircle";
import Error from "@material-ui/icons/Error";
import GetApp from "@material-ui/icons/GetApp";
import ArrowBack from "@material-ui/icons/ArrowBack";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import Button from "components/CustomButtons/Button.js";

// hooks & utils
import { useVehicles } from "hooks/useVehicles";
import { addVehicle, batchAddVehicles } from "services/vehicleService";
import { addDevice, batchAddDevices } from "services/deviceService";
import { useAuth } from "context/AuthContext";
import SweetAlert from "react-bootstrap-sweetalert";

const useStyles = makeStyles(() => ({
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
  },
  backButton: {
    marginRight: "16px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #E0E4E8",
    "&:hover": {
      backgroundColor: "#F8F9FB",
    },
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "4px",
  },
  cardIconTitle: {
    color: "#3C4858",
    marginTop: "15px",
    minHeight: "auto",
    fontWeight: "300",
    marginBottom: "0px",
    textDecoration: "none",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#3C4858",
    marginBottom: "20px",
    marginTop: "0",
  },
  formSection: {
    marginBottom: "30px",
  },
  submitButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    marginTop: "16px",
    "&:hover": {
      backgroundColor: "#2E3B55",
    },
  },
  uploadSection: {
    border: "2px dashed #E0E4E8",
    borderRadius: "12px",
    padding: "40px 20px",
    textAlign: "center",
    backgroundColor: "#FAFBFC",
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      borderColor: "#3E4D6C",
      backgroundColor: "#F5F7FA",
    },
  },
  uploadSectionActive: {
    borderColor: "#3E4D6C",
    backgroundColor: "#F0F4FF",
  },
  uploadIcon: {
    fontSize: "48px",
    color: "#9CA3AF",
    marginBottom: "16px",
  },
  uploadText: {
    color: "#6B7280",
    fontSize: "14px",
    marginBottom: "8px",
  },
  uploadSubtext: {
    color: "#9CA3AF",
    fontSize: "12px",
  },
  hiddenInput: {
    display: "none",
  },
  resultBox: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  successBox: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
  },
  resultIcon: {
    fontSize: "24px",
    flexShrink: 0,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontWeight: "600",
    marginBottom: "4px",
  },
  resultDetails: {
    fontSize: "13px",
    opacity: 0.9,
  },
  progressContainer: {
    marginTop: "20px",
  },
  progressText: {
    fontSize: "13px",
    color: "#6B7280",
    marginBottom: "8px",
    textAlign: "center",
  },
  templateLink: {
    display: "inline-flex",
    alignItems: "center",
    color: "#3B82F6",
    fontSize: "13px",
    marginTop: "16px",
    cursor: "pointer",
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  templateIcon: {
    fontSize: "16px",
    marginRight: "6px",
  },
  divider: {
    height: "1px",
    backgroundColor: "#E5E7EB",
    margin: "30px 0",
  },
}));

// CSV template headers
const VEHICLE_CSV_HEADERS = ["name", "plate_number", "make", "model", "year", "driver_name"];
const DEVICE_CSV_HEADERS = ["plate_number", "imei", "serial_number"];

export default function InventorySettings() {
  const classes = useStyles();
  const history = useHistory();
  const { userProfile } = useAuth();
  const { vehicles, refetch } = useVehicles({ refreshInterval: 60000 });
  const vehicleFileInputRef = useRef(null);
  const deviceFileInputRef = useRef(null);

  // Alert state
  const [alert, setAlert] = useState(null);

  // Single Vehicle form state
  const [vehicleData, setVehicleData] = useState({
    name: "",
    plate_number: "",
    make: "",
    model: "",
    year: "",
    driver_name: "",
  });
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);

  // Single Device form state
  const [deviceData, setDeviceData] = useState({
    vehicle_id: "",
    imei: "",
    serial_number: "",
  });
  const [deviceSubmitting, setDeviceSubmitting] = useState(false);

  // Batch upload states
  const [vehicleUploadResult, setVehicleUploadResult] = useState(null);
  const [deviceUploadResult, setDeviceUploadResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    active: false,
    current: 0,
    total: 0,
    type: "",
  });

  // Handle single vehicle submission
  const handleAddVehicle = async () => {
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

    setVehicleSubmitting(true);
    try {
      if (!userProfile?.fleet_id) throw new Error("No fleet assigned to user");

      const { error } = await addVehicle(vehicleData, userProfile.fleet_id);

      if (error) throw error;

      setAlert(
        <SweetAlert
          success
          title="Vehicle Added!"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Continue"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          The vehicle has been successfully registered.
        </SweetAlert>
      );
      setVehicleData({
        name: "",
        plate_number: "",
        make: "",
        model: "",
        year: "",
        driver_name: "",
      });
      refetch();
    } catch (err) {
      console.error("Error adding vehicle:", err);
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
      setVehicleSubmitting(false);
    }
  };

  // Handle single device submission
  const handleAddDevice = async () => {
    if (!deviceData.vehicle_id || !deviceData.imei.trim()) {
      setAlert(
        <SweetAlert
          warning
          title="Missing Fields"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Got it"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          Vehicle selection and IMEI are required.
        </SweetAlert>
      );
      return;
    }

    setDeviceSubmitting(true);
    try {
      const { error } = await addDevice({ ...deviceData });

      if (error) throw error;

      setAlert(
        <SweetAlert
          success
          title="Device Linked!"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Continue"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          The device has been successfully linked to the vehicle.
        </SweetAlert>
      );
      setDeviceData({
        vehicle_id: "",
        imei: "",
        serial_number: "",
      });
      refetch();
    } catch (err) {
      console.error("Error adding device:", err);
      setAlert(
        <SweetAlert
          error
          title="Error"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Close"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          {err.message || "Could not link device. IMEI may already exist."}
        </SweetAlert>
      );
    } finally {
      setDeviceSubmitting(false);
    }
  };

  // Parse CSV content
  const parseCSV = (content) => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return { headers: [], rows: [] };

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted values with commas
      const values = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  // Handle vehicle CSV upload
  const handleVehicleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset input
    event.target.value = "";

    try {
      const content = await file.text();
      const { headers, rows } = parseCSV(content);

      // Validate headers
      const requiredHeader = "name";
      if (!headers.includes(requiredHeader)) {
        setVehicleUploadResult({
          success: false,
          message: `Invalid CSV format. Missing required column: "${requiredHeader}"`,
          details: `Expected headers: ${VEHICLE_CSV_HEADERS.join(", ")}`,
        });
        return;
      }

      if (rows.length === 0) {
        setVehicleUploadResult({
          success: false,
          message: "No valid data rows found in CSV",
          details: "Please ensure your CSV has data rows after the header.",
        });
        return;
      }

      // Start batch insert
      setUploadProgress({
        active: true,
        current: 0,
        total: rows.length,
        type: "vehicles",
      });
      setVehicleUploadResult(null);

      const result = await batchAddVehicles(rows, userProfile?.fleet_id, (current) => {
        setUploadProgress((prev) => ({ ...prev, current }));
      });
      const { successCount, errorCount, errors } = result;

      setUploadProgress({ active: false, current: 0, total: 0, type: "" });
      setVehicleUploadResult({
        success: errorCount === 0,
        message:
          errorCount === 0
            ? `Successfully imported ${successCount} vehicles!`
            : `Imported ${successCount} vehicles with ${errorCount} errors`,
        details:
          errors.length > 0
            ? errors.slice(0, 3).join("\n") +
              (errors.length > 3 ? `\n...and ${errors.length - 3} more` : "")
            : null,
      });
      refetch();
    } catch (err) {
      setUploadProgress({ active: false, current: 0, total: 0, type: "" });
      setVehicleUploadResult({
        success: false,
        message: "Failed to process CSV file",
        details: err.message,
      });
    }
  };

  // Handle device CSV upload
  const handleDeviceFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reset input
    event.target.value = "";

    try {
      const content = await file.text();
      const { headers, rows } = parseCSV(content);

      // Validate headers
      if (!headers.includes("plate_number") || !headers.includes("imei")) {
        setDeviceUploadResult({
          success: false,
          message: "Invalid CSV format. Missing required columns: plate_number, imei",
          details: `Expected headers: ${DEVICE_CSV_HEADERS.join(", ")}`,
        });
        return;
      }

      if (rows.length === 0) {
        setDeviceUploadResult({
          success: false,
          message: "No valid data rows found in CSV",
          details: "Please ensure your CSV has data rows after the header.",
        });
        return;
      }

      // Start batch insert
      setUploadProgress({
        active: true,
        current: 0,
        total: rows.length,
        type: "devices",
      });
      setDeviceUploadResult(null);

      const result = await batchAddDevices(rows, vehicles, (current) => {
        setUploadProgress((prev) => ({ ...prev, current }));
      });
      const { successCount, errorCount, errors } = result;

      setUploadProgress({ active: false, current: 0, total: 0, type: "" });
      setDeviceUploadResult({
        success: errorCount === 0,
        message:
          errorCount === 0
            ? `Successfully linked ${successCount} devices!`
            : `Linked ${successCount} devices with ${errorCount} errors`,
        details:
          errors.length > 0
            ? errors.slice(0, 3).join("\n") +
              (errors.length > 3 ? `\n...and ${errors.length - 3} more` : "")
            : null,
      });
      refetch();
    } catch (err) {
      setUploadProgress({ active: false, current: 0, total: 0, type: "" });
      setDeviceUploadResult({
        success: false,
        message: "Failed to process CSV file",
        details: err.message,
      });
    }
  };

  // Download CSV template
  const downloadTemplate = (type) => {
    let headers, filename;
    if (type === "vehicles") {
      headers = VEHICLE_CSV_HEADERS;
      filename = "vehicles_template.csv";
    } else {
      headers = DEVICE_CSV_HEADERS;
      filename = "devices_template.csv";
    }

    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header with back button */}
      <div className={classes.header}>
        <IconButton className={classes.backButton} onClick={() => history.push("/admin/settings")}>
          <ArrowBack />
        </IconButton>
        <div>
          <h1 className={classes.pageTitle}>Inventory Management</h1>
          <div className={classes.pageSubtitle}>
            Add vehicles and link GPS devices to your fleet
          </div>
        </div>
      </div>

      <GridContainer>
        {/* Add Single Vehicle Section */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardHeader color="primary" icon>
              <CardIcon color="primary">
                <DirectionsCar />
              </CardIcon>
              <h4 className={classes.cardIconTitle}>Add Vehicle</h4>
            </CardHeader>
            <CardBody>
              <div className={classes.formSection}>
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
                <Button
                  className={classes.submitButton}
                  onClick={handleAddVehicle}
                  disabled={vehicleSubmitting}
                >
                  {vehicleSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Add Vehicle"
                  )}
                </Button>
              </div>

              <div className={classes.divider} />

              {/* Batch Upload Section */}
              <h4 className={classes.sectionTitle}>Batch Upload Vehicles</h4>
              <input
                type="file"
                accept=".csv"
                ref={vehicleFileInputRef}
                className={classes.hiddenInput}
                onChange={handleVehicleFileUpload}
              />
              <div
                className={classes.uploadSection}
                onClick={() => vehicleFileInputRef.current?.click()}
              >
                <CloudUpload className={classes.uploadIcon} />
                <div className={classes.uploadText}>Click to upload CSV file</div>
                <div className={classes.uploadSubtext}>
                  Headers: name, plate_number, make, model, year, driver_name
                </div>
              </div>
              <div className={classes.templateLink} onClick={() => downloadTemplate("vehicles")}>
                <GetApp className={classes.templateIcon} />
                Download CSV Template
              </div>

              {uploadProgress.active && uploadProgress.type === "vehicles" && (
                <div className={classes.progressContainer}>
                  <div className={classes.progressText}>
                    Processing {uploadProgress.current} of {uploadProgress.total}...
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={(uploadProgress.current / uploadProgress.total) * 100}
                  />
                </div>
              )}

              {vehicleUploadResult && (
                <div
                  className={`${classes.resultBox} ${
                    vehicleUploadResult.success ? classes.successBox : classes.errorBox
                  }`}
                >
                  {vehicleUploadResult.success ? (
                    <CheckCircle className={classes.resultIcon} />
                  ) : (
                    <Error className={classes.resultIcon} />
                  )}
                  <div className={classes.resultContent}>
                    <div className={classes.resultTitle}>{vehicleUploadResult.message}</div>
                    {vehicleUploadResult.details && (
                      <div className={classes.resultDetails}>{vehicleUploadResult.details}</div>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Add Single Device Section */}
        <GridItem xs={12} md={6}>
          <Card>
            <CardHeader color="info" icon>
              <CardIcon color="info">
                <Router />
              </CardIcon>
              <h4 className={classes.cardIconTitle}>Link Device</h4>
            </CardHeader>
            <CardBody>
              <div className={classes.formSection}>
                <GridContainer>
                  <GridItem xs={12}>
                    <FormControl fullWidth variant="outlined" margin="dense">
                      <Select
                        value={deviceData.vehicle_id}
                        onChange={(e) =>
                          setDeviceData({ ...deviceData, vehicle_id: e.target.value })
                        }
                        displayEmpty
                      >
                        <MenuItem value="" disabled>
                          Select Vehicle *
                        </MenuItem>
                        {vehicles
                          .filter((v) => !v.imei)
                          .map((v) => (
                            <MenuItem key={v.id} value={v.id}>
                              {v.name} {v.plate_number ? `(${v.plate_number})` : ""}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem xs={12}>
                    <TextField
                      margin="dense"
                      label="IMEI Number *"
                      fullWidth
                      variant="outlined"
                      value={deviceData.imei}
                      onChange={(e) => setDeviceData({ ...deviceData, imei: e.target.value })}
                    />
                  </GridItem>
                  <GridItem xs={12} sm={6}>
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
                  <GridItem xs={12} sm={6} />
                </GridContainer>
                <Button
                  className={classes.submitButton}
                  onClick={handleAddDevice}
                  disabled={deviceSubmitting}
                >
                  {deviceSubmitting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Link Device"
                  )}
                </Button>
              </div>

              <div className={classes.divider} />

              {/* Batch Upload Section */}
              <h4 className={classes.sectionTitle}>Batch Link Devices</h4>
              <input
                type="file"
                accept=".csv"
                ref={deviceFileInputRef}
                className={classes.hiddenInput}
                onChange={handleDeviceFileUpload}
              />
              <div
                className={classes.uploadSection}
                onClick={() => deviceFileInputRef.current?.click()}
              >
                <CloudUpload className={classes.uploadIcon} />
                <div className={classes.uploadText}>Click to upload CSV file</div>
                <div className={classes.uploadSubtext}>
                  Headers: plate_number, imei, serial_number
                </div>
              </div>
              <div className={classes.templateLink} onClick={() => downloadTemplate("devices")}>
                <GetApp className={classes.templateIcon} />
                Download CSV Template
              </div>

              {uploadProgress.active && uploadProgress.type === "devices" && (
                <div className={classes.progressContainer}>
                  <div className={classes.progressText}>
                    Processing {uploadProgress.current} of {uploadProgress.total}...
                  </div>
                  <LinearProgress
                    variant="determinate"
                    value={(uploadProgress.current / uploadProgress.total) * 100}
                  />
                </div>
              )}

              {deviceUploadResult && (
                <div
                  className={`${classes.resultBox} ${
                    deviceUploadResult.success ? classes.successBox : classes.errorBox
                  }`}
                >
                  {deviceUploadResult.success ? (
                    <CheckCircle className={classes.resultIcon} />
                  ) : (
                    <Error className={classes.resultIcon} />
                  )}
                  <div className={classes.resultContent}>
                    <div className={classes.resultTitle}>{deviceUploadResult.message}</div>
                    {deviceUploadResult.details && (
                      <div className={classes.resultDetails}>{deviceUploadResult.details}</div>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      {alert}
    </div>
  );
}
