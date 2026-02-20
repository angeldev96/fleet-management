import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import { Car, Upload, CheckCircle2, CircleAlert, Download, ArrowLeft, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import Button from "components/CustomButtons/Button.js";

// shadcn
import { Progress } from "components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "components/ui/alert-dialog";

// hooks & utils
import { useAuth } from "context/AuthContext";
import { addVehicle, batchAddVehicles } from "services/vehicleService";
import { cn } from "lib/utils";

const VEHICLE_CSV_HEADERS = ["make", "model", "year", "plate_number", "driver_name"];

export default function VehicleDataUpload() {
  const history = useHistory();
  const { userProfile } = useAuth();
  const fileInputRef = useRef(null);

  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", message: "", type: "info" });
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

  const showAlert = (title, message, type = "info") => {
    setAlertConfig({ title, message, type });
    setAlertOpen(true);
  };

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
    setUploadResult(null);
  };

  const handleAddVehicle = async () => {
    if (!vehicleData.plate_number.trim()) {
      showAlert("Missing Fields", "License plate is required.", "warning");
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

      showAlert("Vehicle Added!", "The vehicle has been added to your fleet.", "success");
      setVehicleData({
        make: "",
        model: "",
        year: "",
        plate_number: "",
        driver_name: "",
      });
    } catch (err) {
      console.error("Error adding vehicle:", err);
      showAlert("Error", err.message || "Could not add vehicle.", "error");
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
      {/* Alert Dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>{alertConfig.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setAlertOpen(false)}>
              {alertConfig.type === "error" ? "Close" : alertConfig.type === "warning" ? "Got it" : "Continue"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center mb-6">
        <button
          className="mr-3 md:mr-4 p-2 bg-white border border-border rounded-lg hover:bg-muted/50 transition-colors shrink-0"
          onClick={() => history.push("/admin/settings")}
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground m-0">Vehicle Data Upload</h1>
          <div className="text-sm text-muted-foreground mt-1">
            Add vehicles individually or upload in bulk via CSV
          </div>
        </div>
      </div>

      <GridContainer>
        <GridItem xs={12}>
          <Card>
            <CardHeader color="primary" icon>
              <CardIcon color="primary">
                <Car className="w-6 h-6" />
              </CardIcon>
              <h4 className="text-foreground mt-4 min-h-0 font-light mb-0 no-underline">
                Add Vehicle Data
              </h4>
            </CardHeader>
            <CardBody>
              {/* Tabs */}
              <div className="mb-5 border-b border-border flex">
                <button
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                    tabValue === 0
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleTabChange(0)}
                >
                  Single Vehicle
                </button>
                <button
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                    tabValue === 1
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleTabChange(1)}
                >
                  Batch Upload
                </button>
              </div>

              {tabValue === 0 && (
                <div className="mb-8">
                  <GridContainer>
                    <GridItem xs={12} sm={6}>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-foreground mb-1">Make</label>
                        <input
                          type="text"
                          placeholder="e.g. Toyota"
                          className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={vehicleData.make}
                          onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                        />
                      </div>
                    </GridItem>
                    <GridItem xs={12} sm={6}>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-foreground mb-1">Model</label>
                        <input
                          type="text"
                          placeholder="e.g. Corolla"
                          className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={vehicleData.model}
                          onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                        />
                      </div>
                    </GridItem>
                    <GridItem xs={12} sm={6}>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                        <input
                          type="number"
                          placeholder="e.g. 2022"
                          className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={vehicleData.year}
                          onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                        />
                      </div>
                    </GridItem>
                    <GridItem xs={12} sm={6}>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-foreground mb-1">
                          License Plate *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ABC-1234"
                          className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={vehicleData.plate_number}
                          onChange={(e) =>
                            setVehicleData({ ...vehicleData, plate_number: e.target.value })
                          }
                        />
                      </div>
                    </GridItem>
                    <GridItem xs={12} sm={6}>
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Driver Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={vehicleData.driver_name}
                          onChange={(e) =>
                            setVehicleData({ ...vehicleData, driver_name: e.target.value })
                          }
                        />
                      </div>
                    </GridItem>
                  </GridContainer>
                  <Button
                    className="bg-primary text-primary-foreground px-6 py-2.5 normal-case font-semibold mt-4 hover:bg-primary/90"
                    onClick={handleAddVehicle}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
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
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div
                    className="border-2 border-dashed border-border rounded-xl py-10 px-5 text-center bg-muted/50 cursor-pointer transition-all hover:border-primary hover:bg-muted"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <div className="text-muted-foreground text-sm mb-2">Click to upload CSV file</div>
                    <div className="text-muted-foreground text-xs">
                      Headers: make, model, year, plate_number, driver_name
                    </div>
                  </div>
                  <button
                    className="inline-flex items-center text-blue-500 text-[13px] mt-4 cursor-pointer hover:underline"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-1.5" />
                    Download CSV Template
                  </button>

                  {uploadProgress.active && (
                    <div className="mt-5">
                      <div className="text-[13px] text-muted-foreground mb-2 text-center">
                        Processing {uploadProgress.current} of {uploadProgress.total}...
                      </div>
                      <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                    </div>
                  )}

                  {uploadResult && (
                    <div
                      className={cn(
                        "mt-5 p-4 rounded-lg flex items-start gap-3",
                        uploadResult.success
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {uploadResult.success ? (
                        <CheckCircle2 className="w-6 h-6 shrink-0" />
                      ) : (
                        <CircleAlert className="w-6 h-6 shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{uploadResult.message}</div>
                        {uploadResult.details && (
                          <div className="text-[13px] opacity-90 whitespace-pre-line">
                            {uploadResult.details}
                          </div>
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
    </div>
  );
}
