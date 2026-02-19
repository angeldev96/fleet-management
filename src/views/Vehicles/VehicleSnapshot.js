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

const colorMap = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600" },
  red: { bg: "bg-red-500/10", text: "text-red-600" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600" },
  indigo: { bg: "bg-indigo-500/10", text: "text-indigo-600" },
  pink: { bg: "bg-pink-500/10", text: "text-pink-600" },
  teal: { bg: "bg-teal-500/10", text: "text-teal-600" },
};

const PIDCard = ({ icon: Icon, label, value, unit, color, noDataText = "--" }) => {
  const hasValue = value !== null && value !== undefined;
  const colors = colorMap[color] || colorMap.blue;

  return (
    <Card className="h-full mb-0">
      <CardBody className="p-6 flex flex-col items-center text-center">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${colors.bg}`}>
          <Icon className={`h-7 w-7 ${colors.text}`} />
        </div>
        <div className="text-xs text-muted-foreground/70 font-medium mb-2">{label}</div>
        {hasValue ? (
          <div className="text-2xl font-semibold text-foreground tabular-nums">
            {typeof value === "number" ? value.toFixed(1) : value}
            <span className="text-xs text-muted-foreground/70 font-medium ml-1">{unit}</span>
          </div>
        ) : (
          <div className="text-muted-foreground/60 text-lg font-medium">{noDataText}</div>
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
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="text-center py-16 px-5 text-muted-foreground">
        <p>Error loading vehicle: {error.message}</p>
        <button
          className="mt-4 inline-flex items-center rounded-lg border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
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
          className="rounded-lg border border-border/60 bg-background p-2 transition-colors hover:bg-muted"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground m-0 tracking-[-0.02em]">
            {getVehicleDisplayName()} - PID Snapshot
          </h1>
          <div className="text-xs text-muted-foreground/70 font-medium mt-0.5">Last known vehicle diagnostic data</div>
        </div>
        <button
          className="inline-flex items-center rounded-lg border border-border/60 bg-background px-4 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:bg-muted"
          onClick={() => history.push(`/admin/vehicle/${vehicleId}`)}
        >
          Vehicle Overview
        </button>
        <button
          className="inline-flex items-center rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background shadow-sm transition-all duration-150 hover:bg-foreground/90"
          onClick={refetch}
        >
          <RefreshCw className="mr-1.5 h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Vehicle Info */}
      {vehicle && (
        <Card className="mb-6">
          <CardBody className="px-6 py-5 flex items-center justify-between flex-wrap gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-[0.05em]">
                Plate Number
              </span>
              <span className="text-sm text-foreground font-semibold mt-1">
                {vehicle.plate_number || "--"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-[0.05em]">
                Make / Model
              </span>
              <span className="text-sm text-foreground font-semibold mt-1">
                {vehicle.make || "--"} {vehicle.model || ""}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-[0.05em]">
                Year
              </span>
              <span className="text-sm text-foreground font-semibold mt-1">
                {vehicle.year || "--"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] text-muted-foreground/60 font-medium uppercase tracking-[0.05em]">
                Driver
              </span>
              <span className="text-sm text-foreground font-semibold mt-1">
                {vehicle.driver_name || "--"}
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Timestamp Info */}
      {snapshot?.timestamp && (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-6 py-4 mb-6">
          <span className="text-xs text-muted-foreground/70 font-medium">Last Known Reading</span>
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
            color="blue"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Gauge}
            label="Engine RPM"
            value={snapshot?.rpm}
            unit="rpm"
            color="violet"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Droplets}
            label="Coolant Temperature"
            value={snapshot?.coolant_temp}
            unit="°C"
            color="red"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Fuel}
            label="Fuel Level"
            value={snapshot?.fuel_level}
            unit="%"
            color="emerald"
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
            color="amber"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Timer}
            label="Engine Load"
            value={snapshot?.engine_load}
            unit="%"
            color="indigo"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={TrendingUp}
            label="Throttle Position"
            value={snapshot?.throttle_position}
            unit="%"
            color="pink"
          />
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <PIDCard
            icon={Gauge}
            label="Odometer"
            value={snapshot?.odometer}
            unit="km"
            color="teal"
          />
        </GridItem>
      </GridContainer>
    </div>
  );
}
