import React, { useState, useEffect } from "react";

// lucide icons
import { MoreVertical, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Table from "components/Table/Table.js";
import Pagination from "components/Pagination/Pagination.js";
import FilterBar from "components/FilterBar/FilterBar.js";
import SearchBar from "components/SearchBar/SearchBar.js";

// hooks
import { useDrivers } from "hooks/useDrivers";
import { useDebounce } from "hooks/useDebounce";

// utils
import { EVENT_LABELS, SEVERITY_CLASSES, formatRelativeTime } from "types/database";
import { cn } from "lib/utils";

export default function Drivers() {
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
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-10 text-muted-foreground">
        <p>Error loading drivers: {error.message}</p>
      </div>
    );
  }

  const tableData = displayDrivers.map((driver) => [
    driver.id,
    driver.driverName || "Unknown",
    getVehicleDisplayId(driver.vehicleName),
    driver.recentEvent ? (
      <div className="flex flex-col" key={`event-${driver.id}`}>
        <span className="font-medium text-foreground">{getEventLabel(driver.recentEvent.event_type)}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          {formatRelativeTime(driver.recentEvent.event_at)}
          <span className={cn("w-2 h-2 rounded-full inline-block", SEVERITY_CLASSES[driver.recentEvent.severity]?.dot || "bg-gray-400")} />
        </span>
      </div>
    ) : (
      <span className="text-muted-foreground">No recent events</span>
    ),
    <div key={`actions-${driver.id}`} className="flex items-center">
      <button className="m-0 py-1 px-4 text-sm normal-case bg-muted/50 text-primary border border-border rounded-md hover:bg-muted transition-colors">
        View
      </button>
      <MoreVertical className="h-5 w-5 text-muted-foreground ml-2.5 cursor-pointer" />
    </div>,
  ]);

  return (
    <div>
      <GridContainer>
        <GridItem xs={12}>
          <div className="flex items-center mb-8">
            <FilterBar
              filters={["All", "DTCs", "Collisions"].map((f) => ({ label: f, value: f }))}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />

            <select
              id="drivers-time-filter"
              name="time"
              value={time}
              onChange={handleTimeChange}
              className="ml-2.5 h-10 rounded-lg bg-muted px-3 text-sm border-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Now">Now</option>
              <option value="Today">Today</option>
              <option value="Week">This Week</option>
            </select>
          </div>
        </GridItem>

        <GridItem xs={12}>
          <Card>
            <CardBody>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by driver name or vehicle..."
                className="mb-5"
              />

              {totalCount === 0 && !debouncedSearchTerm ? (
                <div className="text-center p-10 text-muted-foreground">
                  <p>No drivers found</p>
                </div>
              ) : drivers.length === 0 && debouncedSearchTerm ? (
                <div className="text-center p-10 text-muted-foreground">
                  <p>No drivers match your search</p>
                </div>
              ) : (
                <>
                  <Table
                    tableHead={["ID", "Driver Name", "Assigned Vehicle", "Recent Events", "Actions"]}
                    tableData={tableData}
                    customCellClasses={[
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-right",
                    ]}
                    customClassesForCells={[0, 1, 2, 3, 4]}
                    customHeadCellClasses={[
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-center",
                      "text-right",
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
