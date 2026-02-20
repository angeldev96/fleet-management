import React, { useState, useRef } from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import { Router, Upload, CheckCircle2, CircleAlert, Download, ArrowLeft, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer";
import GridItem from "components/Grid/GridItem";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import CardIcon from "components/Card/CardIcon";
import Button from "components/CustomButtons/Button";

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
import { addDevice, batchAddDevices } from "services/deviceService";
import { cn } from "lib/utils";

const DEVICE_CSV_HEADERS = ["imei", "serial_number"];

export default function DeviceManagement() {
  const history = useHistory();
  const { vehicles, refetch } = useVehicles({ refreshInterval: 60000, fetchAll: true });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Alert dialog state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ title: "", message: "", type: "info" });
  const [tabValue, setTabValue] = useState(0);

  // Single Device form state
  const [deviceData, setDeviceData] = useState({
    vehicle_id: "",
    imei: "",
    serial_number: "",
  });
  const [deviceSubmitting, setDeviceSubmitting] = useState(false);

  // Batch upload states
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; details?: string | null } | null>(null);
  const [uploadProgress, setUploadProgress] = useState({
    active: false,
    current: 0,
    total: 0,
  });

  const availableVehicles = vehicles.filter((vehicle) => !vehicle.imei);

  const showAlert = (title: string, message: string, type: string = "info") => {
    setAlertConfig({ title, message, type });
    setAlertOpen(true);
  };

  const handleTabChange = (newValue: number) => {
    setTabValue(newValue);
    setUploadResult(null);
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
    } catch (err: any) {
      console.error("Error adding device:", err);
      showAlert("Error", err.message || "Could not link device. IMEI may already exist.", "error");
    } finally {
      setDeviceSubmitting(false);
    }
  };

  // Parse CSV content
  const parseCSV = (content: string) => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return { headers: [], rows: [] };

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values: string[] = [];
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
        const row: Record<string, any> = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx];
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  // Handle device CSV upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
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

      const result = await batchAddDevices(rows as any, vehicles, (current) => {
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
        details: (err as any).message,
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
          className="mr-3 md:mr-4 p-2 bg-white border border-border rounded-lg hover:bg-muted/50 transition-colors shrink-0"
          onClick={() => history.push("/admin/settings")}
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground m-0">Device Management</h1>
          <div className="text-sm text-muted-foreground mt-1">
            Link GPS devices to your fleet vehicles
          </div>
        </div>
      </div>

      <GridContainer>
        <GridItem xs={12}>
          <Card>
            <CardHeader color="info" icon>
              <CardIcon color="info">
                <Router className="w-6 h-6" />
              </CardIcon>
              <h4 className="text-foreground mt-4 min-h-0 font-light mb-0 no-underline">
                Link Device to Vehicle
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
                  Single Device
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
                          {availableVehicles.length === 0 && (
                            <option value="" disabled>
                              No available vehicles
                            </option>
                          )}
                          {availableVehicles.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.name} {vehicle.plate_number ? `(${vehicle.plate_number})` : ""}
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
                      Headers: imei, serial_number
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
