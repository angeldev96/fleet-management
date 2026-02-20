import React, { useState, useEffect } from "react";

// lucide icons
import { Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer";
import GridItem from "components/Grid/GridItem";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import Table from "components/Table/Table";
import Pagination from "components/Pagination/Pagination";
import FilterBar from "components/FilterBar/FilterBar";
import SearchBar from "components/SearchBar/SearchBar";

// hooks
import { useDevices } from "hooks/useDevices";
import { useDebounce } from "hooks/useDebounce";

// components
import EditDeviceModal from "./EditDeviceModal";

// utils
import { formatRelativeTime } from "types/database";
import { cn } from "lib/utils";

export default function Devices() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

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

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm]);

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "online":
        return { badge: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" };
      case "offline":
        return { badge: "bg-amber-50 text-amber-700", dot: "bg-amber-500" };
      case "inactive":
        return { badge: "bg-gray-100 text-muted-foreground", dot: "bg-gray-400" };
      default:
        return { badge: "bg-gray-100 text-muted-foreground", dot: "bg-gray-400" };
    }
  };

  const getStatusLabel = (status: string) => {
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
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 text-muted-foreground">
        <p>Error loading devices: {error.message}</p>
      </div>
    );
  }

  const tableData = displayDevices.map((device) => {
    const statusClasses = getStatusClasses(device.status);
    return [
      device.imei || "N/A",
      <div className="flex flex-col" key={`device-${device.id}`}>
        <span className="font-medium text-foreground">{device.serialNumber || "N/A"}</span>
        <span className="text-xs text-muted-foreground">FW: {device.firmwareVersion || "Unknown"}</span>
      </div>,
      <div className="flex flex-col" key={`vehicle-${device.id}`}>
        <span className="font-medium text-foreground">{device.vehicleName}</span>
        <span className="text-xs text-muted-foreground">
          {device.plateNumber}
          {device.vehicleMake && device.vehicleModel
            ? ` \u2022 ${device.vehicleMake} ${device.vehicleModel}`
            : ""}
        </span>
      </div>,
      <div className="flex flex-col" key={`heartbeat-${device.id}`}>
        <span className="font-medium text-foreground">
          {device.lastHeartbeat ? formatRelativeTime(device.lastHeartbeat) : "Never"}
        </span>
        <span className="text-xs text-muted-foreground">
          {device.createdAt ? `Added ${formatRelativeTime(device.createdAt)}` : ""}
        </span>
      </div>,
      <div
        key={`status-${device.id}`}
        className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium", statusClasses.badge)}
      >
        <span className={cn("w-2.5 h-2.5 rounded-full inline-block", statusClasses.dot)} />
        {getStatusLabel(device.status)}
      </div>,
      <div key={`actions-${device.id}`}>
        <button
          className="m-0 py-1 px-4 text-sm normal-case bg-muted/50 text-primary border border-border rounded-md hover:bg-muted transition-colors"
          onClick={() => {
            setSelectedDevice(device);
            setEditModalOpen(true);
          }}
        >
          Edit
        </button>
      </div>,
    ];
  });

  return (
    <div>
      <GridContainer>
        <GridItem xs={12}>
          <FilterBar
            filters={["All", "Online", "Offline", "Inactive"].map((f) => ({ label: f, value: f }))}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </GridItem>

        <GridItem xs={12}>
          <Card>
            <CardBody>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by IMEI or serial number..."
                className="mb-6"
              />

              {totalCount === 0 && !debouncedSearchTerm ? (
                <div className="text-center p-10 text-muted-foreground">
                  <p>No devices found</p>
                </div>
              ) : devices.length === 0 && debouncedSearchTerm ? (
                <div className="text-center p-10 text-muted-foreground">
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
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-right",
                    ]}
                    customClassesForCells={[0, 1, 2, 3, 4, 5]}
                    customHeadCellClasses={[
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-right",
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
