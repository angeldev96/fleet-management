import React, { useState, useRef } from "react";

// lucide icons
import { X, Upload, CheckCircle, CircleAlert, Download, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer";
import GridItem from "components/Grid/GridItem";

// shadcn ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "components/ui/tabs";
import { Progress } from "components/ui/progress";

// hooks & utils
import { addVehicle, batchAddVehicles } from "services/vehicleService";
import { useAuth } from "context/AuthContext";

const VEHICLE_CSV_HEADERS = ["name", "plate_number", "make", "model", "year", "driver_name"];

interface AddVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddVehicleModal({ open, onClose, onSuccess }: AddVehicleModalProps) {
  const { userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AlertDialog states
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successCallback, setSuccessCallback] = useState<(() => void) | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [tabValue, setTabValue] = useState("single");

  // Single Vehicle form state
  const [vehicleData, setVehicleData] = useState({
    name: "",
    plate_number: "",
    make: "",
    model: "",
    year: "",
    driver_name: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Batch upload states
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; details?: string | null } | null>(null);
  const [uploadProgress, setUploadProgress] = useState({
    active: false,
    current: 0,
    total: 0,
  });

  const handleTabChange = (newValue: any) => {
    setTabValue(newValue);
    setUploadResult(null);
  };

  // Handle single vehicle submission
  const handleAddVehicle = async () => {
    if (!vehicleData.name.trim()) {
      setWarningMessage("Vehicle name is required.");
      setShowWarning(true);
      return;
    }

    setSubmitting(true);
    try {
      if (!userProfile?.fleet_id) throw new Error("No fleet assigned to user");

      const { error } = await addVehicle(vehicleData, userProfile.fleet_id);

      if (error) throw error;

      setSuccessMessage("The vehicle has been successfully registered.");
      setSuccessCallback(() => () => {
        setVehicleData({
          name: "",
          plate_number: "",
          make: "",
          model: "",
          year: "",
          driver_name: "",
        });
        onSuccess?.();
        onClose();
      });
      setShowSuccess(true);
    } catch (err) {
      console.error("Error adding vehicle:", err);
      setErrorMessage((err as Error).message);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Parse CSV content
  const parseCSV = (content: any) => {
    const lines = content.trim().split("\n");
    if (lines.length < 2) return { headers: [], rows: [] };

    const headers = lines[0].split(",").map((h: any) => h.trim().toLowerCase().replace(/"/g, ""));
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
        headers.forEach((header: any, idx: any) => {
          row[header] = values[idx];
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  };

  // Handle CSV upload
  const handleFileUpload = async (event: any) => {
    const file = event.target.files[0];
    if (!file) return;

    event.target.value = "";

    try {
      const content = await file.text();
      const { headers, rows } = parseCSV(content);

      const requiredHeader = "name";
      if (!headers.includes(requiredHeader)) {
        setUploadResult({
          success: false,
          message: `Invalid CSV format. Missing required column: "${requiredHeader}"`,
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

      const result = await batchAddVehicles(rows, userProfile?.fleet_id ?? "", (current) => {
        setUploadProgress((prev) => ({ ...prev, current }));
      });
      const { successCount, errorCount, errors } = result;

      setUploadProgress({ active: false, current: 0, total: 0 });
      setUploadResult({
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

      if (errorCount === 0) {
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      }
    } catch (err) {
      setUploadProgress({ active: false, current: 0, total: 0 });
      setUploadResult({
        success: false,
        message: "Failed to process CSV file",
        details: (err as Error).message,
      });
    }
  };

  // Download CSV template
  const downloadTemplate = () => {
    const csvContent = VEHICLE_CSV_HEADERS.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vehicles_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const inputClasses =
    "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="sm:max-w-[800px]" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <DialogTitle className="text-xl font-semibold text-foreground">Add Vehicles</DialogTitle>
            <button
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <Tabs value={tabValue} onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="single">Single Vehicle</TabsTrigger>
              <TabsTrigger value="batch">Batch Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="single">
              <div>
                <GridContainer>
                  <GridItem xs={12} sm={6}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Vehicle Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Truck 01"
                        className={inputClasses}
                        value={vehicleData.name}
                        onChange={(e) =>
                          setVehicleData({ ...vehicleData, name: e.target.value })
                        }
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={6}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Plate Number
                      </label>
                      <input
                        type="text"
                        className={inputClasses}
                        value={vehicleData.plate_number}
                        onChange={(e) =>
                          setVehicleData({ ...vehicleData, plate_number: e.target.value })
                        }
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={4}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-foreground mb-1">Make</label>
                      <input
                        type="text"
                        className={inputClasses}
                        value={vehicleData.make}
                        onChange={(e) =>
                          setVehicleData({ ...vehicleData, make: e.target.value })
                        }
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={4}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-foreground mb-1">Model</label>
                      <input
                        type="text"
                        className={inputClasses}
                        value={vehicleData.model}
                        onChange={(e) =>
                          setVehicleData({ ...vehicleData, model: e.target.value })
                        }
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12} sm={4}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-foreground mb-1">Year</label>
                      <input
                        type="number"
                        className={inputClasses}
                        value={vehicleData.year}
                        onChange={(e) =>
                          setVehicleData({ ...vehicleData, year: e.target.value })
                        }
                      />
                    </div>
                  </GridItem>
                  <GridItem xs={12}>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Driver Name
                      </label>
                      <input
                        type="text"
                        className={inputClasses}
                        value={vehicleData.driver_name}
                        onChange={(e) =>
                          setVehicleData({ ...vehicleData, driver_name: e.target.value })
                        }
                      />
                    </div>
                  </GridItem>
                </GridContainer>
                <button
                  className="mt-4 inline-flex items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  onClick={handleAddVehicle}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Vehicle"}
                </button>
              </div>
            </TabsContent>

            <TabsContent value="batch">
              <div>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div
                  className="rounded-xl border-2 border-dashed border-border bg-muted/50 p-10 text-center cursor-pointer transition-all hover:border-primary hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground mb-2">Click to upload CSV file</div>
                  <div className="text-xs text-muted-foreground">
                    Headers: name, plate_number, make, model, year, driver_name
                  </div>
                </div>
                <button
                  className="mt-4 inline-flex items-center text-sm text-blue-500 cursor-pointer hover:underline"
                  onClick={downloadTemplate}
                >
                  <Download className="mr-1.5 h-4 w-4" />
                  Download CSV Template
                </button>

                {uploadProgress.active && (
                  <div className="mt-5">
                    <div className="text-sm text-muted-foreground mb-2 text-center">
                      Processing {uploadProgress.current} of {uploadProgress.total}...
                    </div>
                    <Progress
                      value={(uploadProgress.current / uploadProgress.total) * 100}
                    />
                  </div>
                )}

                {uploadResult && (
                  <div
                    className={`mt-5 rounded-lg p-4 flex items-start gap-3 ${
                      uploadResult.success
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {uploadResult.success ? (
                      <CheckCircle className="h-6 w-6 flex-shrink-0" />
                    ) : (
                      <CircleAlert className="h-6 w-6 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold mb-1">{uploadResult.message}</div>
                      {uploadResult.details && (
                        <div className="text-sm opacity-90">{uploadResult.details}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Warning AlertDialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Missing Field</AlertDialogTitle>
            <AlertDialogDescription>{warningMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowWarning(false)}>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success AlertDialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vehicle Added!</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowSuccess(false);
                successCallback?.();
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error AlertDialog */}
      <AlertDialog open={showError} onOpenChange={setShowError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowError(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
