# Service Calendar — User Guide

The Service Calendar lets you schedule, track, and export maintenance events for every vehicle in your fleet.

---

## Getting There

From the sidebar, click **Service Calendar**.

---

## Dashboard Overview

At the top you will find four stat cards that update in real-time:

| Card | What it shows |
|---|---|
| **Scheduled This Month** | Total events scheduled in the current calendar month |
| **Upcoming (7 days)** | Non-completed events within the next 7 days |
| **Overdue** | Events whose service date has passed without being completed |
| **Completed** | Total events marked as completed |

---

## Calendar View

The calendar displays all service events for the selected month.

- Use the **left/right arrows** next to the month name to navigate between months.
- Each day cell shows up to two event badges. If there are more, a "+N more" label appears.
- Badge **colors** indicate status:
  - **Yellow** — Pending
  - **Purple** — In Progress
  - **Red** — Overdue
  - **Green** — Completed
- Badge **icons** indicate the type of service:
  - **Wrench** — Scheduled Maintenance
  - **Warning triangle** — Repair / Incident

### Filtering

Below the month name there is a filter bar with the options: **All**, **Pending**, **In Progress**, **Overdue**, and **Completed**. Click any filter to show only events with that status on the calendar.

---

## Upcoming Services Panel

On the right side of the calendar you will find the **Upcoming Services** list. It shows the next 6 non-completed events sorted by date, including:

- Vehicle name
- Location (if provided)
- Assigned driver
- Service description

---

## Creating a New Event

1. Click the **"New Event"** button in the top-right corner.
2. Fill in the form:

| Field | Required | Description |
|---|---|---|
| **Vehicle** | Yes | Select from the dropdown. Driver and vehicle details auto-fill below. |
| **Service Type** | Yes | Choose **Scheduled Maintenance** or **Repair/Incident**. |
| **Service Items** | No | What was done (e.g. "Oil Change, Brake Inspection"). |
| **Mileage (km)** | No | Odometer reading at the time of service. |
| **Cost** | No | Total cost of the service. |
| **Service Date** | Yes | When the service was or will be performed. |
| **Next Service Date** | No | When the next service is due. |
| **Location** | No | Where the service takes place (e.g. "Kingston Depot"). |
| **Status** | Yes | Pending, In Progress, or Completed. Defaults to Pending. |
| **Notes** | No | Any additional details. |

3. Click **"Sync to Calendar"** to save the event.
4. A confirmation message appears and the calendar refreshes automatically.

---

## Viewing Service History

In the **Service Work Orders** table at the bottom of the page, each row represents a service event.

1. Find the vehicle you are interested in.
2. Click the **"View"** button on that row.
3. A modal opens showing the full service history for that vehicle, with columns:
   - Date
   - Type (Scheduled Maintenance or Repair)
   - Service items
   - Status
   - Mileage
   - Location
   - Cost

You can also click on any **event badge** inside the calendar to open the same history modal for that vehicle.

---

## Exporting Data

1. Click the **"Export"** button in the top-right corner.
2. A CSV file downloads automatically with the name `service_events_YYYY-MM-DD.csv`.
3. The file includes all currently loaded events with columns: Date, Vehicle, Plate, Service Type, Service Items, Status, Mileage, Location, Cost, and Notes.

You can open the CSV in Excel, Google Sheets, or any spreadsheet application.

---

## Automatic Overdue Detection

You do not need to manually mark events as overdue. If a service date passes and the event has not been marked as completed, the system automatically labels it as **Overdue** in real-time.

---

## Quick Reference

| Action | How |
|---|---|
| Create an event | **New Event** button → fill form → **Sync to Calendar** |
| View vehicle history | Click **View** on any row in the table, or click a badge in the calendar |
| Filter by status | Click a filter button below the month name |
| Navigate months | Arrow buttons next to the month name |
| Export to CSV | **Export** button |
