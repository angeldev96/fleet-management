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
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

// @material-ui/icons
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
import { addDevice, batchAddDevices } from "services/deviceService";
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
    whiteSpace: "pre-line",
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
  tabsContainer: {
    marginBottom: "20px",
    borderBottom: "1px solid #E0E4E8",
  },
}));

const DEVICE_CSV_HEADERS = ["imei", "serial_number"];

export default function DeviceManagement() {
  const classes = useStyles();
  const history = useHistory();
  const { vehicles, refetch } = useVehicles({ refreshInterval: 60000, fetchAll: true });
  const fileInputRef = useRef(null);

  // Alert state
  const [alert, setAlert] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Single Device form state
  const [deviceData, setDeviceData] = useState({
    vehicle_id: "",
    imei: "",
    serial_number: "",
  });
  const [deviceSubmitting, setDeviceSubmitting] = useState(false);

  // Batch upload states
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    active: false,
    current: 0,
    total: 0,
  });

  const availableVehicles = vehicles.filter((vehicle) => !vehicle.imei);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setUploadResult(null);
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

  // Handle device CSV upload
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = "";

    try {
      const content = await file.text();
      const { headers, rows } = parseCSV(content);

      if (!headers.includes("plate_number") || !headers.includes("imei")) {
        setUploadResult({
          success: false,
          message: "Invalid CSV format. Missing required columns: plate_number, imei",
          details: `Expected headers: ${DEVICE_CSV_HEADERS.join(", ")}`,
        });
        return;
      }

      if (rows.length === 0) {
        setUploadResult({
          success: false,
          message: "No valid data rows found in CSV",
          details: "Please ensure your CSV has data rows after the header.",
        });
        return;
      }

      setUploadProgress({
        active: true,
        current: 0,
        total: rows.length,
      });
      setUploadResult(null);

      const result = await batchAddDevices(rows, vehicles, (current) => {
        setUploadProgress((prev) => ({ ...prev, current }));
      });
      const { successCount, errorCount, errors } = result;

      setUploadProgress({ active: false, current: 0, total: 0 });
      setUploadResult({
        success: errorCount === 0,
        message:
          errorCount === 0
            ? `Successfully linked ${successCount} devices!`
            : `Linked ${successCount} devices with ${errorCount} errors`,
        details:
          errors.length > 0
            ? errors.slice(0, 5).join("\n") +
              (errors.length > 5 ? `\n...and ${errors.length - 5} more` : "")
            : null,
      });
      refetch();
    } catch (err) {
      setUploadProgress({ active: false, current: 0, total: 0 });
      setUploadResult({
        success: false,
        message: "Failed to process CSV file",
        details: err.message,
      });
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = DEVICE_CSV_HEADERS.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "devices_template.csv";
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
          <h1 className={classes.pageTitle}>Device Management</h1>
          <div className={classes.pageSubtitle}>
            Link GPS devices to your fleet vehicles and manage device configurations
          </div>
        </div>
      </div>

      <GridContainer>
        <GridItem xs={12}>
          <Card>
            <CardHeader color="info" icon>
              <CardIcon color="info">
                <Router />
              </CardIcon>
              <h4 className={classes.cardIconTitle}>Link Device to Vehicle</h4>
            </CardHeader>
            <CardBody>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                className={classes.tabsContainer}
                indicatorColor="primary"
              >
                <Tab label="Single Device" />
                <Tab label="Batch Upload" />
              </Tabs>

              {tabValue === 0 && (
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
                          {availableVehicles.length === 0 && (
                            <MenuItem value="" disabled>
                              No available vehicles
                            </MenuItem>
                          )}
                          {availableVehicles.map((vehicle) => (
                            <MenuItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.name} {vehicle.plate_number ? `(${vehicle.plate_number})` : ""}
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
              )}

              {tabValue === 1 && (
                <div>
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    className={classes.hiddenInput}
                    onChange={handleFileUpload}
                  />
                  <div className={classes.uploadSection} onClick={() => fileInputRef.current?.click()}>
                    <CloudUpload className={classes.uploadIcon} />
                    <div className={classes.uploadText}>Click to upload CSV file</div>
                    <div className={classes.uploadSubtext}>
                      Headers: imei, serial_number
                    </div>
                  </div>
                  <div className={classes.templateLink} onClick={downloadTemplate}>
                    <GetApp className={classes.templateIcon} />
                    Download CSV Template
                  </div>

                  {uploadProgress.active && (
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

                  {uploadResult && (
                    <div
                      className={`${classes.resultBox} ${
                        uploadResult.success ? classes.successBox : classes.errorBox
                      }`}
                    >
                      {uploadResult.success ? (
                        <CheckCircle className={classes.resultIcon} />
                      ) : (
                        <Error className={classes.resultIcon} />
                      )}
                      <div className={classes.resultContent}>
                        <div className={classes.resultTitle}>{uploadResult.message}</div>
                        {uploadResult.details && (
                          <div className={classes.resultDetails}>{uploadResult.details}</div>
                        )}
                      </div>
                    </div>
                  )}
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
