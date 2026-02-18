import React, { useState, useEffect, useCallback, useRef } from "react";
import { useHistory } from "react-router-dom";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";
import InputAdornment from "@material-ui/core/InputAdornment";
import Paper from "@material-ui/core/Paper";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";

// @material-ui/icons
import Assessment from "@material-ui/icons/Assessment";
import DirectionsCar from "@material-ui/icons/DirectionsCar";
import Timeline from "@material-ui/icons/Timeline";
import History from "@material-ui/icons/History";
import ArrowForward from "@material-ui/icons/ArrowForward";
import Search from "@material-ui/icons/Search";
import Clear from "@material-ui/icons/Clear";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Button from "components/CustomButtons/Button.js";

// hooks
import { useVehicles } from "hooks/useVehicles";

// utils
import { formatDateOnly } from "types/database";

const useStyles = makeStyles(() => ({
  pageHeader: {
    marginBottom: "32px",
  },
  pageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "4px 0 0 0",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 16px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  reportCard: {
    cursor: "pointer",
    transition: "all 0.2s ease",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    height: "100%",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)",
      borderColor: "#3B82F6",
    },
  },
  reportCardBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  reportIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
    "& svg": {
      fontSize: "24px",
      color: "#FFFFFF",
    },
  },
  fleetIcon: {
    backgroundColor: "#3B82F6",
  },
  reportTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  reportDescription: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 16px 0",
    flex: 1,
  },
  reportAction: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  generateBtn: {
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    padding: "8px 16px",
  },
  fleetBtn: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#2563EB",
    },
  },
  vehicleBtn: {
    backgroundColor: "#10B981",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#059669",
    },
  },
  vehicleSelectCard: {
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
  },
  vehicleSelectBody: {
    padding: "24px",
  },
  selectHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
  },
  selectIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    backgroundColor: "#10B981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": {
      fontSize: "20px",
      color: "#FFFFFF",
    },
  },
  selectTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  selectSubtitle: {
    fontSize: "13px",
    color: "#6b7280",
    margin: "2px 0 0 0",
  },
  searchContainer: {
    position: "relative",
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
    },
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 1000,
    maxHeight: "280px",
    overflowY: "auto",
    marginTop: "4px",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  },
  vehicleOption: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #F3F4F6",
    "&:hover": {
      backgroundColor: "#F9FAFB",
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },
  vehicleOptionIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: "#F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    "& svg": {
      fontSize: "18px",
      color: "#6b7280",
    },
  },
  vehicleOptionInfo: {
    flex: 1,
    minWidth: 0,
  },
  vehicleOptionName: {
    fontWeight: "500",
    color: "#1f2937",
    fontSize: "14px",
  },
  vehicleOptionMeta: {
    fontSize: "12px",
    color: "#6b7280",
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  vehicleOptionPlate: {
    backgroundColor: "#E5E7EB",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: "500",
  },
  selectedVehiclePreview: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#F0FDF4",
    borderRadius: "8px",
    marginBottom: "16px",
    border: "1px solid #BBF7D0",
  },
  selectedVehicleIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    backgroundColor: "#10B981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": {
      fontSize: "20px",
      color: "#FFFFFF",
    },
  },
  selectedVehicleInfo: {
    flex: 1,
  },
  selectedVehicleName: {
    fontWeight: "600",
    color: "#065F46",
    fontSize: "14px",
  },
  selectedVehicleMeta: {
    fontSize: "12px",
    color: "#047857",
  },
  clearBtn: {
    cursor: "pointer",
    color: "#9CA3AF",
    "&:hover": {
      color: "#6B7280",
    },
  },
  noResults: {
    padding: "16px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "16px",
  },
  recentSection: {
    marginTop: "40px",
  },
  recentCard: {
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
  },
  recentCardBody: {
    padding: "24px",
  },
  recentList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  recentItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #F3F4F6",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  recentInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  recentIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    backgroundColor: "#F3F4F6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    "& svg": {
      fontSize: "18px",
      color: "#6b7280",
    },
  },
  recentText: {
    display: "flex",
    flexDirection: "column",
  },
  recentTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1f2937",
  },
  recentMeta: {
    fontSize: "12px",
    color: "#9CA3AF",
  },
  viewBtn: {
    textTransform: "none",
    color: "#3B82F6",
    fontWeight: "500",
    padding: "4px 12px",
    "&:hover": {
      backgroundColor: "#EFF6FF",
    },
  },
  emptyState: {
    textAlign: "center",
    padding: "32px",
    color: "#9CA3AF",
  },
  emptyIcon: {
    fontSize: "48px",
    marginBottom: "12px",
    opacity: 0.5,
  },
}));

export default function ReportsHub() {
  const classes = useStyles();
  const history = useHistory();
  const searchRef = useRef(null);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [recentReports, setRecentReports] = useState([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch vehicles with search
  const { vehicles, loading: vehiclesLoading } = useVehicles({
    searchTerm: debouncedSearch,
    fetchAll: true,
    refreshInterval: 60000,
  });

  // Load recent reports from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentVehicleReports");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentReports(parsed.slice(0, 5));
      } catch (e) {
        console.error("Error parsing recent reports:", e);
      }
    }
  }, []);

  const handleFleetReport = () => {
    history.push("/admin/reports/fleet");
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setSearchInput("");
    setShowDropdown(false);
  };

  const handleClearSelection = () => {
    setSelectedVehicle(null);
    setSearchInput("");
  };

  const handleVehicleReport = useCallback(() => {
    if (selectedVehicle) {
      const newReport = {
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name || `${selectedVehicle.make} ${selectedVehicle.model}`,
        plate: selectedVehicle.plate_number,
        accessedAt: new Date().toISOString(),
      };

      const stored = localStorage.getItem("recentVehicleReports");
      let existing = [];
      if (stored) {
        try {
          existing = JSON.parse(stored);
        } catch (e) {
          existing = [];
        }
      }

      const updatedRecent = [newReport, ...existing.filter((r) => r.vehicleId !== selectedVehicle.id)].slice(0, 5);
      localStorage.setItem("recentVehicleReports", JSON.stringify(updatedRecent));
      setRecentReports(updatedRecent);

      history.push(`/admin/vehicle/${selectedVehicle.id}/travel-report`);
    }
  }, [selectedVehicle, history]);

  const handleViewRecent = (vehicleId) => {
    history.push(`/admin/vehicle/${vehicleId}/travel-report`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return formatDateOnly(date);
  };

  const getVehicleDisplayName = (vehicle) => {
    if (vehicle.name) return vehicle.name;
    if (vehicle.make && vehicle.model) return `${vehicle.make} ${vehicle.model}`;
    if (vehicle.make) return vehicle.make;
    return `Vehicle ${vehicle.plate_number}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div className={classes.pageHeader}>
        <h1 className={classes.pageTitle}>Reports</h1>
        <p className={classes.pageSubtitle}>Generate and view fleet and vehicle reports</p>
      </div>

      {/* Generate Reports Section */}
      <h2 className={classes.sectionTitle}>
        <Assessment style={{ color: "#6b7280" }} />
        Generate Report
      </h2>

      <GridContainer>
        {/* Fleet Summary Report Card */}
        <GridItem xs={12} sm={6} md={4}>
          <Card className={classes.reportCard} onClick={handleFleetReport}>
            <CardBody className={classes.reportCardBody}>
              <div className={`${classes.reportIcon} ${classes.fleetIcon}`}>
                <Assessment />
              </div>
              <h3 className={classes.reportTitle}>Fleet Summary Report</h3>
              <p className={classes.reportDescription}>
                Overview of your entire fleet including vehicle status, alerts, mileage statistics, and performance metrics.
              </p>
              <div className={classes.reportAction}>
                <Button className={`${classes.generateBtn} ${classes.fleetBtn}`}>
                  Generate Report
                  <ArrowForward style={{ marginLeft: "8px", fontSize: "18px" }} />
                </Button>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        {/* Vehicle Travel Report Card */}
        <GridItem xs={12} sm={6} md={8}>
          <Card className={classes.vehicleSelectCard}>
            <CardBody className={classes.vehicleSelectBody}>
              <div className={classes.selectHeader}>
                <div className={classes.selectIcon}>
                  <DirectionsCar />
                </div>
                <div>
                  <h3 className={classes.selectTitle}>Vehicle Travel Report</h3>
                  <p className={classes.selectSubtitle}>
                    Detailed travel history, route visualization, and statistics for a specific vehicle
                  </p>
                </div>
              </div>

              {/* Search Input with Dropdown */}
              {!selectedVehicle && (
                <ClickAwayListener onClickAway={() => setShowDropdown(false)}>
                  <div className={classes.searchContainer} ref={searchRef}>
                    <TextField
                      className={classes.searchInput}
                      variant="outlined"
                      placeholder="Search by plate number, make, or model..."
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search style={{ color: "#9CA3AF" }} />
                          </InputAdornment>
                        ),
                        endAdornment: vehiclesLoading ? (
                          <InputAdornment position="end">
                            <CircularProgress size={20} />
                          </InputAdornment>
                        ) : null,
                      }}
                    />

                    {/* Dropdown */}
                    {showDropdown && searchInput.length > 0 && (
                      <Paper className={classes.dropdown}>
                        {vehiclesLoading ? (
                          <div className={classes.loadingContainer}>
                            <CircularProgress size={24} />
                          </div>
                        ) : vehicles.length > 0 ? (
                          vehicles.slice(0, 10).map((vehicle) => (
                            <div
                              key={vehicle.id}
                              className={classes.vehicleOption}
                              onClick={() => handleSelectVehicle(vehicle)}
                            >
                              <div className={classes.vehicleOptionIcon}>
                                <DirectionsCar />
                              </div>
                              <div className={classes.vehicleOptionInfo}>
                                <div className={classes.vehicleOptionName}>
                                  {getVehicleDisplayName(vehicle)}
                                </div>
                                <div className={classes.vehicleOptionMeta}>
                                  <span className={classes.vehicleOptionPlate}>
                                    {vehicle.plate_number}
                                  </span>
                                  {vehicle.year && <span>{vehicle.year}</span>}
                                  {vehicle.make && vehicle.model && (
                                    <span>{vehicle.make} {vehicle.model}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className={classes.noResults}>
                            No vehicles found for &ldquo;{searchInput}&rdquo;
                          </div>
                        )}
                      </Paper>
                    )}
                  </div>
                </ClickAwayListener>
              )}

              {/* Selected Vehicle Preview */}
              {selectedVehicle && (
                <div className={classes.selectedVehiclePreview}>
                  <div className={classes.selectedVehicleIcon}>
                    <DirectionsCar />
                  </div>
                  <div className={classes.selectedVehicleInfo}>
                    <div className={classes.selectedVehicleName}>
                      {getVehicleDisplayName(selectedVehicle)}
                    </div>
                    <div className={classes.selectedVehicleMeta}>
                      {selectedVehicle.plate_number}
                      {selectedVehicle.year && ` • ${selectedVehicle.year}`}
                      {selectedVehicle.make && selectedVehicle.model &&
                        ` • ${selectedVehicle.make} ${selectedVehicle.model}`
                      }
                    </div>
                  </div>
                  <Clear
                    className={classes.clearBtn}
                    onClick={handleClearSelection}
                  />
                </div>
              )}

              <Button
                className={`${classes.generateBtn} ${classes.vehicleBtn}`}
                onClick={handleVehicleReport}
                disabled={!selectedVehicle}
              >
                Generate Report
                <ArrowForward style={{ marginLeft: "8px", fontSize: "18px" }} />
              </Button>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      {/* Recent Reports Section */}
      <div className={classes.recentSection}>
        <h2 className={classes.sectionTitle}>
          <History style={{ color: "#6b7280" }} />
          Recent Reports
        </h2>

        <Card className={classes.recentCard}>
          <CardBody className={classes.recentCardBody}>
            {recentReports.length > 0 ? (
              <ul className={classes.recentList}>
                {recentReports.map((report, index) => (
                  <li key={index} className={classes.recentItem}>
                    <div className={classes.recentInfo}>
                      <div className={classes.recentIcon}>
                        <Timeline />
                      </div>
                      <div className={classes.recentText}>
                        <span className={classes.recentTitle}>
                          {report.vehicleName} - Travel Report
                        </span>
                        <span className={classes.recentMeta}>
                          {report.plate} • Viewed {formatDate(report.accessedAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      className={classes.viewBtn}
                      onClick={() => handleViewRecent(report.vehicleId)}
                    >
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={classes.emptyState}>
                <History className={classes.emptyIcon} />
                <p>No recent reports</p>
                <p style={{ fontSize: "13px" }}>
                  Reports you generate will appear here for quick access
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
