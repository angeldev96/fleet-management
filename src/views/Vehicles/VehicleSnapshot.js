import React from "react";
import { useParams, useHistory } from "react-router-dom";

// lucide icons
import {
  ArrowLeft,
  BatteryCharging,
  Gauge,
  Droplets,
  Fuel,
  Timer,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";

// hooks
import { useVehicleSnapshot } from "hooks/useVehicleSnapshot";
// utils
import { formatDateTime, formatRelativeTime } from "types/database";

const PIDCard = ({ icon: Icon, label, value, unit, color, noDataText = "--" }) => {
  const hasValue = value !== null && value !== undefined;

  return (
    <Card className="rounded-xl shadow-sm border border-border h-full transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardBody className="p-6 flex flex-col items-center text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ backgroundColor: color }}
        >
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div className="text-sm text-muted-foreground font-medium mb-2">{label}</div>
        {hasValue ? (
          <div className="text-[28px] font-bold text-foreground">
            {typeof value === "number" ? value.toFixed(1) : value}
            <span className="text-sm text-muted-foreground font-medium ml-1">{unit}</span>
          </div>
        ) : (
          <div className="text-muted-foreground text-lg font-medium">{noDataText}</div>
        )}
      </CardBody>
    </Card>
  );
};

export default function VehicleSnapshot() {
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
      <div className="flex items-center justify-center py-20 px-5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="text-center py-16 px-5 text-muted-foreground">
        <p>Error loading vehicle: {error.message}</p>
        <button
          className="mt-4 inline-flex items-center rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          onClick={handleBack}
        >
          Back to Vehicle
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          className="rounded-lg border border-border bg-muted/50 p-2 transition-colors hover:bg-muted"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground m-0">
            {getVehicleDisplayName()} - PID Snapshot
          </h1>
          <div className="text-sm text-muted-foreground mt-1">Last known vehicle diagnostic data</div>
        </div>
        <button
          className="inline-flex items-center rounded-lg bg-muted px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          onClick={() => history.push(`/admin/vehicle/${vehicleId}`)}
        >
          Vehicle Overview
        </button>
        <button
          className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          onClick={refetch}
        >
          <RefreshCw className="mr-2 h-[18px] w-[18px]" />
          Refresh
        </button>
      </div>

      {/* Vehicle Info */}
      {vehicle && (
        <Card className="rounded-xl shadow-sm border border-border mb-6">
          <CardBody className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Plate Number
              </span>
              <span className="text-base text-foreground font-semibold mt-1">
                {vehicle.plate_number || "--"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Make / Model
              </span>
              <span className="text-base text-foreground font-semibold mt-1">
                {vehicle.make || "--"} {vehicle.model || ""}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Year
              </span>
              <span className="text-base text-foreground font-semibold mt-1">
                {vehicle.year || "--"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Driver
              </span>
              <span className="text-base text-foreground font-semibold mt-1">
                {vehicle.driver_name || "--"}
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Timestamp Info */}
      {snapshot?.timestamp && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-6 py-4 mb-6">
          <span className="text-sm text-muted-foreground font-medium">Last Known Reading</span>
          <span className="text-sm text-foreground font-semibold">
            {formatRelativeTime(snapshot.timestamp)} ({formatDateTime(snapshot.timestamp)})
          </span>
        </div>
      )}

      {/* PID Cards */}
      <GridContainer spacing={3}>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={BatteryCharging}
            label="Battery Voltage"
            value={snapshot?.battery_voltage}
            unit="V"
            color="#3B82F6"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Gauge}
            label="Engine RPM"
            value={snapshot?.rpm}
            unit="rpm"
            color="#8B5CF6"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Droplets}
            label="Coolant Temperature"
            value={snapshot?.coolant_temp}
            unit="°C"
            color="#EF4444"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Fuel}
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
            icon={Gauge}
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
