import React, { useState, useEffect } from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import CircularProgress from "@material-ui/core/CircularProgress";

// @material-ui/icons
import Search from "@material-ui/icons/Search";
import MoreVert from "@material-ui/icons/MoreVert";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";
import CustomInput from "components/CustomInput/CustomInput.js";
import Pagination from "components/Pagination/Pagination.js";

// hooks
import { useDrivers } from "hooks/useDrivers";
import { useDebounce } from "hooks/useDebounce";

// utils
import { EVENT_LABELS, formatRelativeTime } from "types/database";

import styles from "assets/jss/material-dashboard-pro-react/views/dashboardStyle.js";

const useStyles = makeStyles(() => ({
  ...styles,
  searchContainer: {
    backgroundColor: "#F8F9FB",
    borderRadius: "10px",
    padding: "5px 15px",
    display: "flex",
    alignItems: "center",
    marginBottom: "20px",
    border: "1px solid #E0E4E8",
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
  sensitivityBar: {
    display: "flex",
    alignItems: "center",
    "& span": {
      width: "40px",
      height: "4px",
      backgroundColor: "#E0E4E8",
      margin: "0 2px",
      borderRadius: "2px",
    },
    "& .active": {
      backgroundColor: "#3E4D6C",
    },
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
  eventCell: {
    display: "flex",
    flexDirection: "column",
  },
  eventType: {
    fontWeight: "500",
    color: "#333",
  },
  eventTime: {
    fontSize: "12px",
    color: "#999",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  severityDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
  },
}));

export default function Drivers() {
  const classes = useStyles();
  const [activeFilter, setActiveFilter] = useState("All");
  const [time, setTime] = useState("Now");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch drivers with server-side pagination and search
  const { drivers, loading, error, totalCount } = useDrivers({
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

  const handleTimeChange = (event) => {
    setTime(event.target.value);
  };

  const getEventLabel = (eventType) => {
    const labels = {
      harsh_braking: "Harsh Braking",
      harsh_acceleration: "Rapid Acceleration",
      harsh_cornering: "Harsh Cornering",
      overspeed: "Overspeed",
      collision_detected: "Collision",
    };
    return labels[eventType] || EVENT_LABELS[eventType] || eventType;
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#F44336";
      case "warning":
        return "#FB8C00";
      default:
        return "#4CAF50";
    }
  };

  // Client-side filter by event type (this is lightweight filtering on already paginated data)
  const displayDrivers =
    activeFilter === "All"
      ? drivers
      : drivers.filter((driver) => {
          if (!driver.recentEvent) return false;
          if (activeFilter === "DTCs") return driver.recentEvent.event_type === "dtc_detected";
          if (activeFilter === "Collisions")
            return driver.recentEvent.event_type === "collision_detected";
          return true;
        });

  const getVehicleDisplayId = (vehicleName) => {
    // Extract number from vehicle name (e.g., "Vehicle 023" -> "023")
    const match = vehicleName?.match(/\d+/);
    return match ? match[0] : vehicleName?.slice(0, 8) || "N/A";
  };

  if (loading && drivers.length === 0) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className={classes.emptyState}>
        <p>Error loading drivers: {error.message}</p>
      </div>
    );
  }

  const tableData = displayDrivers.map((driver) => [
    driver.id,
    driver.driverName || "Unknown",
    getVehicleDisplayId(driver.vehicleName),
    driver.recentEvent ? (
      <div className={classes.eventCell} key={`event-${driver.id}`}>
        <span className={classes.eventType}>{getEventLabel(driver.recentEvent.event_type)}</span>
        <span className={classes.eventTime}>
          {formatRelativeTime(driver.recentEvent.event_at)}
          <span
            className={classes.severityDot}
            style={{
              backgroundColor: getSeverityColor(driver.recentEvent.severity),
            }}
          />
        </span>
      </div>
    ) : (
      <span style={{ color: "#999" }}>No recent events</span>
    ),
    <div key={`actions-${driver.id}`} style={{ display: "flex", alignItems: "center" }}>
      <Button className={classes.tableActionBtn}>View</Button>
      <MoreVert
        style={{
          color: "#999",
          marginLeft: "10px",
          cursor: "pointer",
        }}
      />
    </div>,
  ]);

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
                activeFilter === "DTCs" ? classes.activeFilter : classes.inactiveFilter
              }`}
              onClick={() => setActiveFilter("DTCs")}
            >
              DTCs
            </Button>
            <Button
              className={`${classes.filterButton} ${
                activeFilter === "Collisions" ? classes.activeFilter : classes.inactiveFilter
              }`}
              onClick={() => setActiveFilter("Collisions")}
            >
              Collisions
            </Button>

            <FormControl className={classes.formControl} style={{ marginLeft: "10px" }}>
              <Select
                id="drivers-time-filter"
                name="time"
                value={time}
                onChange={handleTimeChange}
                className={classes.timeSelect}
                inputProps={{
                  name: "time",
                  id: "drivers-time-filter",
                }}
              >
                <MenuItem value="Now">Now</MenuItem>
                <MenuItem value="Today">Today</MenuItem>
                <MenuItem value="Week">This Week</MenuItem>
              </Select>
            </FormControl>
          </div>
        </GridItem>

        <GridItem xs={12}>
          <Card>
            <CardBody>
              <div className={classes.searchContainer}>
                <Search style={{ color: "#3E4D6C", marginRight: "10px" }} />
                <CustomInput
                  id="driver-search"
                  formControlProps={{
                    fullWidth: true,
                    style: { margin: "0" },
                  }}
                  inputProps={{
                    name: "search",
                    placeholder: "Search by driver name or vehicle...",
                    disableUnderline: true,
                    value: searchTerm,
                    onChange: (e) => setSearchTerm(e.target.value),
                  }}
                />
              </div>

              {totalCount === 0 && !debouncedSearchTerm ? (
                <div className={classes.emptyState}>
                  <p>No drivers found</p>
                </div>
              ) : drivers.length === 0 && debouncedSearchTerm ? (
                <div className={classes.emptyState}>
                  <p>No drivers match your search</p>
                </div>
              ) : (
                <>
                  <Table
                    tableHead={["ID", "Driver Name", "Assigned Vehicle", "Recent Events", "Actions"]}
                    tableData={tableData}
                    customCellClasses={[
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textRight,
                    ]}
                    customClassesForCells={[0, 1, 2, 3, 4]}
                    customHeadCellClasses={[
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textCenter,
                      classes.textRight,
                    ]}
                    customHeadClassesForCells={[0, 1, 2, 3, 4]}
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
    </div>
  );
}
