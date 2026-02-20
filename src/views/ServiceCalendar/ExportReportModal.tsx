import React, { useState, useMemo } from "react";

// lucide icons
import { X, BarChart3, Search, Loader2 } from "lucide-react";

// core components
import Button from "components/CustomButtons/Button.js";

// shadcn ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "components/ui/radio-group";
import { Label } from "components/ui/label";

// hooks & utils
import { useVehicles } from "hooks/useVehicles";
import { useVehicleServiceHistory } from "hooks/useServiceEvents";
import { SERVICE_STATUS_CLASSES } from "types/database";
import { exportToCSV, exportToPDF } from "./exportService";

const inputClasses =
  "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const selectClasses =
  "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none";

export default function ExportReportModal({ open, onClose, fleetEvents, fleetEventsLoading }) {
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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-[600px]" showCloseButton={false}>
        <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-indigo-700" />
            </div>
            <DialogTitle className="text-xl font-semibold text-foreground">Export Service Report</DialogTitle>
          </div>
          <button
            className="text-muted-foreground hover:text-primary transition-colors"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="py-2">
          <div className="text-sm font-semibold text-foreground mb-2">Report Scope</div>
          <RadioGroup
            className="flex flex-row gap-6"
            value={scope}
            onValueChange={(value) => {
              setScope(value);
              setSelectedVehicleId("");
              setVehicleSearch("");
            }}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="fleet" id="scope-fleet" />
              <Label htmlFor="scope-fleet" className="text-sm font-normal">Entire Fleet</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="vehicle" id="scope-vehicle" />
              <Label htmlFor="scope-vehicle" className="text-sm font-normal">Specific Vehicle</Label>
            </div>
          </RadioGroup>

          {scope === "vehicle" && (
            <>
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, plate, make, model..."
                  className={`${inputClasses} pl-9`}
                  value={vehicleSearch}
                  onChange={(e) => setVehicleSearch(e.target.value)}
                  disabled={vehiclesLoading}
                />
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-foreground mb-1">Select Vehicle</label>
                <select
                  className={selectClasses}
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  disabled={vehiclesLoading}
                >
                  <option value="">-- Select --</option>
                  {vehiclesLoading ? (
                    <option disabled>Loading vehicles...</option>
                  ) : filteredVehicles.length === 0 ? (
                    <option disabled>No vehicles match your search</option>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.name} {vehicle.plate_number ? `(${vehicle.plate_number})` : ""}
                        {vehicle.make ? ` — ${vehicle.make} ${vehicle.model || ""}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </>
          )}

          <div className="text-sm font-semibold text-foreground mb-2 mt-6">Export Format</div>
          <RadioGroup
            className="flex flex-row gap-6"
            value={format}
            onValueChange={(value) => setFormat(value)}
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="pdf" id="format-pdf" />
              <Label htmlFor="format-pdf" className="text-sm font-normal">PDF Document</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="csv" id="format-csv" />
              <Label htmlFor="format-csv" className="text-sm font-normal">CSV Spreadsheet</Label>
            </div>
          </RadioGroup>

          <div className="bg-muted/50 rounded-lg p-4 mt-5">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Export Preview</div>
            {dataLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !exportEvents || exportEvents.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                {scope === "vehicle" && !selectedVehicleId
                  ? "Select a vehicle to preview"
                  : "No service events found"}
              </div>
            ) : (
              <>
                <div className="text-[22px] font-bold text-foreground mb-2.5">
                  {statusBreakdown.total} service event{statusBreakdown.total !== 1 ? "s" : ""}
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusBreakdown.completed > 0 && (
                    <span
                      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 inline-flex items-center ${SERVICE_STATUS_CLASSES.completed}`}
                    >
                      {statusBreakdown.completed} Completed
                    </span>
                  )}
                  {statusBreakdown.pending > 0 && (
                    <span
                      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 inline-flex items-center ${SERVICE_STATUS_CLASSES.pending}`}
                    >
                      {statusBreakdown.pending} Pending
                    </span>
                  )}
                  {statusBreakdown.in_progress > 0 && (
                    <span
                      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 inline-flex items-center ${SERVICE_STATUS_CLASSES.in_progress}`}
                    >
                      {statusBreakdown.in_progress} In Progress
                    </span>
                  )}
                  {statusBreakdown.overdue > 0 && (
                    <span
                      className={`text-[11px] font-semibold rounded-full px-2.5 py-1 inline-flex items-center ${SERVICE_STATUS_CLASSES.overdue}`}
                    >
                      {statusBreakdown.overdue} Overdue
                    </span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              className="bg-background text-primary px-6 py-2.5 normal-case font-semibold mr-3 border border-border rounded-lg hover:bg-muted/50"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="bg-primary text-primary-foreground px-6 py-2.5 normal-case font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50"
              onClick={handleExport}
              disabled={!canExport}
            >
              {format === "pdf" ? "Export as PDF" : "Export as CSV"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
