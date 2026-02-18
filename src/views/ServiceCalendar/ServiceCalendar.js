import React, { useMemo, useState, useCallback } from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import CircularProgress from "@material-ui/core/CircularProgress";

// @material-ui/icons
import EventNote from "@material-ui/icons/EventNote";
import Build from "@material-ui/icons/Build";
import Schedule from "@material-ui/icons/Schedule";
import Warning from "@material-ui/icons/Warning";
import CheckCircle from "@material-ui/icons/CheckCircle";
import Room from "@material-ui/icons/Room";
import Person from "@material-ui/icons/Person";
import ChevronLeft from "@material-ui/icons/ChevronLeft";
import ChevronRight from "@material-ui/icons/ChevronRight";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Button from "components/CustomButtons/Button.js";
import Table from "components/Table/Table.js";

// hooks & utils
import { useServiceEvents, useServiceStats, deleteServiceEvent } from "hooks/useServiceEvents";
import SweetAlert from "react-bootstrap-sweetalert";
import { SERVICE_STATUS_COLORS } from "types/database";
import NewEventModal from "./NewEventModal";
import EditEventModal from "./EditEventModal";
import ServiceHistoryModal from "./ServiceHistoryModal";
import ExportReportModal from "./ExportReportModal";

import styles from "assets/jss/material-dashboard-pro-react/views/dashboardStyle.js";

const useStyles = makeStyles(() => ({
  ...styles,
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
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
    margin: 0,
  },
  headerActions: {
    display: "flex",
    gap: "12px",
  },
  primaryButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    padding: "10px 20px",
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    "&:hover": {
      backgroundColor: "#2E3B55",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    color: "#3E4D6C",
    padding: "10px 20px",
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    border: "1px solid #3E4D6C",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    "&:hover": {
      backgroundColor: "#F8FAFC",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.08)",
    },
  },
  statsGrid: {
    marginBottom: "24px",
  },
  statCard: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
    height: "100%",
  },
  statCardBody: {
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statLabel: {
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
  },
  statValue: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  calendarCard: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
  },
  calendarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 20px",
    borderBottom: "1px solid #E5E7EB",
  },
  calendarTitleContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  calendarTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  navButton: {
    padding: "4px",
    color: "#6b7280",
    "&:hover": {
      backgroundColor: "#F3F4F6",
    },
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
    padding: "16px",
  },
  weekdayLabel: {
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "600",
    color: "#6b7280",
    paddingBottom: "8px",
  },
  dayCell: {
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    minHeight: "86px",
    padding: "10px",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#F9FAFB",
    },
  },
  dayCellEmpty: {
    backgroundColor: "#F9FAFB",
    borderStyle: "dashed",
    cursor: "default",
    "&:hover": {
      backgroundColor: "#F9FAFB",
    },
  },
  dayCellToday: {
    borderColor: "#3E4D6C",
    borderWidth: "2px",
  },
  dayNumber: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  dayNumberToday: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  eventBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "600",
    borderRadius: "999px",
    padding: "4px 8px",
    width: "fit-content",
    cursor: "pointer",
  },
  badgePending: {
    backgroundColor: "#FEF3C7",
    color: "#B45309",
  },
  badgeInProgress: {
    backgroundColor: "#EEF2FF",
    color: "#4338CA",
  },
  badgeOverdue: {
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
  },
  badgeCompleted: {
    backgroundColor: "#DCFCE7",
    color: "#15803D",
  },
  listCard: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
    height: "100%",
  },
  listHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #E5E7EB",
  },
  listTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  listBody: {
    padding: "8px 20px 20px",
    maxHeight: "400px",
    overflowY: "auto",
  },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "16px 0",
    borderBottom: "1px solid #F3F4F6",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  listLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  listVehicle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
  },
  listMeta: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#6b7280",
  },
  listTag: {
    fontSize: "11px",
    fontWeight: "600",
    borderRadius: "6px",
    padding: "2px 8px",
    backgroundColor: "#F3F4F6",
    color: "#4B5563",
  },
  listDate: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "8px",
  },
  filterButton: {
    textTransform: "none",
    borderRadius: "999px",
    padding: "6px 16px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#E5E7EB",
    color: "#374151",
    "&:hover": {
      backgroundColor: "#D1D5DB",
    },
  },
  filterActive: {
    backgroundColor: "#3E4D6C !important",
    color: "#FFFFFF !important",
  },
  tableCard: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
    marginTop: "24px",
  },
  tableHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tableTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: "600",
    borderRadius: "999px",
    padding: "4px 10px",
  },
  actionButton: {
    padding: "6px 14px",
    textTransform: "none",
    fontSize: "12px",
    borderRadius: "6px",
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    color: "#374151",
    "&:hover": {
      backgroundColor: "#F3F4F6",
    },
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "#6B7280",
  },
}));

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ServiceCalendar() {
  const classes = useStyles();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [activeFilter, setActiveFilter] = useState("All");
  const [newEventModalOpen, setNewEventModalOpen] = useState(false);
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);

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

    const emptyCells = Array.from({ length: startOffset }, () => ({ empty: true }));
    const dayCells = Array.from({ length: daysInMonth }, (_, index) => ({
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
    return events.filter((event) => event.computed_status === statusMap[activeFilter]);
  }, [events, activeFilter]);

  const upcomingEvents = useMemo(() => {
    const todayStr = today.toISOString().split("T")[0];
    return allEvents
      .filter((event) => event.computed_status !== "completed" && event.service_date >= todayStr)
      .sort((a, b) => a.service_date.localeCompare(b.service_date))
      .slice(0, 6);
  }, [allEvents, today]);

  const getBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return classes.badgePending;
      case "in_progress":
        return classes.badgeInProgress;
      case "overdue":
        return classes.badgeOverdue;
      case "completed":
        return classes.badgeCompleted;
      default:
        return classes.badgePending;
    }
  };

  const getStatusStyle = (status) => {
    const colors = SERVICE_STATUS_COLORS[status] || SERVICE_STATUS_COLORS.pending;
    return {
      backgroundColor: colors.bg,
      color: colors.text,
    };
  };

  const formatStatus = (status) => {
    const statusMap = {
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

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setEditEventModalOpen(true);
  };

  const handleEditSuccess = () => {
    refetchEvents();
    refetchStats();
    refetchAllEvents();
  };

  const handleViewHistory = (event) => {
    setSelectedVehicle({
      id: event.vehicle_id,
      name: event.vehicle_name,
      plateNumber: event.plate_number,
    });
    setHistoryModalOpen(true);
  };

  const handleDeleteEvent = useCallback(
    (event) => {
      setAlert(
        <SweetAlert
          warning
          showCancel
          title="Delete Service Event?"
          onConfirm={async () => {
            setAlert(null);
            const { error } = await deleteServiceEvent(event.id);
            if (error) {
              setAlert(
                <SweetAlert
                  error
                  title="Error"
                  onConfirm={() => setAlert(null)}
                  confirmBtnText="Close"
                  focusCancelBtn={false}
                  focusConfirmBtn={false}
                >
                  {error.message}
                </SweetAlert>
              );
            } else {
              setAlert(
                <SweetAlert
                  success
                  title="Deleted!"
                  onConfirm={() => setAlert(null)}
                  confirmBtnText="Continue"
                  focusCancelBtn={false}
                  focusConfirmBtn={false}
                >
                  The service event has been deleted.
                </SweetAlert>
              );
              refetchEvents();
              refetchStats();
              refetchAllEvents();
            }
          }}
          onCancel={() => setAlert(null)}
          confirmBtnText="Delete"
          cancelBtnText="Cancel"
          focusCancelBtn={false}
          focusConfirmBtn={false}
        >
          This will permanently delete the service event for{" "}
          <strong>{event.vehicle_name}</strong> on {event.service_date}. This action cannot be
          undone.
        </SweetAlert>
      );
    },
    [refetchEvents, refetchStats, refetchAllEvents]
  );

  const isToday = (dateStr) => {
    return dateStr === today.toISOString().split("T")[0];
  };

  return (
    <div>
      <div className={classes.pageHeader}>
        <div className={classes.headerLeft}>
          <h1 className={classes.pageTitle}>Service Calendar</h1>
          <p className={classes.pageSubtitle}>Plan and track scheduled maintenance across your fleet</p>
        </div>
        <div className={classes.headerActions}>
          <Button className={classes.secondaryButton} onClick={() => setExportModalOpen(true)}>
            Export Report
          </Button>
          <Button className={classes.primaryButton} onClick={() => setNewEventModalOpen(true)}>
            New Event
          </Button>
        </div>
      </div>

      <GridContainer className={classes.statsGrid} spacing={3}>
        <GridItem xs={12} sm={6} md={3}>
          <Card className={classes.statCard}>
            <CardBody className={classes.statCardBody}>
              <div className={classes.statIcon} style={{ backgroundColor: "#EEF2FF" }}>
                <EventNote style={{ color: "#4338CA" }} />
              </div>
              <div className={classes.statContent}>
                <p className={classes.statLabel}>Scheduled This Month</p>
                <p className={classes.statValue}>
                  {statsLoading ? <CircularProgress size={20} /> : stats.scheduledThisMonth}
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card className={classes.statCard}>
            <CardBody className={classes.statCardBody}>
              <div className={classes.statIcon} style={{ backgroundColor: "#FEF3C7" }}>
                <Schedule style={{ color: "#B45309" }} />
              </div>
              <div className={classes.statContent}>
                <p className={classes.statLabel}>Upcoming (7 days)</p>
                <p className={classes.statValue}>
                  {statsLoading ? <CircularProgress size={20} /> : stats.upcoming7Days}
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card className={classes.statCard}>
            <CardBody className={classes.statCardBody}>
              <div className={classes.statIcon} style={{ backgroundColor: "#FEE2E2" }}>
                <Warning style={{ color: "#B91C1C" }} />
              </div>
              <div className={classes.statContent}>
                <p className={classes.statLabel}>Overdue</p>
                <p className={classes.statValue}>
                  {statsLoading ? <CircularProgress size={20} /> : stats.overdue}
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card className={classes.statCard}>
            <CardBody className={classes.statCardBody}>
              <div className={classes.statIcon} style={{ backgroundColor: "#DCFCE7" }}>
                <CheckCircle style={{ color: "#15803D" }} />
              </div>
              <div className={classes.statContent}>
                <p className={classes.statLabel}>Completed</p>
                <p className={classes.statValue}>
                  {statsLoading ? <CircularProgress size={20} /> : stats.completed}
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      <GridContainer spacing={3}>
        <GridItem xs={12} lg={8}>
          <Card className={classes.calendarCard}>
            <div className={classes.calendarHeader}>
              <div>
                <div className={classes.calendarTitleContainer}>
                  <IconButton className={classes.navButton} onClick={handlePrevMonth}>
                    <ChevronLeft />
                  </IconButton>
                  <h3 className={classes.calendarTitle}>
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h3>
                  <IconButton className={classes.navButton} onClick={handleNextMonth}>
                    <ChevronRight />
                  </IconButton>
                </div>
                <div className={classes.filterBar}>
                  {["All", "Pending", "In Progress", "Overdue", "Completed"].map((filter) => (
                    <Button
                      key={filter}
                      className={`${classes.filterButton} ${
                        activeFilter === filter ? classes.filterActive : ""
                      }`}
                      onClick={() => setActiveFilter(filter)}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            {eventsLoading ? (
              <div className={classes.loadingContainer}>
                <CircularProgress />
              </div>
            ) : (
              <div className={classes.calendarGrid}>
                {WEEKDAYS.map((weekday) => (
                  <div key={weekday} className={classes.weekdayLabel}>
                    {weekday}
                  </div>
                ))}
                {calendarCells.map((cell, index) => {
                  if (cell.empty) {
                    return <div key={`empty-${index}`} className={`${classes.dayCell} ${classes.dayCellEmpty}`} />;
                  }

                  const dayEvents = filteredEvents.filter((event) => event.service_date === cell.date);
                  const isTodayCell = isToday(cell.date);

                  return (
                    <div
                      key={cell.date}
                      className={`${classes.dayCell} ${isTodayCell ? classes.dayCellToday : ""}`}
                    >
                      <span className={isTodayCell ? classes.dayNumberToday : classes.dayNumber}>
                        {cell.day}
                      </span>
                      {dayEvents.slice(0, 2).map((event) => (
                        <span
                          key={event.id}
                          className={`${classes.eventBadge} ${getBadgeClass(event.computed_status)}`}
                          onClick={() => handleViewHistory(event)}
                        >
                          {event.service_type === "repair" ? (
                            <Warning style={{ fontSize: "13px" }} />
                          ) : (
                            <Build style={{ fontSize: "13px" }} />
                          )}
                          {event.service_items ? event.service_items.substring(0, 12) + (event.service_items.length > 12 ? "..." : "") : "Service"}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span style={{ fontSize: "11px", color: "#6B7280" }}>
                          +{dayEvents.length - 2} more
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </GridItem>

        <GridItem xs={12} lg={4}>
          <Card className={classes.listCard}>
            <div className={classes.listHeader}>
              <h3 className={classes.listTitle}>Upcoming Services</h3>
            </div>
            <div className={classes.listBody}>
              {allEventsLoading ? (
                <div className={classes.loadingContainer}>
                  <CircularProgress />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className={classes.emptyState}>No upcoming services</div>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className={classes.listItem}>
                    <div className={classes.listLeft}>
                      <span className={classes.listVehicle}>{event.vehicle_name}</span>
                      {event.location && (
                        <span className={classes.listMeta}>
                          <Room style={{ fontSize: "14px" }} />
                          {event.location}
                        </span>
                      )}
                      {event.driver_name && (
                        <span className={classes.listMeta}>
                          <Person style={{ fontSize: "14px" }} />
                          {event.driver_name}
                        </span>
                      )}
                      <span className={classes.listTag}>
                        {event.service_type === "repair" ? (
                          <Warning style={{ fontSize: "12px", marginRight: "4px", verticalAlign: "middle" }} />
                        ) : (
                          <Build style={{ fontSize: "12px", marginRight: "4px", verticalAlign: "middle" }} />
                        )}
                        {event.service_items || "Service"}
                      </span>
                    </div>
                    <div className={classes.listDate}>{event.service_date}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </GridItem>
      </GridContainer>

      <Card className={classes.tableCard}>
        <div className={classes.tableHeader}>
          <h3 className={classes.tableTitle}>Service Work Orders</h3>
        </div>
        <CardBody>
          {allEventsLoading ? (
            <div className={classes.loadingContainer}>
              <CircularProgress />
            </div>
          ) : allEvents.length === 0 ? (
            <div className={classes.emptyState}>No service events found</div>
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
                    <div style={{ fontWeight: 600, color: "#1f2937" }}>{event.vehicle_name}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280" }}>{event.plate_number}</div>
                  </div>
                ),
                event.service_items || "-",
                (
                  <span
                    key={`status-${event.id}`}
                    className={classes.statusBadge}
                    style={getStatusStyle(event.computed_status)}
                  >
                    {formatStatus(event.computed_status)}
                  </span>
                ),
                event.mileage ? `${Number(event.mileage).toLocaleString()} km` : "-",
                event.location || "-",
                <div key={`action-${event.id}`} style={{ display: "flex", gap: "6px" }}>
                  <Button
                    className={classes.actionButton}
                    onClick={() => handleEditEvent(event)}
                  >
                    Edit
                  </Button>
                  <Button
                    className={classes.actionButton}
                    onClick={() => handleViewHistory(event)}
                  >
                    View
                  </Button>
                  <Button
                    className={classes.actionButton}
                    style={{ color: "#B91C1C" }}
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

      {alert}
    </div>
  );
}
