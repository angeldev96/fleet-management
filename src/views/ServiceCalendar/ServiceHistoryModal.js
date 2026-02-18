import React, { useState } from "react";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import CircularProgress from "@material-ui/core/CircularProgress";

// @material-ui/icons
import Close from "@material-ui/icons/Close";
import Build from "@material-ui/icons/Build";
import Schedule from "@material-ui/icons/Schedule";
import GetApp from "@material-ui/icons/GetApp";
import PictureAsPdf from "@material-ui/icons/PictureAsPdf";

// core components
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";

// hooks & utils
import { useVehicleServiceHistory, deleteServiceEvent } from "hooks/useServiceEvents";
import { SERVICE_TYPE_LABELS, SERVICE_STATUS_COLORS } from "types/database";
import { exportToCSV, exportToPDF } from "./exportService";
import SweetAlert from "react-bootstrap-sweetalert";

const useStyles = makeStyles(() => ({
  dialogPaper: {
    minWidth: "700px",
    maxWidth: "900px",
  },
  dialogTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #E0E4E8",
    padding: "16px 24px",
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
  vehicleHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "20px",
    padding: "16px",
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
  },
  vehicleIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#EEF2FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  vehicleMeta: {
    fontSize: "13px",
    color: "#6B7280",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#6B7280",
  },
  emptyIcon: {
    fontSize: "48px",
    color: "#D1D5DB",
    marginBottom: "16px",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "12px",
    fontWeight: "600",
    borderRadius: "999px",
    padding: "4px 10px",
  },
  serviceType: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
  },
  exportButtons: {
    display: "flex",
    gap: "8px",
  },
  exportBtn: {
    padding: "6px 12px",
    textTransform: "none",
    fontSize: "12px",
    fontWeight: "500",
    borderRadius: "6px",
    border: "1px solid #E5E7EB",
    backgroundColor: "#FFFFFF",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    "&:hover": {
      backgroundColor: "#F3F4F6",
    },
  },
  totalCostBar: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#F9FAFB",
    borderRadius: "8px",
    marginTop: "12px",
    gap: "8px",
  },
  totalCostLabel: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#6B7280",
  },
  totalCostValue: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#1f2937",
  },
}));

export default function ServiceHistoryModal({ open, onClose, vehicleId, vehicleName, plateNumber, onEditEvent, onDeleteSuccess }) {
  const classes = useStyles();
  const { events, loading, refetch } = useVehicleServiceHistory(vehicleId);
  const [alert, setAlert] = useState(null);

  const handleDelete = (event) => {
    setAlert(
      <SweetAlert
        warning
        showCancel
        title="Delete Service Event?"
        onConfirm={async () => {
          setAlert(null);
          const { error } = await deleteServiceEvent(event.id);
          if (error) {
            setAlert(
              <SweetAlert
                error
                title="Error"
                onConfirm={() => setAlert(null)}
                confirmBtnText="Close"
                focusCancelBtn={false}
                focusConfirmBtn={false}
              >
                {error.message}
              </SweetAlert>
            );
          } else {
            setAlert(
              <SweetAlert
                success
                title="Deleted!"
                onConfirm={() => setAlert(null)}
                confirmBtnText="Continue"
                focusCancelBtn={false}
                focusConfirmBtn={false}
              >
                The service event has been deleted.
              </SweetAlert>
            );
            refetch();
            onDeleteSuccess && onDeleteSuccess();
          }
        }}
        onCancel={() => setAlert(null)}
        confirmBtnText="Delete"
        cancelBtnText="Cancel"
        focusCancelBtn={false}
        focusConfirmBtn={false}
      >
        This will permanently delete the service event from {event.service_date}. This action
        cannot be undone.
      </SweetAlert>
    );
  };

  const getStatusStyle = (status) => {
    const colors = SERVICE_STATUS_COLORS[status] || SERVICE_STATUS_COLORS.pending;
    return {
      backgroundColor: colors.bg,
      color: colors.text,
    };
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
    <Dialog
      open={open}
      onClose={onClose}
      classes={{ paper: classes.dialogPaper }}
      maxWidth="md"
    >
      <DialogTitle disableTypography className={classes.dialogTitle}>
        <h3 className={classes.titleText}>Service History</h3>
        <Close className={classes.closeButton} onClick={onClose} />
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <div className={classes.vehicleHeader}>
          <div className={classes.vehicleIcon}>
            <Build style={{ color: "#4338CA" }} />
          </div>
          <div className={classes.vehicleInfo}>
            <div className={classes.vehicleName}>{vehicleName || "Vehicle"}</div>
            <div className={classes.vehicleMeta}>
              {plateNumber && <span>Plate: {plateNumber}</span>}
              {firstEvent?.driver_name && <span> | Driver: {firstEvent.driver_name}</span>}
              {firstEvent?.make && <span> | {firstEvent.make} {firstEvent.model} {firstEvent.year && `(${firstEvent.year})`}</span>}
            </div>
          </div>
          {events.length > 0 && (
            <div className={classes.exportButtons}>
              <Button
                className={classes.exportBtn}
                onClick={() => exportToCSV(events, vehicleName)}
              >
                <GetApp style={{ fontSize: "16px" }} />
                CSV
              </Button>
              <Button
                className={classes.exportBtn}
                onClick={() => exportToPDF(events, vehicleName)}
              >
                <PictureAsPdf style={{ fontSize: "16px" }} />
                PDF
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className={classes.loadingContainer}>
            <CircularProgress />
          </div>
        ) : events.length === 0 ? (
          <div className={classes.emptyState}>
            <Schedule className={classes.emptyIcon} />
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
                  <span key={`type-${event.id}`} className={classes.serviceType}>
                    <Build style={{ fontSize: "14px", color: "#6B7280" }} />
                    {SERVICE_TYPE_LABELS[event.service_type] || event.service_type}
                  </span>
                ),
                event.service_items || "-",
                (
                  <span
                    key={`status-${event.id}`}
                    className={classes.statusBadge}
                    style={getStatusStyle(event.computed_status || event.status)}
                  >
                    {(event.computed_status || event.status || "").replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                ),
                event.mileage ? `${Number(event.mileage).toLocaleString()} km` : "-",
                event.location || "-",
                event.cost ? `J$${parseFloat(event.cost).toFixed(2)}` : "-",
                (
                  <div key={`actions-${event.id}`} style={{ display: "flex", gap: "6px" }}>
                    {onEditEvent && (
                      <Button
                        style={{
                          padding: "6px 14px",
                          textTransform: "none",
                          fontSize: "12px",
                          borderRadius: "6px",
                          backgroundColor: "#F9FAFB",
                          border: "1px solid #E5E7EB",
                          color: "#374151",
                        }}
                        onClick={() => onEditEvent(event)}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      style={{
                        padding: "6px 14px",
                        textTransform: "none",
                        fontSize: "12px",
                        borderRadius: "6px",
                        backgroundColor: "#F9FAFB",
                        border: "1px solid #E5E7EB",
                        color: "#B91C1C",
                      }}
                      onClick={() => handleDelete(event)}
                    >
                      Delete
                    </Button>
                  </div>
                ),
              ])}
            />
            {totalCost > 0 && (
              <div className={classes.totalCostBar}>
                <span className={classes.totalCostLabel}>Total Service Cost:</span>
                <span className={classes.totalCostValue}>
                  J${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JMD
                </span>
              </div>
            )}
          </>
        )}
      </DialogContent>
      {alert}
    </Dialog>
  );
}
