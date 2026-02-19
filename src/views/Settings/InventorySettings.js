import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import { Car, Router, Upload, CheckCircle2, CircleAlert, Download, ArrowLeft, Loader2 } from "lucide-react";

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
import { useVehicles } from "hooks/useVehicles";
import { addVehicle, batchAddVehicles } from "services/vehicleService";
import { addDevice, batchAddDevices } from "services/deviceService";
import { useAuth } from "context/AuthContext";
import { cn } from "lib/utils";

// CSV template headers
const VEHICLE_CSV_HEADERS = ["name", "plate_number", "make", "model", "year", "driver_name"];
const DEVICE_CSV_HEADERS = ["plate_number", "imei", "serial_number"];

export default function InventorySettings() {
  const history = useHistory();
  const { userProfile } = useAuth();
  const { vehicles, refetch } = useVehicles({ refreshInterval: 60000 });
  const vehicleFileInputRef = useRef(null);
  const deviceFileInputRef = useRef(null);

  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", message: "", type: "info" });

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

  const showAlert = (title, message, type = "info") => {
    setAlertConfig({ title, message, type });
    setAlertOpen(true);
  };

  // Handle single vehicle submission
  const handleAddVehicle = async () => {
    if (!vehicleData.name.trim()) {
      showAlert("Missing Field", "Vehicle name is required.", "warning");
      return;
    }

    setVehicleSubmitting(true);
    try {
      if (!userProfile?.fleet_id) throw new Error("No fleet assigned to user");

      const { error } = await addVehicle(vehicleData, userProfile.fleet_id);

      if (error) throw error;

      showAlert("Vehicle Added!", "The vehicle has been successfully registered.", "success");
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
      showAlert("Error", err.message, "error");
    } finally {
      setVehicleSubmitting(false);
    }
  };

  // Handle single device submission
  const handleAddDevice = async () => {
    if (!deviceData.vehicle_id || !deviceData.imei.trim()) {
      showAlert("Missing Fields", "Vehicle selection and IMEI are required.", "warning");
      return;
    }

    setDeviceSubmitting(true);
    try {
      const { error } = await addDevice({ ...deviceData });

      if (error) throw error;

      showAlert("Device Linked!", "The device has been successfully linked to the vehicle.", "success");
      setDeviceData({
        vehicle_id: "",
        imei: "",
        serial_number: "",
      });
      refetch();
    } catch (err) {
      console.error("Error adding device:", err);
      showAlert("Error", err.message || "Could not link device. IMEI may already exist.", "error");
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

      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          className="mr-4 p-2 bg-white border border-border rounded-lg hover:bg-muted/50 transition-colors"
          onClick={() => history.push("/admin/settings")}
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-foreground m-0">Inventory Management</h1>
          <div className="text-sm text-muted-foreground mt-1">
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
                <Car className="w-6 h-6" />
              </CardIcon>
              <h4 className="text-foreground mt-4 min-h-0 font-light mb-0 no-underline">
                Add Vehicle
              </h4>
            </CardHeader>
            <CardBody>
              <div className="mb-8">
                <GridContainer>
                  <GridItem xs={12} sm={6}>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Vehicle Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Truck 01"
                        className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={vehicleData.name}
                        onChange={(e) => setVehicleData({ ...vehicleData, name: e.target.value })}
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={6}>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Plate Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={vehicleData.plate_number}
                        onChange={(e) =>
                          setVehicleData({ ...vehicleData, plate_number: e.target.value })
                        }
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={4}>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Make</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={vehicleData.make}
                        onChange={(e) => setVehicleData({ ...vehicleData, make: e.target.value })}
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={4}>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Model</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={vehicleData.model}
                        onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={4}>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={vehicleData.year}
                        onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12}>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Driver Name
                      </label>
                      <input
                        type="text"
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
                  disabled={vehicleSubmitting}
                >
                  {vehicleSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Add Vehicle"
                  )}
                </Button>
              </div>

              <div className="h-px bg-muted my-8" />

              {/* Batch Upload Section */}
              <h4 className="text-lg font-semibold text-foreground mb-5 mt-0">
                Batch Upload Vehicles
              </h4>
              <input
                type="file"
                accept=".csv"
                ref={vehicleFileInputRef}
                className="hidden"
                onChange={handleVehicleFileUpload}
              />
              <div
                className="border-2 border-dashed border-border rounded-xl py-10 px-5 text-center bg-muted/50 cursor-pointer transition-all hover:border-primary hover:bg-muted"
                onClick={() => vehicleFileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-sm mb-2">Click to upload CSV file</div>
                <div className="text-muted-foreground text-xs">
                  Headers: name, plate_number, make, model, year, driver_name
                </div>
              </div>
              <button
                className="inline-flex items-center text-blue-500 text-[13px] mt-4 cursor-pointer hover:underline"
                onClick={() => downloadTemplate("vehicles")}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download CSV Template
              </button>

              {uploadProgress.active && uploadProgress.type === "vehicles" && (
                <div className="mt-5">
                  <div className="text-[13px] text-muted-foreground mb-2 text-center">
                    Processing {uploadProgress.current} of {uploadProgress.total}...
                  </div>
                  <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                </div>
              )}

              {vehicleUploadResult && (
                <div
                  className={cn(
                    "mt-5 p-4 rounded-lg flex items-start gap-3",
                    vehicleUploadResult.success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  )}
                >
                  {vehicleUploadResult.success ? (
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                  ) : (
                    <CircleAlert className="w-6 h-6 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{vehicleUploadResult.message}</div>
                    {vehicleUploadResult.details && (
                      <div className="text-[13px] opacity-90">{vehicleUploadResult.details}</div>
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
                <Router className="w-6 h-6" />
              </CardIcon>
              <h4 className="text-foreground mt-4 min-h-0 font-light mb-0 no-underline">
                Link Device
              </h4>
            </CardHeader>
            <CardBody>
              <div className="mb-8">
                <GridContainer>
                  <GridItem xs={12}>
                    <div className="mt-2">
                      <select
                        className="w-full px-3 py-2.5 border border-border rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={deviceData.vehicle_id}
                        onChange={(e) =>
                          setDeviceData({ ...deviceData, vehicle_id: e.target.value })
                        }
                      >
                        <option value="" disabled>
                          Select Vehicle *
                        </option>
                        {vehicles
                          .filter((v) => !v.imei)
                          .map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} {v.plate_number ? `(${v.plate_number})` : ""}
                            </option>
                          ))}
                      </select>
                    </div>
                  </GridItem>
                  <GridItem xs={12}>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        IMEI Number *
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={deviceData.imei}
                        onChange={(e) => setDeviceData({ ...deviceData, imei: e.target.value })}
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={6}>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={deviceData.serial_number}
                        onChange={(e) =>
                          setDeviceData({ ...deviceData, serial_number: e.target.value })
                        }
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={6} />
                </GridContainer>
                <Button
                  className="bg-primary text-primary-foreground px-6 py-2.5 normal-case font-semibold mt-4 hover:bg-primary/90"
                  onClick={handleAddDevice}
                  disabled={deviceSubmitting}
                >
                  {deviceSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Link Device"
                  )}
                </Button>
              </div>

              <div className="h-px bg-muted my-8" />

              {/* Batch Upload Section */}
              <h4 className="text-lg font-semibold text-foreground mb-5 mt-0">
                Batch Link Devices
              </h4>
              <input
                type="file"
                accept=".csv"
                ref={deviceFileInputRef}
                className="hidden"
                onChange={handleDeviceFileUpload}
              />
              <div
                className="border-2 border-dashed border-border rounded-xl py-10 px-5 text-center bg-muted/50 cursor-pointer transition-all hover:border-primary hover:bg-muted"
                onClick={() => deviceFileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-muted-foreground text-sm mb-2">Click to upload CSV file</div>
                <div className="text-muted-foreground text-xs">
                  Headers: plate_number, imei, serial_number
                </div>
              </div>
              <button
                className="inline-flex items-center text-blue-500 text-[13px] mt-4 cursor-pointer hover:underline"
                onClick={() => downloadTemplate("devices")}
              >
                <Download className="w-4 h-4 mr-1.5" />
                Download CSV Template
              </button>

              {uploadProgress.active && uploadProgress.type === "devices" && (
                <div className="mt-5">
                  <div className="text-[13px] text-muted-foreground mb-2 text-center">
                    Processing {uploadProgress.current} of {uploadProgress.total}...
                  </div>
                  <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                </div>
              )}

              {deviceUploadResult && (
                <div
                  className={cn(
                    "mt-5 p-4 rounded-lg flex items-start gap-3",
                    deviceUploadResult.success
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  )}
                >
                  {deviceUploadResult.success ? (
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                  ) : (
                    <CircleAlert className="w-6 h-6 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{deviceUploadResult.message}</div>
                    {deviceUploadResult.details && (
                      <div className="text-[13px] opacity-90">{deviceUploadResult.details}</div>
                    )}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
