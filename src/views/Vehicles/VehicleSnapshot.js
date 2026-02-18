import React from "react";
import { useParams, useHistory } from "react-router-dom";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import IconButton from "@material-ui/core/IconButton";
// @material-ui/icons
import ArrowBack from "@material-ui/icons/ArrowBack";
import BatteryChargingFull from "@material-ui/icons/BatteryChargingFull";
import Speed from "@material-ui/icons/Speed";
import Opacity from "@material-ui/icons/Opacity";
import LocalGasStation from "@material-ui/icons/LocalGasStation";
import Timer from "@material-ui/icons/Timer";
import TrendingUp from "@material-ui/icons/TrendingUp";
import Refresh from "@material-ui/icons/Refresh";
// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Button from "components/CustomButtons/Button.js";
// hooks
import { useVehicleSnapshot } from "hooks/useVehicleSnapshot";
// utils
import { formatDateTime, formatRelativeTime } from "types/database";

const useStyles = makeStyles(() => ({
  pageHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
    gap: "16px",
  },
  backButton: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    padding: "8px",
    "&:hover": {
      backgroundColor: "#F3F4F6",
    },
  },
  headerContent: {
    flex: 1,
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
    marginTop: "4px",
  },
  refreshButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    padding: "10px 20px",
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    "&:hover": {
      backgroundColor: "#2E3B55",
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "80px 20px",
  },
  snapshotCard: {
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #E5E7EB",
    height: "100%",
    transition: "all 0.2s ease",
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      transform: "translateY(-2px)",
    },
  },
  cardContent: {
    padding: "24px !important",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconContainer: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  cardIcon: {
    fontSize: "32px",
    color: "#FFFFFF",
  },
  cardLabel: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: "8px",
  },
  cardValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1f2937",
  },
  cardUnit: {
    fontSize: "14px",
    color: "#9ca3af",
    fontWeight: "500",
    marginLeft: "4px",
  },
  noData: {
    color: "#9ca3af",
    fontSize: "18px",
    fontWeight: "500",
  },
  timestampCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: "12px",
    padding: "16px 24px",
    marginBottom: "24px",
    border: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  timestampLabel: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500",
  },
  timestampValue: {
    fontSize: "14px",
    color: "#1f2937",
    fontWeight: "600",
  },
  vehicleInfoCard: {
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #E5E7EB",
    marginBottom: "24px",
  },
  vehicleInfoContent: {
    padding: "20px 24px !important",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "16px",
  },
  vehicleInfoItem: {
    display: "flex",
    flexDirection: "column",
  },
  vehicleInfoLabel: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  vehicleInfoValue: {
    fontSize: "16px",
    color: "#1f2937",
    fontWeight: "600",
    marginTop: "4px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    color: "#6b7280",
  },
}));

const PIDCard = ({ icon: Icon, label, value, unit, color, noDataText = "--" }) => {
  const classes = useStyles();
  const hasValue = value !== null && value !== undefined;

  return (
    <Card className={classes.snapshotCard}>
      <CardBody className={classes.cardContent}>
        <div className={classes.iconContainer} style={{ backgroundColor: color }}>
          <Icon className={classes.cardIcon} />
        </div>
        <div className={classes.cardLabel}>{label}</div>
        {hasValue ? (
          <div className={classes.cardValue}>
            {typeof value === "number" ? value.toFixed(1) : value}
            <span className={classes.cardUnit}>{unit}</span>
          </div>
        ) : (
          <div className={classes.noData}>{noDataText}</div>
        )}
      </CardBody>
    </Card>
  );
};

export default function VehicleSnapshot() {
  const classes = useStyles();
  const history = useHistory();
  const { vehicleId } = useParams();

  const handleBack = () => {
    history.push("/admin/vehicles");
  };

  const { snapshot, vehicle, loading, error, refetch } = useVehicleSnapshot(vehicleId);

  const getVehicleDisplayName = () => {
    if (!vehicle) return "Vehicle";
    if (vehicle.name) {
      const match = vehicle.name.match(/\d+/);
      return match ? `Vehicle ${match[0]}` : vehicle.name;
    }
    return `Vehicle ${vehicle.id.slice(0, 8)}`;
  };

  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className={classes.emptyState}>
        <p>Error loading vehicle: {error.message}</p>
        <Button onClick={handleBack}>Back to Vehicle</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className={classes.pageHeader}>
        <IconButton className={classes.backButton} onClick={handleBack}>
          <ArrowBack />
        </IconButton>
        <div className={classes.headerContent}>
          <h1 className={classes.pageTitle}>{getVehicleDisplayName()} - PID Snapshot</h1>
          <div className={classes.pageSubtitle}>Last known vehicle diagnostic data</div>
        </div>
        <Button
          className={classes.refreshButton}
          style={{ backgroundColor: "#F3F4F6", color: "#374151" }}
          onClick={() => history.push(`/admin/vehicle/${vehicleId}`)}
        >
          Vehicle Overview
        </Button>
        <Button className={classes.refreshButton} onClick={refetch}>
          <Refresh style={{ marginRight: "8px", fontSize: "18px" }} />
          Refresh
        </Button>
      </div>

      {/* Vehicle Info */}
      {vehicle && (
        <Card className={classes.vehicleInfoCard}>
          <CardBody className={classes.vehicleInfoContent}>
            <div className={classes.vehicleInfoItem}>
              <span className={classes.vehicleInfoLabel}>Plate Number</span>
              <span className={classes.vehicleInfoValue}>{vehicle.plate_number || "--"}</span>
            </div>
            <div className={classes.vehicleInfoItem}>
              <span className={classes.vehicleInfoLabel}>Make / Model</span>
              <span className={classes.vehicleInfoValue}>
                {vehicle.make || "--"} {vehicle.model || ""}
              </span>
            </div>
            <div className={classes.vehicleInfoItem}>
              <span className={classes.vehicleInfoLabel}>Year</span>
              <span className={classes.vehicleInfoValue}>{vehicle.year || "--"}</span>
            </div>
            <div className={classes.vehicleInfoItem}>
              <span className={classes.vehicleInfoLabel}>Driver</span>
              <span className={classes.vehicleInfoValue}>{vehicle.driver_name || "--"}</span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Timestamp Info */}
      {snapshot?.timestamp && (
        <div className={classes.timestampCard}>
          <span className={classes.timestampLabel}>Last Known Reading</span>
          <span className={classes.timestampValue}>
            {formatRelativeTime(snapshot.timestamp)} ({formatDateTime(snapshot.timestamp)})
          </span>
        </div>
      )}

      {/* PID Cards */}
      <GridContainer spacing={3}>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={BatteryChargingFull}
            label="Battery Voltage"
            value={snapshot?.battery_voltage}
            unit="V"
            color="#3B82F6"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Speed}
            label="Engine RPM"
            value={snapshot?.rpm}
            unit="rpm"
            color="#8B5CF6"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Opacity}
            label="Coolant Temperature"
            value={snapshot?.coolant_temp}
            unit="°C"
            color="#EF4444"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={LocalGasStation}
            label="Fuel Level"
            value={snapshot?.fuel_level}
            unit="%"
            color="#10B981"
          />
        </GridItem>
      </GridContainer>

      {/* Additional Metrics */}
      <GridContainer spacing={3} style={{ marginTop: "8px" }}>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={TrendingUp}
            label="Last Known Speed"
            value={snapshot?.speed}
            unit="km/h"
            color="#F59E0B"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Timer}
            label="Engine Load"
            value={snapshot?.engine_load}
            unit="%"
            color="#6366F1"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={TrendingUp}
            label="Throttle Position"
            value={snapshot?.throttle_position}
            unit="%"
            color="#EC4899"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Speed}
            label="Odometer"
            value={snapshot?.odometer}
            unit="km"
            color="#14B8A6"
          />
        </GridItem>
      </GridContainer>
    </div>
  );
}
