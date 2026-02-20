import React, { useMemo, useState, useCallback } from "react";

// lucide icons
import { CalendarDays, Wrench, Clock, AlertTriangle, CheckCircle2, MapPin, User, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer";
import GridItem from "components/Grid/GridItem";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import Button from "components/CustomButtons/Button";
import Table from "components/Table/Table";

// shadcn ui
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "components/ui/alert-dialog";

// hooks & utils
import { useServiceEvents, useServiceStats, deleteServiceEvent } from "hooks/useServiceEvents";
import { cn } from "lib/utils";
import { SERVICE_STATUS_CLASSES } from "types/database";
import NewEventModal from "./NewEventModal";
import EditEventModal from "./EditEventModal";
import ServiceHistoryModal from "./ServiceHistoryModal";
import ExportReportModal from "./ExportReportModal";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ServiceCalendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [activeFilter, setActiveFilter] = useState("All");
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<{ id: string; name: string; plateNumber?: string } | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // AlertDialog states (replacing SweetAlert)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const { events, loading: eventsLoading, refetch: refetchEvents } = useServiceEvents({
    month: currentMonth + 1,
    year: currentYear,
    pageSize: 100,
  });

  const { stats, loading: statsLoading, refetch: refetchStats } = useServiceStats();

  const { events: allEvents, loading: allEventsLoading, refetch: refetchAllEvents } = useServiceEvents({
    pageSize: 50,
  });

  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const emptyCells: { empty: true; day?: undefined; date?: undefined }[] = Array.from({ length: startOffset }, () => ({ empty: true as const }));
    const dayCells: { empty?: undefined; day: number; date: string }[] = Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      date: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`,
    }));
    return [...emptyCells, ...dayCells];
  }, [currentMonth, currentYear]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "All") return events;
    const statusMap = {
      "Pending": "pending",
      "In Progress": "in_progress",
      "Overdue": "overdue",
      "Completed": "completed",
    };
    return events.filter((event) => event.computed_status === statusMap[activeFilter as keyof typeof statusMap]);
  }, [events, activeFilter]);

  const upcomingEvents = useMemo(() => {
    const todayStr = today.toISOString().split("T")[0];
    return allEvents
      .filter((event) => event.computed_status !== "completed" && event.service_date >= todayStr)
      .toSorted((a, b) => a.service_date.localeCompare(b.service_date))
      .slice(0, 6);
  }, [allEvents, today]);

  const getBadgeClass = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "in_progress":
        return "bg-indigo-50 text-indigo-700";
      case "overdue":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pending",
      in_progress: "In Progress",
      completed: "Completed",
      overdue: "Overdue",
    };
    return statusMap[status] || status;
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleNewEventSuccess = () => {
    refetchEvents();
    refetchStats();
    refetchAllEvents();
  };

  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setEditEventModalOpen(true);
  };

  const handleEditSuccess = () => {
    refetchEvents();
    refetchStats();
    refetchAllEvents();
  };

  const handleViewHistory = (event: any) => {
    setSelectedVehicle({
      id: event.vehicle_id,
      name: event.vehicle_name,
      plateNumber: event.plate_number,
    });
    setHistoryModalOpen(true);
  };

  const handleDeleteEvent = useCallback(
    (event: any) => {
      setDeleteTarget(event);
      setDeleteConfirmOpen(true);
    },
    []
  );

  const confirmDeleteEvent = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleteConfirmOpen(false);
    const { error } = await deleteServiceEvent(deleteTarget.id);
    if (error) {
      setErrorMessage(error.message);
      setShowError(true);
    } else {
      setShowSuccess(true);
      refetchEvents();
      refetchStats();
      refetchAllEvents();
    }
    setDeleteTarget(null);
  }, [deleteTarget, refetchEvents, refetchStats, refetchAllEvents]);

  const isToday = (dateStr: string): boolean => {
    return dateStr === today.toISOString().split("T")[0];
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl md:text-2xl font-semibold text-foreground m-0">Service Calendar</h1>
          <p className="text-sm text-muted-foreground m-0">Plan and track scheduled maintenance across your fleet</p>
        </div>
        <div className="flex gap-3">
          <Button
            className="bg-background text-primary px-4 md:px-5 py-2.5 normal-case font-semibold rounded-lg border border-primary shadow-sm hover:bg-muted/50 hover:shadow-md"
            onClick={() => setExportModalOpen(true)}
          >
            Export
          </Button>
          <Button
            className="bg-primary text-primary-foreground px-4 md:px-5 py-2.5 normal-case font-semibold rounded-lg shadow-sm hover:bg-primary/90 hover:shadow-md"
            onClick={() => setNewEventModalOpen(true)}
          >
            New Event
          </Button>
        </div>
      </div>

      <GridContainer className="mb-6" spacing={3}>
        <GridItem xs={12} sm={6} md={3}>
          <Card className="rounded-xl border border-border shadow-sm h-full">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-50">
                <CalendarDays className="h-5 w-5 text-indigo-700" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground m-0">Scheduled This Month</p>
                <p className="text-2xl font-bold text-foreground m-0">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.scheduledThisMonth}
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card className="rounded-xl border border-border shadow-sm h-full">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100">
                <Clock className="h-5 w-5 text-amber-700" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground m-0">Upcoming (7 days)</p>
                <p className="text-2xl font-bold text-foreground m-0">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.upcoming7Days}
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card className="rounded-xl border border-border shadow-sm h-full">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground m-0">Overdue</p>
                <p className="text-2xl font-bold text-foreground m-0">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.overdue}
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card className="rounded-xl border border-border shadow-sm h-full">
            <CardBody className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-700" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm text-muted-foreground m-0">Completed</p>
                <p className="text-2xl font-bold text-foreground m-0">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats.completed}
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      <GridContainer spacing={3}>
        <GridItem xs={12} lg={8}>
          <Card className="rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between px-5 py-[18px] border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-1 text-muted-foreground rounded hover:bg-muted transition-colors"
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-semibold text-foreground m-0">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h3>
                  <button
                    className="p-1 text-muted-foreground rounded hover:bg-muted transition-colors"
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 md:gap-2.5 mt-2">
                  {["All", "Pending", "In Progress", "Overdue", "Completed"].map((filter) => (
                    <Button
                      key={filter}
                      className={cn(
                        "normal-case rounded-full px-3 md:px-4 py-1.5 text-xs font-semibold",
                        activeFilter === filter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            {eventsLoading ? (
              <div className="flex justify-center items-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <div className="grid grid-cols-7 gap-1 md:gap-2 p-2 md:p-4 min-w-[500px] md:min-w-0">
                {WEEKDAYS.map((weekday) => (
                  <div key={weekday} className="text-center text-xs font-semibold text-muted-foreground pb-2">
                    {weekday}
                  </div>
                ))}
                {calendarCells.map((cell, index) => {
                  if (cell.empty) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="border border-dashed border-border rounded-lg md:rounded-[10px] min-h-[60px] md:min-h-[86px] p-1.5 md:p-2.5 bg-muted/50"
                      />
                    );
                  }

                  const dayEvents = filteredEvents.filter((event) => event.service_date === cell.date);
                  const isTodayCell = isToday(cell.date);

                  return (
                    <div
                      key={cell.date}
                      className={cn(
                        "border border-border rounded-lg md:rounded-[10px] min-h-[60px] md:min-h-[86px] p-1.5 md:p-2.5 bg-card flex flex-col gap-1 md:gap-1.5 cursor-pointer hover:bg-muted/50",
                        isTodayCell && "border-primary border-2"
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-semibold text-foreground",
                          isTodayCell &&
                            "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                        )}
                      >
                        {cell.day}
                      </span>
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          key={event.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2 py-1 w-fit cursor-pointer",
                            getBadgeClass(event.computed_status)
                          )}
                          onClick={() => handleViewHistory(event)}
                        >
                          {event.service_type === "repair" ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <Wrench className="h-3 w-3" />
                          )}
                          {event.service_items ? event.service_items.substring(0, 12) + (event.service_items.length > 12 ? "..." : "") : "Service"}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[11px] text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>
            )}
          </Card>
        </GridItem>

        <GridItem xs={12} lg={4}>
          <Card className="rounded-xl border border-border shadow-sm h-full">
            <div className="px-5 py-[18px] border-b border-border">
              <h3 className="text-base font-semibold text-foreground m-0">Upcoming Services</h3>
            </div>
            <div className="px-5 pb-5 pt-2 max-h-[400px] overflow-y-auto">
              {allEventsLoading ? (
                <div className="flex justify-center items-center p-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center p-10 text-muted-foreground">No upcoming services</div>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start justify-between py-4 border-b border-border/50 last:border-b-0">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">{event.vehicle_name}</span>
                      {event.location && (
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                      {event.driver_name && (
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          {event.driver_name}
                        </span>
                      )}
                      <span className="text-[11px] font-semibold rounded-md px-2 py-0.5 bg-muted text-muted-foreground inline-flex items-center w-fit">
                        {event.service_type === "repair" ? (
                          <AlertTriangle className="h-3 w-3 mr-1 inline" />
                        ) : (
                          <Wrench className="h-3 w-3 mr-1 inline" />
                        )}
                        {event.service_items || "Service"}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-foreground">{event.service_date}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </GridItem>
      </GridContainer>

      <Card className="rounded-xl border border-border shadow-sm mt-6">
        <div className="flex items-center justify-between px-5 py-[18px] border-b border-border">
          <h3 className="text-base font-semibold text-foreground m-0">Service Work Orders</h3>
        </div>
        <CardBody>
          {allEventsLoading ? (
            <div className="flex justify-center items-center p-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : allEvents.length === 0 ? (
            <div className="text-center p-10 text-muted-foreground">No service events found</div>
          ) : (
            <Table
              tableHeaderColor="gray"
              hover
              tableHead={[
                "Date",
                "Vehicle",
                "Service",
                "Status",
                "Mileage",
                "Location",
                "Action",
              ]}
              tableData={allEvents.map((event) => [
                event.service_date,
                (
                  <div key={`vehicle-${event.id}`}>
                    <div className="font-semibold text-foreground">{event.vehicle_name}</div>
                    <div className="text-xs text-muted-foreground">{event.plate_number}</div>
                  </div>
                ),
                event.service_items || "-",
                (
                  <span
                    key={`status-${event.id}`}
                    className={cn("inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1", SERVICE_STATUS_CLASSES[event.computed_status as keyof typeof SERVICE_STATUS_CLASSES] || "bg-amber-50 text-amber-700")}
                  >
                    {formatStatus(event.computed_status)}
                  </span>
                ),
                event.mileage ? `${Number(event.mileage).toLocaleString()} km` : "-",
                event.location || "-",
                <div key={`action-${event.id}`} className="flex gap-1.5">
                  <Button
                    className="px-3.5 py-1.5 normal-case text-xs rounded-md bg-muted/50 border border-border text-foreground hover:bg-muted"
                    onClick={() => handleEditEvent(event)}
                  >
                    Edit
                  </Button>
                  <Button
                    className="px-3.5 py-1.5 normal-case text-xs rounded-md bg-muted/50 border border-border text-foreground hover:bg-muted"
                    onClick={() => handleViewHistory(event)}
                  >
                    View
                  </Button>
                  <Button
                    className="px-3.5 py-1.5 normal-case text-xs rounded-md bg-muted/50 border border-border text-red-700 hover:bg-muted"
                    onClick={() => handleDeleteEvent(event)}
                  >
                    Delete
                  </Button>
                </div>,
              ])}
            />
          )}
        </CardBody>
      </Card>

      <NewEventModal
        open={newEventModalOpen}
        onClose={() => setNewEventModalOpen(false)}
        onSuccess={handleNewEventSuccess}
      />

      <EditEventModal
        open={editEventModalOpen}
        onClose={() => {
          setEditEventModalOpen(false);
          setSelectedEvent(null);
        }}
        onSuccess={handleEditSuccess}
        event={selectedEvent}
      />

      {selectedVehicle && (
        <ServiceHistoryModal
          open={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedVehicle(null);
          }}
          vehicleId={selectedVehicle.id}
          vehicleName={selectedVehicle.name}
          plateNumber={selectedVehicle.plateNumber}
          onEditEvent={(event) => {
            setHistoryModalOpen(false);
            setSelectedVehicle(null);
            handleEditEvent(event);
          }}
          onDeleteSuccess={() => {
            refetchEvents();
            refetchStats();
            refetchAllEvents();
          }}
        />
      )}

      <ExportReportModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        fleetEvents={allEvents}
        fleetEventsLoading={allEventsLoading}
      />

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the service event for{" "}
              <strong>{deleteTarget?.vehicle_name}</strong> on {deleteTarget?.service_date}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteEvent}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error AlertDialog */}
      <AlertDialog open={showError} onOpenChange={setShowError}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowError(false)}>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success AlertDialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deleted!</AlertDialogTitle>
            <AlertDialogDescription>The service event has been deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccess(false)}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
