import React, { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { useLocation } from "react-router-dom";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputBase from "@material-ui/core/InputBase";

// @material-ui/icons
import DoubleArrow from "@material-ui/icons/DoubleArrow";
import Warning from "@material-ui/icons/Warning";
import CheckCircle from "@material-ui/icons/CheckCircle";
import Info from "@material-ui/icons/Info";
import PauseCircleOutline from "@material-ui/icons/PauseCircleOutline";
import Add from "@material-ui/icons/Add";
import Search from "@material-ui/icons/Search";
import Assessment from "@material-ui/icons/Assessment";
import Edit from "@material-ui/icons/Edit";
import Image from "@material-ui/icons/Image";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";
import Pagination from "components/Pagination/Pagination.js";
import AddVehicleModal from "./AddVehicleModal.js";
import EditVehicleModal from "./EditVehicleModal.js";

// hooks
import { useVehicles } from "hooks/useVehicles";
import { useVehicleAlerts } from "hooks/useEvents";
import { useDebounce } from "hooks/useDebounce";

// utils
import { formatRelativeTime } from "types/database";

import styles from "assets/jss/material-dashboard-pro-react/views/dashboardStyle.js";

const useStyles = makeStyles(() => ({
  ...styles,
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flex: 1,
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  vehicleCount: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500",
  },
  addButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    "&:hover": {
      backgroundColor: "#2E3B55",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
  },
  reportButton: {
    backgroundColor: "#FFFFFF",
    color: "#3E4D6C",
    padding: "10px 24px",
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    border: "1px solid #3E4D6C",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    marginRight: "12px",
    "&:hover": {
      backgroundColor: "#F8FAFC",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
  },
  searchContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    transition: "all 0.2s ease",
    height: "48px",
    "&:focus-within": {
      borderColor: "#3E4D6C",
      boxShadow: "0 0 0 3px rgba(62, 77, 108, 0.1)",
    },
  },
  searchIcon: {
    color: "#9CA3AF",
    marginRight: "12px",
    fontSize: "22px",
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: "14px",
    color: "#374151",
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    "&::placeholder": {
      color: "#9CA3AF",
      opacity: 1,
    },
  },
  filterContainer: {
    display: "none",
  },
  filterSelect: {
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    padding: "5px 15px",
    border: "1px solid #E0E4E8",
    display: "flex",
    alignItems: "center",
    "&:before": { border: "none" },
    "&:after": { border: "none" },
    "&:hover:not(.Mui-disabled):before": { border: "none" },
  },
  statusBadge: {
    padding: "6px 12px",
    borderRadius: "6px",
    color: "#FFFFFF",
    display: "inline-flex",
    alignItems: "center",
    fontSize: "12px",
    fontWeight: "600",
    width: "fit-content",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    "& svg": {
      fontSize: "16px",
      marginRight: "6px",
    },
  },
  behaviorBadge: {
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    width: "fit-content",
    border: "1px solid transparent",
  },
  tableActionBtn: {
    margin: "0",
    padding: "6px 16px",
    textTransform: "none",
    backgroundColor: "#F9FAFB",
    color: "#3E4D6C",
    border: "1px solid #E5E7EB",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    "&:hover": {
      backgroundColor: "#F3F4F6",
      borderColor: "#D1D5DB",
    },
  },
  actionIcon: {
    marginLeft: "10px",
    color: "#6B7280",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#F3F4F6",
      borderColor: "#D1D5DB",
      color: "#3E4D6C",
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "80px 20px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6b7280",
  },
  emptyStateLink: {
    color: "#3E4D6C",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    marginTop: "16px",
    padding: "8px 16px",
    borderRadius: "8px",
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "#F3F4F6",
      borderColor: "#D1D5DB",
      textDecoration: "none",
    },
  },
  vehicleInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  vehicleName: {
    fontWeight: "600",
    color: "#1f2937",
    fontSize: "14px",
  },
  vehicleDetails: {
    fontSize: "13px",
    color: "#6b7280",
  },
  cardContainer: {
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #E5E7EB",
  },
}));

export default function Vehicles() {
  const classes = useStyles();
  const history = useHistory();
  const location = useLocation();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const listFilter = urlParams.get("filter");
  const isActiveFilter = listFilter === "active";
  const isIssuesFilter = listFilter === "issues";
  const useClientFilter = isActiveFilter || isIssuesFilter;

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch vehicles with server-side pagination and search
  const { vehicles, loading, error, totalCount, refetch } = useVehicles({
    refreshInterval: 30000,
    page,
    pageSize,
    searchTerm: debouncedSearchTerm,
    fetchAll: useClientFilter,
  });

  // Fetch alerts and DTC counts for current vehicles
  const { vehicleAlerts, dtcCounts, loading: alertsLoading } = useVehicleAlerts(
    vehicles.map((v) => v.id)
  );

  const filteredVehicles = useMemo(() => {
    if (!useClientFilter) return vehicles;

    let filtered = vehicles;

    if (isActiveFilter) {
      filtered = filtered.filter((vehicle) => vehicle.status === "online" || vehicle.status === "idle");
    }

    if (isIssuesFilter) {
      filtered = filtered.filter((vehicle) => {
        const alerts = vehicleAlerts[vehicle.id];
        return alerts?.hasCritical || alerts?.hasWarning;
      });
    }

    return filtered;
  }, [vehicles, vehicleAlerts, useClientFilter, isActiveFilter, isIssuesFilter]);

  // Calculate pagination values
  const effectiveTotalCount = useClientFilter ? filteredVehicles.length : totalCount;
  const totalPages = Math.ceil(effectiveTotalCount / pageSize) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  // Reset to page 1 when search term or filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, listFilter]);

  const getVehicleStatus = (vehicle) => {
    const alerts = vehicleAlerts[vehicle.id];
    if (alerts?.hasCritical) return "Alert";
    if (alerts?.hasWarning) return "Warning";
    if (vehicle.status === "offline") return "Offline";
    if (vehicle.status === "idle") return "Idle";
    return "Online";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Alert":
        return (
          <div className={classes.statusBadge} style={{ backgroundColor: "#EF4444" }}>
            <Warning /> Alert
          </div>
        );
      case "Online":
        return (
          <div className={classes.statusBadge} style={{ backgroundColor: "#10B981" }}>
            <CheckCircle /> Online
          </div>
        );
      case "Warning":
        return (
          <div className={classes.statusBadge} style={{ backgroundColor: "#F59E0B" }}>
            <Info /> Warning
          </div>
        );
      case "Idle":
        return (
          <div className={classes.statusBadge} style={{ backgroundColor: "#F59E0B" }}>
            <PauseCircleOutline /> Idle
          </div>
        );
      case "Offline":
        return (
          <div className={classes.statusBadge} style={{ backgroundColor: "#9C27B0" }}>
            <Info /> Offline
          </div>
        );
      default:
        return null;
    }
  };

  const getBehaviorBadge = (vehicle) => {
    const alerts = vehicleAlerts[vehicle.id];
    const harshCount = alerts?.harshCount || 0;

    let behavior = "Good";
    let bgColor = "#ECFDF5";
    let textColor = "#059669";
    let borderColor = "#A7F3D0";

    if (harshCount >= 3) {
      behavior = "Poor";
      bgColor = "#FEF2F2";
      textColor = "#DC2626";
      borderColor = "#FECACA";
    } else if (harshCount >= 1) {
      behavior = "Fair";
      bgColor = "#FFFBEB";
      textColor = "#D97706";
      borderColor = "#FDE68A";
    }

    return (
      <div
        className={classes.behaviorBadge}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          borderColor: borderColor
        }}
      >
        {behavior}
      </div>
    );
  };

  const getVehicleDisplayName = (vehicle) => {
    // Display plate number instead of extracted ID
    return vehicle.plate_number || vehicle.name || vehicle.id.slice(0, 8);
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.emptyState}>
        <p>Error loading vehicles: {error.message}</p>
      </div>
    );
  }

  // Handle edit vehicle
  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setEditModalOpen(true);
  };

  const displayVehicles = useClientFilter
    ? filteredVehicles.slice((page - 1) * pageSize, page * pageSize)
    : vehicles;

  const tableData = displayVehicles.map((vehicle) => [
    <div className={classes.vehicleInfo} key={`name-${vehicle.id}`}>
      <span className={classes.vehicleName}>{getVehicleDisplayName(vehicle)}</span>
      <span className={classes.vehicleDetails}>
        {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
      </span>
    </div>,
    getStatusBadge(getVehicleStatus(vehicle)),
    formatRelativeTime(vehicle.last_seen_at),
    dtcCounts[vehicle.id] || 0,
    getBehaviorBadge(vehicle),
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }} key={`actions-${vehicle.id}`}>
      <Button
        className={classes.tableActionBtn}
        onClick={() => history.push(`/admin/vehicle/${vehicle.id}`)}
      >
        View
      </Button>
      <Button
        className={classes.tableActionBtn}
        onClick={() => history.push(`/admin/vehicle/${vehicle.id}/snapshot`)}
        style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE", color: "#1D4ED8" }}
      >
        <Image style={{ fontSize: "14px", marginRight: "4px" }} />
        Snapshot
      </Button>
      <Button
        className={classes.tableActionBtn}
        onClick={() => handleEditVehicle(vehicle)}
        style={{ backgroundColor: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" }}
      >
        <Edit style={{ fontSize: "14px", marginRight: "4px" }} />
        Edit
      </Button>
      <div className={classes.actionIcon}>
        <DoubleArrow style={{ fontSize: "16px" }} />
      </div>
    </div>,
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className={classes.pageHeader}>
        <div className={classes.headerLeft}>
          <div>
            <h1 className={classes.pageTitle}>Vehicles</h1>
            <div className={classes.vehicleCount}>
              {effectiveTotalCount} {effectiveTotalCount === 1 ? "vehicle" : "vehicles"} total
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Button className={classes.reportButton} onClick={() => history.push("/admin/reports")}>
            <Assessment style={{ marginRight: "8px", fontSize: "20px" }} />
            Generate Fleet Report
          </Button>
          <Button className={classes.addButton} onClick={() => setAddModalOpen(true)}>
            <Add style={{ marginRight: "8px", fontSize: "20px" }} />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className={classes.searchContainer}>
        <Search className={classes.searchIcon} />
        <InputBase
          placeholder="Search by plate number, make, or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={classes.searchInput}
          fullWidth
        />
      </div>

      <GridContainer>
        <GridItem xs={12}>
          <Card className={classes.cardContainer}>
            <CardBody style={{ padding: "24px" }}>
              {isIssuesFilter && alertsLoading ? (
                <div className={classes.loadingContainer}>
                  <CircularProgress />
                </div>
              ) : effectiveTotalCount === 0 && !debouncedSearchTerm ? (
                <div className={classes.emptyState}>
                  <div style={{ fontSize: "16px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                    {useClientFilter ? "No vehicles match this filter" : "No vehicles found"}
                  </div>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 20px 0" }}>
                    {useClientFilter
                      ? "Try changing filters or clearing search"
                      : "Get started by adding your first vehicle to the fleet"}
                  </p>
                  {!useClientFilter && (
                    <div
                      className={classes.emptyStateLink}
                      onClick={() => setAddModalOpen(true)}
                    >
                      <Add style={{ fontSize: "18px", marginRight: "8px" }} />
                      Add your first vehicle
                    </div>
                  )}
                </div>
              ) : displayVehicles.length === 0 && debouncedSearchTerm ? (
                <div className={classes.emptyState}>
                  <div style={{ fontSize: "16px", fontWeight: "500", color: "#374151", marginBottom: "8px" }}>
                    No vehicles match your search
                  </div>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "0" }}>
                    Try searching by plate number, make, or model
                  </p>
                </div>
              ) : (
                <>
                  <Table
                    tableHead={["Plate Number", "Status", "Last Seen", "DTCs", "Behavior", "Actions"]}
                    tableData={tableData}
                    customCellClasses={[
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                    ]}
                    customClassesForCells={[0, 1, 2, 3, 4, 5]}
                    customHeadCellClasses={[
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                    ]}
                    customHeadClassesForCells={[0, 1, 2, 3, 4, 5]}
                  />
                  {/* Pagination */}
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalCount={effectiveTotalCount}
                    totalPages={totalPages}
                    onPageChange={goToPage}
                    onPageSizeChange={handlePageSizeChange}
                    hasNextPage={hasNextPage}
                    hasPrevPage={hasPrevPage}
                  />
                </>
              )}
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      <AddVehicleModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={refetch}
      />

      <EditVehicleModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        onSuccess={refetch}
      />
    </div>
  );
}
