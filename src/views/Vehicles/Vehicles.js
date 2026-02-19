import React, { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { useLocation } from "react-router-dom";

// lucide icons
import {
  AlertTriangle,
  CheckCircle,
  Info,
  PauseCircle,
  Plus,
  Search,
  BarChart3,
  Pencil,
  Loader2,
} from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Table from "components/Table/Table.js";
import Pagination from "components/Pagination/Pagination.js";
import AddVehicleModal from "./AddVehicleModal.js";
import EditVehicleModal from "./EditVehicleModal.js";

// hooks
import { useVehicles } from "hooks/useVehicles";
import { useVehicleAlerts } from "hooks/useEvents";
import { useDebounce } from "hooks/useDebounce";

// utils
import { formatRelativeTime } from "types/database";
import { cn } from "lib/utils";

export default function Vehicles() {
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

  const statusStyles = {
    Alert: "bg-red-500/10 text-red-600",
    Online: "bg-emerald-500/10 text-emerald-600",
    Warning: "bg-amber-500/10 text-amber-600",
    Idle: "bg-amber-500/10 text-amber-600",
    Offline: "bg-muted text-muted-foreground",
  };

  const statusIcons = {
    Alert: AlertTriangle,
    Online: CheckCircle,
    Warning: Info,
    Idle: PauseCircle,
    Offline: Info,
  };

  const getStatusBadge = (status) => {
    const Icon = statusIcons[status];
    return (
      <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles[status])}>
        <Icon className="h-3 w-3" /> {status}
      </div>
    );
  };

  const getBehaviorBadge = (vehicle) => {
    const alerts = vehicleAlerts[vehicle.id];
    const harshCount = alerts?.harshCount || 0;

    let behavior = "Good";
    let classes = "bg-emerald-500/10 text-emerald-600";

    if (harshCount >= 3) {
      behavior = "Poor";
      classes = "bg-red-500/10 text-red-600";
    } else if (harshCount >= 1) {
      behavior = "Fair";
      classes = "bg-amber-500/10 text-amber-600";
    }

    return (
      <div className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-semibold", classes)}>
        {behavior}
      </div>
    );
  };

  const getVehicleDisplayName = (vehicle) => {
    return vehicle.plate_number || vehicle.name || vehicle.id.slice(0, 8);
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 px-5">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 px-5 text-muted-foreground">
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
    <div className="flex flex-col gap-0.5" key={`name-${vehicle.id}`}>
      <span className="font-medium text-foreground text-sm">{getVehicleDisplayName(vehicle)}</span>
      <span className="text-xs text-muted-foreground/70">
        {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
      </span>
    </div>,
    getStatusBadge(getVehicleStatus(vehicle)),
    <span className="text-sm text-muted-foreground">{formatRelativeTime(vehicle.last_seen_at)}</span>,
    <span className="text-sm tabular-nums">{dtcCounts[vehicle.id] || 0}</span>,
    getBehaviorBadge(vehicle),
    <div className="flex items-center gap-1.5" key={`actions-${vehicle.id}`}>
      <button
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
        onClick={() => history.push(`/admin/vehicle/${vehicle.id}`)}
      >
        View
      </button>
      <button
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        onClick={() => history.push(`/admin/vehicle/${vehicle.id}/snapshot`)}
      >
        Snapshot
      </button>
      <button
        className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors inline-flex items-center gap-1"
        onClick={() => handleEditVehicle(vehicle)}
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    </div>,
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground m-0 tracking-[-0.02em]">Vehicles</h1>
          <div className="text-xs text-muted-foreground/70 font-medium mt-0.5">
            {effectiveTotalCount} {effectiveTotalCount === 1 ? "vehicle" : "vehicles"} total
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            className="inline-flex items-center rounded-lg border border-border/60 bg-background px-3 md:px-4 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:bg-muted"
            onClick={() => history.push("/admin/reports")}
          >
            <BarChart3 className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Fleet </span>Report
          </button>
          <button
            className="inline-flex items-center rounded-lg bg-foreground px-3 md:px-4 py-2 text-sm font-medium text-background shadow-sm transition-all duration-150 hover:bg-foreground/90"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center h-10 rounded-xl border border-border/60 bg-background px-4 mb-6 transition-all duration-200 focus-within:border-primary/40 focus-within:ring-[3px] focus-within:ring-primary/10">
        <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground/60" />
        <input
          type="text"
          placeholder="Search by plate number, make, or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      <GridContainer>
        <GridItem xs={12}>
          <Card className="rounded-xl border-border/50">
            <CardBody className="p-5">
              {isIssuesFilter && alertsLoading ? (
                <div className="flex items-center justify-center py-20 px-5">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                </div>
              ) : effectiveTotalCount === 0 && !debouncedSearchTerm ? (
                <div className="text-center py-16 px-5">
                  <div className="text-sm font-semibold text-foreground mb-1.5 tracking-[-0.01em]">
                    {useClientFilter ? "No vehicles match this filter" : "No vehicles found"}
                  </div>
                  <p className="text-sm text-muted-foreground/80 m-0 mb-5">
                    {useClientFilter
                      ? "Try changing filters or clearing search"
                      : "Get started by adding your first vehicle to the fleet"}
                  </p>
                  {!useClientFilter && (
                    <button
                      className="inline-flex items-center cursor-pointer px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                      onClick={() => setAddModalOpen(true)}
                    >
                      <Plus className="mr-1.5 h-4 w-4" />
                      Add your first vehicle
                    </button>
                  )}
                </div>
              ) : displayVehicles.length === 0 && debouncedSearchTerm ? (
                <div className="text-center py-16 px-5">
                  <div className="text-sm font-semibold text-foreground mb-1.5 tracking-[-0.01em]">
                    No vehicles match your search
                  </div>
                  <p className="text-sm text-muted-foreground/80 m-0">
                    Try searching by plate number, make, or model
                  </p>
                </div>
              ) : (
                <>
                  <Table
                    tableHead={["Plate Number", "Status", "Last Seen", "DTCs", "Behavior", "Actions"]}
                    tableData={tableData}
                    customCellClasses={[
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                    ]}
                    customClassesForCells={[0, 1, 2, 3, 4, 5]}
                    customHeadCellClasses={[
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
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
