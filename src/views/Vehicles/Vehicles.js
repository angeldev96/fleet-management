import React, { useState, useEffect, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { useLocation } from "react-router-dom";

// lucide icons
import {
  ChevronsRight,
  AlertTriangle,
  CheckCircle,
  Info,
  PauseCircle,
  Plus,
  Search,
  BarChart3,
  Pencil,
  Image,
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

  const getStatusBadge = (status) => {
    const baseClasses = "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white shadow-sm";
    switch (status) {
      case "Alert":
        return (
          <div className={`${baseClasses} bg-red-500`}>
            <AlertTriangle className="h-4 w-4" /> Alert
          </div>
        );
      case "Online":
        return (
          <div className={`${baseClasses} bg-emerald-500`}>
            <CheckCircle className="h-4 w-4" /> Online
          </div>
        );
      case "Warning":
        return (
          <div className={`${baseClasses} bg-amber-500`}>
            <Info className="h-4 w-4" /> Warning
          </div>
        );
      case "Idle":
        return (
          <div className={`${baseClasses} bg-amber-500`}>
            <PauseCircle className="h-4 w-4" /> Idle
          </div>
        );
      case "Offline":
        return (
          <div className={`${baseClasses} bg-purple-600`}>
            <Info className="h-4 w-4" /> Offline
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
    let classes = "bg-emerald-50 text-emerald-600 border-emerald-200";

    if (harshCount >= 3) {
      behavior = "Poor";
      classes = "bg-red-50 text-red-600 border-red-200";
    } else if (harshCount >= 1) {
      behavior = "Fair";
      classes = "bg-amber-50 text-amber-600 border-amber-200";
    }

    return (
      <div className={`inline-block rounded-md border px-3.5 py-1.5 text-xs font-semibold ${classes}`}>
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
      <div className="flex items-center justify-center py-20 px-5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <div className="flex flex-col gap-1" key={`name-${vehicle.id}`}>
      <span className="font-semibold text-foreground text-sm">{getVehicleDisplayName(vehicle)}</span>
      <span className="text-sm text-muted-foreground">
        {vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ""}
      </span>
    </div>,
    getStatusBadge(getVehicleStatus(vehicle)),
    formatRelativeTime(vehicle.last_seen_at),
    dtcCounts[vehicle.id] || 0,
    getBehaviorBadge(vehicle),
    <div className="flex items-center gap-2" key={`actions-${vehicle.id}`}>
      <button
        className="m-0 rounded-md border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-muted hover:border-border"
        onClick={() => history.push(`/admin/vehicle/${vehicle.id}`)}
      >
        View
      </button>
      <button
        className="m-0 rounded-md border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:border-blue-300 inline-flex items-center gap-1"
        onClick={() => history.push(`/admin/vehicle/${vehicle.id}/snapshot`)}
      >
        <Image className="h-3.5 w-3.5" />
        Snapshot
      </button>
      <button
        className="m-0 rounded-md border border-amber-300 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 hover:border-amber-400 inline-flex items-center gap-1"
        onClick={() => handleEditVehicle(vehicle)}
      >
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </button>
      <div className="ml-2.5 flex items-center justify-center rounded-md border border-border bg-muted/50 p-1.5 text-muted-foreground cursor-pointer transition-colors hover:bg-muted hover:border-border hover:text-primary">
        <ChevronsRight className="h-4 w-4" />
      </div>
    </div>,
  ]);

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4 flex-1">
          <div>
            <h1 className="text-2xl font-semibold text-foreground m-0">Vehicles</h1>
            <div className="text-sm text-muted-foreground font-medium">
              {effectiveTotalCount} {effectiveTotalCount === 1 ? "vehicle" : "vehicles"} total
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button
            className="mr-3 inline-flex items-center rounded-lg border border-primary bg-white px-6 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
            onClick={() => history.push("/admin/reports")}
          >
            <BarChart3 className="mr-2 h-5 w-5" />
            Generate Fleet Report
          </button>
          <button
            className="inline-flex items-center rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            onClick={() => setAddModalOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Vehicle
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center h-12 rounded-[10px] border border-border bg-white px-5 mb-6 shadow-sm transition-all focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/10">
        <Search className="mr-3 h-[22px] w-[22px] flex-shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by plate number, make, or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      <GridContainer>
        <GridItem xs={12}>
          <Card className="rounded-xl shadow-sm border border-border">
            <CardBody className="p-6">
              {isIssuesFilter && alertsLoading ? (
                <div className="flex items-center justify-center py-20 px-5">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : effectiveTotalCount === 0 && !debouncedSearchTerm ? (
                <div className="text-center py-16 px-5 text-muted-foreground">
                  <div className="text-base font-medium text-foreground mb-2">
                    {useClientFilter ? "No vehicles match this filter" : "No vehicles found"}
                  </div>
                  <p className="text-sm text-muted-foreground m-0 mb-5">
                    {useClientFilter
                      ? "Try changing filters or clearing search"
                      : "Get started by adding your first vehicle to the fleet"}
                  </p>
                  {!useClientFilter && (
                    <div
                      className="inline-flex items-center cursor-pointer mt-4 px-4 py-2 rounded-lg bg-muted/50 border border-border text-sm font-medium text-primary transition-all hover:bg-muted hover:border-border"
                      onClick={() => setAddModalOpen(true)}
                    >
                      <Plus className="mr-2 h-[18px] w-[18px]" />
                      Add your first vehicle
                    </div>
                  )}
                </div>
              ) : displayVehicles.length === 0 && debouncedSearchTerm ? (
                <div className="text-center py-16 px-5 text-muted-foreground">
                  <div className="text-base font-medium text-foreground mb-2">
                    No vehicles match your search
                  </div>
                  <p className="text-sm text-muted-foreground m-0">
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
