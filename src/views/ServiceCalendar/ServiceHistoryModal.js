import React, { useState } from "react";

// lucide icons
import { X, Wrench, Clock, Download, FileText, Loader2 } from "lucide-react";

// core components
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";

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
  AlertDialogCancel,
} from "components/ui/alert-dialog";

// hooks & utils
import { useVehicleServiceHistory, deleteServiceEvent } from "hooks/useServiceEvents";
import { SERVICE_TYPE_LABELS, SERVICE_STATUS_CLASSES } from "types/database";
import { exportToCSV, exportToPDF } from "./exportService";

export default function ServiceHistoryModal({ open, onClose, vehicleId, vehicleName, plateNumber, onEditEvent, onDeleteSuccess }) {
  const { events, loading, refetch } = useVehicleServiceHistory(vehicleId);

  // AlertDialog states (replacing SweetAlert)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDelete = (event) => {
    setDeleteTarget(event);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteConfirmOpen(false);
    const { error } = await deleteServiceEvent(deleteTarget.id);
    if (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } else {
      setShowSuccess(true);
      refetch();
      onDeleteSuccess && onDeleteSuccess();
    }
    setDeleteTarget(null);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const firstEvent = events[0];
  const totalCost = events.reduce((sum, e) => sum + (parseFloat(e.cost) || 0), 0);

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
        <DialogContent className="sm:max-w-[900px]" showCloseButton={false}>
          <DialogHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
            <DialogTitle className="text-xl font-semibold text-foreground">Service History</DialogTitle>
            <button
              className="text-muted-foreground hover:text-primary transition-colors"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </DialogHeader>

          <div className="py-2">
            <div className="flex items-center gap-4 mb-5 p-4 bg-muted/50 rounded-lg">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-indigo-700" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-foreground mb-1">{vehicleName || "Vehicle"}</div>
                <div className="text-sm text-muted-foreground">
                  {plateNumber && <span>Plate: {plateNumber}</span>}
                  {firstEvent?.driver_name && <span> | Driver: {firstEvent.driver_name}</span>}
                  {firstEvent?.make && <span> | {firstEvent.make} {firstEvent.model} {firstEvent.year && `(${firstEvent.year})`}</span>}
                </div>
              </div>
              {events.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    className="px-3 py-1.5 normal-case text-xs font-medium rounded-md border border-border bg-card text-foreground flex items-center gap-1 hover:bg-muted"
                    onClick={() => exportToCSV(events, vehicleName)}
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    className="px-3 py-1.5 normal-case text-xs font-medium rounded-md border border-border bg-card text-foreground flex items-center gap-1 hover:bg-muted"
                    onClick={() => exportToPDF(events, vehicleName)}
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center p-10 text-muted-foreground">
                <Clock className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <div>No service history found for this vehicle.</div>
              </div>
            ) : (
              <>
                <Table
                  tableHeaderColor="gray"
                  hover
                  tableHead={["Date", "Type", "Service", "Status", "Mileage", "Location", "Cost (JMD)", ""]}
                  tableData={events.map((event) => [
                    formatDate(event.service_date),
                    (
                      <span key={`type-${event.id}`} className="inline-flex items-center gap-1.5 text-sm">
                        <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                        {SERVICE_TYPE_LABELS[event.service_type] || event.service_type}
                      </span>
                    ),
                    event.service_items || "-",
                    (
                      <span
                        key={`status-${event.id}`}
                        className={`inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-1 ${SERVICE_STATUS_CLASSES[event.computed_status || event.status] || "bg-amber-50 text-amber-700"}`}
                      >
                        {(event.computed_status || event.status || "").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    ),
                    event.mileage ? `${Number(event.mileage).toLocaleString()} km` : "-",
                    event.location || "-",
                    event.cost ? `J$${parseFloat(event.cost).toFixed(2)}` : "-",
                    (
                      <div key={`actions-${event.id}`} className="flex gap-1.5">
                        {onEditEvent && (
                          <Button
                            className="px-3.5 py-1.5 normal-case text-xs rounded-md bg-muted/50 border border-border text-foreground hover:bg-muted"
                            onClick={() => onEditEvent(event)}
                          >
                            Edit
                          </Button>
                        )}
                        <Button
                          className="px-3.5 py-1.5 normal-case text-xs rounded-md bg-muted/50 border border-border text-red-700 hover:bg-muted"
                          onClick={() => handleDelete(event)}
                        >
                          Delete
                        </Button>
                      </div>
                    ),
                  ])}
                />
                {totalCost > 0 && (
                  <div className="flex justify-end items-center px-4 py-3 bg-muted/50 rounded-lg mt-3 gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Total Service Cost:</span>
                    <span className="text-base font-bold text-foreground">
                      J${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JMD
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service event from {deleteTarget?.service_date}. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
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

      {/* Success AlertDialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deleted!</AlertDialogTitle>
            <AlertDialogDescription>The service event has been deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccess(false)}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
