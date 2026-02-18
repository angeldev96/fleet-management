import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";
import LinearProgress from "@material-ui/core/LinearProgress";
import IconButton from "@material-ui/core/IconButton";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

// @material-ui/icons
import DirectionsCar from "@material-ui/icons/DirectionsCar";
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
import { useAuth } from "context/AuthContext";
import { addVehicle, batchAddVehicles } from "services/vehicleService";
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

const VEHICLE_CSV_HEADERS = ["make", "model", "year", "plate_number", "driver_name"];

export default function VehicleDataUpload() {
  const classes = useStyles();
  const history = useHistory();
  const { userProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [alert, setAlert] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Single vehicle form state
  const [vehicleData, setVehicleData] = useState({
    make: "",
    model: "",
    year: "",
    plate_number: "",
    driver_name: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Batch upload states
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({
    active: false,
    current: 0,
    total: 0,
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setUploadResult(null);
  };

  const handleAddVehicle = async () => {
    if (!vehicleData.plate_number.trim()) {
      setAlert(
        <SweetAlert
          warning
          title="Missing Fields"
          onConfirm={() => setAlert(null)}
          confirmBtnText="Got it"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          License plate is required.
        </SweetAlert>
      );
      return;
    }

    setSubmitting(true);
    try {
      const make = vehicleData.make.trim() || null;
      const model = vehicleData.model.trim() || null;
      const plate = vehicleData.plate_number.trim();
      const autoName = [make, model].filter(Boolean).join(" ") || "Vehicle";
      const name = `${autoName} (${plate})`;

      const { error } = await addVehicle(
        {
          name,
          make,
          model,
          year: vehicleData.year || null,
          plate_number: plate,
          driver_name: vehicleData.driver_name.trim() || null,
        },
        userProfile?.fleet_id
      );

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
          The vehicle has been added to your fleet.
        </SweetAlert>
      );
      setVehicleData({
        make: "",
        model: "",
        year: "",
        plate_number: "",
        driver_name: "",
      });
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
          {err.message || "Could not add vehicle."}
        </SweetAlert>
      );
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = "";

    try {
      const content = await file.text();
      const { headers, rows } = parseCSV(content);

      if (!headers.includes("plate_number")) {
        setUploadResult({
          success: false,
          message: "Invalid CSV format. Missing required column: plate_number",
          details: `Expected headers: ${VEHICLE_CSV_HEADERS.join(", ")}`,
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

      const result = await batchAddVehicles(rows, userProfile?.fleet_id, (current) => {
        setUploadProgress((prev) => ({ ...prev, current }));
      });
      const { successCount, errorCount, errors } = result;

      setUploadProgress({ active: false, current: 0, total: 0 });
      setUploadResult({
        success: errorCount === 0,
        message:
          errorCount === 0
            ? `Successfully added ${successCount} vehicles!`
            : `Added ${successCount} vehicles with ${errorCount} errors`,
        details:
          errors.length > 0
            ? errors.slice(0, 5).join("\n") +
              (errors.length > 5 ? `\n...and ${errors.length - 5} more` : "")
            : null,
      });
    } catch (err) {
      setUploadProgress({ active: false, current: 0, total: 0 });
      setUploadResult({
        success: false,
        message: "Failed to process CSV file",
        details: err.message,
      });
    }
  };

  const downloadTemplate = () => {
    const csvContent = VEHICLE_CSV_HEADERS.join(",") + "\nToyota,Corolla,2022,ABC-1234,John Doe\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicles_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className={classes.header}>
        <IconButton className={classes.backButton} onClick={() => history.push("/admin/settings")}>
          <ArrowBack />
        </IconButton>
        <div>
          <h1 className={classes.pageTitle}>Vehicle Data Upload</h1>
          <div className={classes.pageSubtitle}>
            Add vehicles to your fleet individually or upload customer data in bulk via CSV
          </div>
        </div>
      </div>

      <GridContainer>
        <GridItem xs={12}>
          <Card>
            <CardHeader color="primary" icon>
              <CardIcon color="primary">
                <DirectionsCar />
              </CardIcon>
              <h4 className={classes.cardIconTitle}>Add Vehicle Data</h4>
            </CardHeader>
            <CardBody>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                className={classes.tabsContainer}
                indicatorColor="primary"
              >
                <Tab label="Single Vehicle" />
                <Tab label="Batch Upload" />
              </Tabs>

              {tabValue === 0 && (
                <div className={classes.formSection}>
                  <GridContainer>
                    <GridItem xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Make"
                        placeholder="e.g. Toyota"
                        fullWidth
                        variant="outlined"
                        value={vehicleData.make}
                        onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                      />
                    </GridItem>
                    <GridItem xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Model"
                        placeholder="e.g. Corolla"
                        fullWidth
                        variant="outlined"
                        value={vehicleData.model}
                        onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                      />
                    </GridItem>
                    <GridItem xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Year"
                        type="number"
                        placeholder="e.g. 2022"
                        fullWidth
                        variant="outlined"
                        value={vehicleData.year}
                        onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                      />
                    </GridItem>
                    <GridItem xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="License Plate *"
                        placeholder="e.g. ABC-1234"
                        fullWidth
                        variant="outlined"
                        value={vehicleData.plate_number}
                        onChange={(e) =>
                          setVehicleData({ ...vehicleData, plate_number: e.target.value })
                        }
                      />
                    </GridItem>
                    <GridItem xs={12} sm={6}>
                      <TextField
                        margin="dense"
                        label="Driver Name"
                        placeholder="e.g. John Doe"
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
                    disabled={submitting}
                  >
                    {submitting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      "Add Vehicle"
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
                      Headers: make, model, year, plate_number, driver_name
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
