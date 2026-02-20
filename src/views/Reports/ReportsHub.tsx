import React, { useState, useEffect, useCallback, useRef } from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import { BarChart3, Car, TrendingUp, Clock, ArrowRight, Search, X, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer";
import GridItem from "components/Grid/GridItem";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import Button from "components/CustomButtons/Button";

// hooks
import { useVehicles } from "hooks/useVehicles";

// utils
import { formatDateOnly } from "types/database";

export default function ReportsHub() {
  const history = useHistory();
  const searchRef = useRef<HTMLDivElement | null>(null);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);

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

  const handleSelectVehicle = (vehicle: any) => {
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

      const updatedRecent = [newReport, ...existing.filter((r: any) => r.vehicleId !== selectedVehicle.id)].slice(0, 5);
      localStorage.setItem("recentVehicleReports", JSON.stringify(updatedRecent));
      setRecentReports(updatedRecent);

      history.push(`/admin/vehicle/${selectedVehicle.id}/travel-report`);
    }
  }, [selectedVehicle, history]);

  const handleViewRecent = (vehicleId: string) => {
    history.push(`/admin/vehicle/${vehicleId}/travel-report`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return formatDateOnly(date);
  };

  const getVehicleDisplayName = (vehicle: any) => {
    if (vehicle.name) return vehicle.name;
    if (vehicle.make && vehicle.model) return `${vehicle.make} ${vehicle.model}`;
    if (vehicle.make) return vehicle.make;
    return `Vehicle ${vehicle.plate_number}`;
  };

  // Click-away handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground m-0">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-0">Generate and view fleet and vehicle reports</p>
      </div>

      {/* Generate Reports Section */}
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="text-muted-foreground" size={20} />
        Generate Report
      </h2>

      <GridContainer>
        {/* Fleet Summary Report Card */}
        <GridItem xs={12} sm={6} md={4}>
          <Card
            className="cursor-pointer transition-all duration-200 border border-border rounded-xl h-full hover:-translate-y-0.5 hover:shadow-lg hover:border-blue-500"
            onClick={handleFleetReport}
          >
            <CardBody className="p-6 flex flex-col h-full">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-blue-500">
                <BarChart3 size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Fleet Summary Report</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                Overview of your entire fleet including vehicle status, alerts, mileage statistics, and performance metrics.
              </p>
              <div className="flex items-center justify-between">
                <Button className="normal-case font-semibold rounded-lg px-4 py-2 bg-blue-500 text-white hover:bg-blue-600">
                  Generate Report
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        {/* Vehicle Travel Report Card */}
        <GridItem xs={12} sm={6} md={8}>
          <Card className="border border-border rounded-xl">
            <CardBody className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-[10px] bg-emerald-500 flex items-center justify-center">
                  <Car size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground m-0">Vehicle Travel Report</h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5 mb-0">
                    Detailed travel history, route visualization, and statistics for a specific vehicle
                  </p>
                </div>
              </div>

              {/* Search Input with Dropdown */}
              {!selectedVehicle && (
                <div className="relative mb-4" ref={searchRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="text"
                      className="w-full rounded-lg border border-border py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Search by plate number, make, or model..."
                      value={searchInput}
                      onChange={(e) => {
                        setSearchInput(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                    {vehiclesLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" size={20} />
                    )}
                  </div>

                  {/* Dropdown */}
                  {showDropdown && searchInput.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[1000] max-h-[280px] overflow-y-auto mt-1 rounded-lg shadow-[0_4px_20px_rgba(0,0,0,0.15)] bg-white">
                      {vehiclesLoading ? (
                        <div className="flex justify-center p-4">
                          <Loader2 className="animate-spin text-muted-foreground" size={24} />
                        </div>
                      ) : vehicles.length > 0 ? (
                        vehicles.slice(0, 10).map((vehicle) => (
                          <div
                            key={vehicle.id}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-border/50 last:border-b-0 hover:bg-muted/50"
                            onClick={() => handleSelectVehicle(vehicle)}
                          >
                            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Car size={18} className="text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground text-sm">
                                {getVehicleDisplayName(vehicle)}
                              </div>
                              <div className="text-xs text-muted-foreground flex gap-2 flex-wrap">
                                <span className="bg-muted px-1.5 py-0.5 rounded font-medium">
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
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          No vehicles found for &ldquo;{searchInput}&rdquo;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Selected Vehicle Preview */}
              {selectedVehicle && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-4 border border-green-200">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Car size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-emerald-900 text-sm">
                      {getVehicleDisplayName(selectedVehicle)}
                    </div>
                    <div className="text-xs text-emerald-700">
                      {selectedVehicle.plate_number}
                      {selectedVehicle.year && ` \u2022 ${selectedVehicle.year}`}
                      {selectedVehicle.make && selectedVehicle.model &&
                        ` \u2022 ${selectedVehicle.make} ${selectedVehicle.model}`
                      }
                    </div>
                  </div>
                  <X
                    className="cursor-pointer text-muted-foreground hover:text-muted-foreground"
                    size={20}
                    onClick={handleClearSelection}
                  />
                </div>
              )}

              <Button
                className="normal-case font-semibold rounded-lg px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600"
                onClick={handleVehicleReport}
                disabled={!selectedVehicle}
              >
                Generate Report
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      {/* Recent Reports Section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="text-muted-foreground" size={20} />
          Recent Reports
        </h2>

        <Card className="border border-border rounded-xl">
          <CardBody className="p-6">
            {recentReports.length > 0 ? (
              <ul className="list-none p-0 m-0">
                {recentReports.map((report, index) => (
                  <li key={index} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <TrendingUp size={18} className="text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {report.vehicleName} - Travel Report
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {report.plate} &bull; Viewed {formatDate(report.accessedAt)}
                        </span>
                      </div>
                    </div>
                    <Button
                      className="normal-case text-blue-500 font-medium px-3 py-1 hover:bg-blue-50"
                      onClick={() => handleViewRecent(report.vehicleId)}
                    >
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock size={48} className="mx-auto mb-3 opacity-50" />
                <p>No recent reports</p>
                <p className="text-[13px]">
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
