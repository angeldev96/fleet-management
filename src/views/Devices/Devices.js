import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputBase from "@material-ui/core/InputBase";

// @material-ui/icons
import Search from "@material-ui/icons/Search";
import FiberManualRecord from "@material-ui/icons/FiberManualRecord";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";
import Pagination from "components/Pagination/Pagination.js";

// hooks
import { useDevices } from "hooks/useDevices";
import { useDebounce } from "hooks/useDebounce";

// components
import EditDeviceModal from "./EditDeviceModal";

// utils
import { formatRelativeTime } from "types/database";

import styles from "assets/jss/material-dashboard-pro-react/views/dashboardStyle.js";

const useStyles = makeStyles(() => ({
  ...styles,
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
  filterButton: {
    marginRight: "10px",
    textTransform: "none",
    fontWeight: "500",
    padding: "8px 20px",
    borderRadius: "8px",
  },
  activeFilter: {
    backgroundColor: "#3E4D6C !important",
    color: "#FFFFFF !important",
  },
  inactiveFilter: {
    backgroundColor: "#E0E4E8 !important",
    color: "#3E4D6C !important",
  },
  timeSelect: {
    backgroundColor: "#E0E4E8",
    borderRadius: "8px",
    padding: "2px 10px",
    "&:before": { border: "none" },
    "&:after": { border: "none" },
    "&:hover:not(.Mui-disabled):before": { border: "none" },
  },
  tableActionBtn: {
    margin: "0",
    padding: "5px 15px",
    textTransform: "none",
    backgroundColor: "#F8F9FB",
    color: "#3E4D6C",
    border: "1px solid #E0E4E8",
    "&:hover": {
      backgroundColor: "#E0E4E8",
    },
  },
  footerNote: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#999",
    fontSize: "12px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#999",
  },
  deviceCell: {
    display: "flex",
    flexDirection: "column",
  },
  deviceMain: {
    fontWeight: "500",
    color: "#333",
  },
  deviceSub: {
    fontSize: "12px",
    color: "#999",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    fontWeight: "500",
    gap: "6px",
  },
  statusIcon: {
    fontSize: "10px",
  },
}));

export default function Devices() {
  const classes = useStyles();
  const history = useHistory();
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch devices with server-side pagination and search
  const { devices, loading, error, totalCount, refetch } = useDevices({
    refreshInterval: 30000,
    page,
    pageSize,
    searchTerm: debouncedSearchTerm,
  });

  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1);
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return { bg: "#D1FAE5", color: "#065F46", icon: "#10B981" };
      case "offline":
        return { bg: "#FEF3C7", color: "#92400E", icon: "#F59E0B" };
      case "inactive":
        return { bg: "#F3F4F6", color: "#4B5563", icon: "#9CA3AF" };
      default:
        return { bg: "#F3F4F6", color: "#4B5563", icon: "#9CA3AF" };
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "online":
        return "Online";
      case "offline":
        return "Offline";
      case "inactive":
        return "Inactive";
      default:
        return "Unknown";
    }
  };

  // Client-side filter by status (this is lightweight filtering on already paginated data)
  const displayDevices =
    activeFilter === "All"
      ? devices
      : devices.filter((device) => {
          if (activeFilter === "Online") return device.status === "online";
          if (activeFilter === "Offline") return device.status === "offline";
          if (activeFilter === "Inactive") return device.status === "inactive";
          return true;
        });

  if (loading && devices.length === 0) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.emptyState}>
        <p>Error loading devices: {error.message}</p>
      </div>
    );
  }

  const tableData = displayDevices.map((device) => {
    const statusColors = getStatusColor(device.status);
    return [
      device.imei || "N/A",
      <div className={classes.deviceCell} key={`device-${device.id}`}>
        <span className={classes.deviceMain}>{device.serialNumber || "N/A"}</span>
        <span className={classes.deviceSub}>FW: {device.firmwareVersion || "Unknown"}</span>
      </div>,
      <div className={classes.deviceCell} key={`vehicle-${device.id}`}>
        <span className={classes.deviceMain}>{device.vehicleName}</span>
        <span className={classes.deviceSub}>
          {device.plateNumber}
          {device.vehicleMake && device.vehicleModel
            ? ` • ${device.vehicleMake} ${device.vehicleModel}`
            : ""}
        </span>
      </div>,
      <div className={classes.deviceCell} key={`heartbeat-${device.id}`}>
        <span className={classes.deviceMain}>
          {device.lastHeartbeat ? formatRelativeTime(device.lastHeartbeat) : "Never"}
        </span>
        <span className={classes.deviceSub}>
          {device.createdAt ? `Added ${formatRelativeTime(device.createdAt)}` : ""}
        </span>
      </div>,
      <div
        key={`status-${device.id}`}
        className={classes.statusBadge}
        style={{
          backgroundColor: statusColors.bg,
          color: statusColors.color,
        }}
      >
        <FiberManualRecord
          className={classes.statusIcon}
          style={{ color: statusColors.icon }}
        />
        {getStatusLabel(device.status)}
      </div>,
      <div key={`actions-${device.id}`}>
        <Button
          className={classes.tableActionBtn}
          onClick={() => {
            setSelectedDevice(device);
            setEditModalOpen(true);
          }}
        >
          Edit
        </Button>
      </div>,
    ];
  });

  return (
    <div>
      <GridContainer>
        <GridItem xs={12}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <Button
              className={`${classes.filterButton} ${
                activeFilter === "All" ? classes.activeFilter : classes.inactiveFilter
              }`}
              onClick={() => setActiveFilter("All")}
            >
              All
            </Button>
            <Button
              className={`${classes.filterButton} ${
                activeFilter === "Online" ? classes.activeFilter : classes.inactiveFilter
              }`}
              onClick={() => setActiveFilter("Online")}
            >
              Online
            </Button>
            <Button
              className={`${classes.filterButton} ${
                activeFilter === "Offline" ? classes.activeFilter : classes.inactiveFilter
              }`}
              onClick={() => setActiveFilter("Offline")}
            >
              Offline
            </Button>
            <Button
              className={`${classes.filterButton} ${
                activeFilter === "Inactive" ? classes.activeFilter : classes.inactiveFilter
              }`}
              onClick={() => setActiveFilter("Inactive")}
            >
              Inactive
            </Button>
          </div>
        </GridItem>

        <GridItem xs={12}>
          <Card>
            <CardBody>
              <div className={classes.searchContainer}>
                <Search className={classes.searchIcon} />
                <InputBase
                  placeholder="Search by IMEI or serial number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={classes.searchInput}
                  fullWidth
                />
              </div>

              {totalCount === 0 && !debouncedSearchTerm ? (
                <div className={classes.emptyState}>
                  <p>No devices found</p>
                </div>
              ) : devices.length === 0 && debouncedSearchTerm ? (
                <div className={classes.emptyState}>
                  <p>No devices match your search</p>
                </div>
              ) : (
                <>
                  <Table
                    tableHead={[
                      "IMEI",
                      "Serial Number",
                      "Assigned Vehicle",
                      "Last Heartbeat",
                      "Status",
                      "Actions",
                    ]}
                    tableData={tableData}
                    customCellClasses={[
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textRight,
                    ]}
                    customClassesForCells={[0, 1, 2, 3, 4, 5]}
                    customHeadCellClasses={[
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textRight,
                    ]}
                    customHeadClassesForCells={[0, 1, 2, 3, 4, 5]}
                  />

                  {/* Pagination */}
                  <Pagination
                    page={page}
                    pageSize={pageSize}
                    totalCount={totalCount}
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

      <EditDeviceModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedDevice(null);
        }}
        device={selectedDevice}
        onSuccess={refetch}
      />
    </div>
  );
}
