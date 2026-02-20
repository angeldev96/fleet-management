import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type jsPDF from "jspdf";

// lucide icons
import {
  ArrowLeft,
  Activity,
  AlertTriangle,
  MapPin,
  Download,
  FileText,
  Car,
  Loader2,
} from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer";
import GridItem from "components/Grid/GridItem";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";

// hooks & utils
import { useVehicle } from "hooks/useVehicles";
import { useTravelData } from "hooks/useTravelData";
import { formatDateOnly, EVENT_LABELS } from "types/database";

// Mapbox
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN_PUBLIC;

// Default center (Jamaica)
const DEFAULT_CENTER = { lng: -76.8099, lat: 18.0179 };

export default function VehicleTravelReport() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const history = useHistory();
  const map = useRef<mapboxgl.Map | null>(null);
  const startMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const endMarkerRef = useRef<mapboxgl.Marker | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);

  // Date range - default to last 7 days
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);

  // Fetch vehicle
  const { vehicle, loading: vehicleLoading } = useVehicle(vehicleId);

  // Fetch travel data
  const { stats, loading } = useTravelData(vehicleId, startDate, endDate);

  // Map initialization
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: node,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: 11,
      preserveDrawingBuffer: true, // Required for print/PDF export
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right");

    map.current.on("load", () => {
      setMapLoaded(true);
    });
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Draw route on map when data is ready
  useEffect(() => {
    if (!map.current || !mapLoaded || stats.locationPoints.length === 0) return;

    drawRoute();
  }, [mapLoaded, stats.locationPoints]);

  const getRouteBounds = useCallback(() => {
    if (stats.locationPoints.length === 0) return null;

    const bounds = new mapboxgl.LngLatBounds();
    stats.locationPoints.forEach((point) => bounds.extend([point.lng, point.lat]));
    return bounds;
  }, [stats.locationPoints]);

  const fitRouteToBounds = useCallback(
    (padding = 50) => {
      if (!map.current) return;

      const bounds = getRouteBounds();
      if (!bounds) return;

      map.current.fitBounds(bounds, { padding, duration: 0 });
    },
    [getRouteBounds]
  );

  useEffect(() => {
    const handleBeforePrint = () => {
      if (!map.current) return;
      map.current.resize();
      fitRouteToBounds(80);
    };

    const handleAfterPrint = () => {
      if (!map.current) return;
      map.current.resize();
      fitRouteToBounds(50);
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [fitRouteToBounds]);

  const drawRoute = () => {
    if (!map.current || stats.locationPoints.length === 0) return;

    // Remove existing layers/sources
    if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
    }
    if (map.current.getSource("route")) {
      map.current.removeSource("route");
    }

    // Create GeoJSON line from points
    const coordinates = stats.locationPoints.map((p) => [p.lng, p.lat]);

    map.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      },
    });

    map.current.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3B82F6",
        "line-width": 4,
        "line-opacity": 0.8,
      },
    });

      // Add start and end markers
      if (coordinates.length > 0) {
        if (startMarkerRef.current) {
          startMarkerRef.current.remove();
        }

        if (endMarkerRef.current) {
          endMarkerRef.current.remove();
        }

        // Start marker (green)
        startMarkerRef.current = new mapboxgl.Marker({ color: "#10B981" })
          .setLngLat(coordinates[0] as [number, number])
          .setPopup(new mapboxgl.Popup().setHTML("<strong>Start</strong>"))
          .addTo(map.current);

        // End marker (red)
        if (coordinates.length > 1) {
          endMarkerRef.current = new mapboxgl.Marker({ color: "#EF4444" })
            .setLngLat(coordinates[coordinates.length - 1] as [number, number])
            .setPopup(new mapboxgl.Popup().setHTML("<strong>End</strong>"))
            .addTo(map.current);
        }

      // Fit map to show entire route
      fitRouteToBounds(50);
    }
  };

  const handleExportCSV = () => {
    const vehicleName = vehicle?.name || "Vehicle";
    const formatJamaicaDateTime = (dateValue: any) => {
      if (!dateValue) return "";
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Jamaica",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      const parts = formatter.formatToParts(new Date(dateValue));
      const get = (type: any) => parts.find((p) => p.type === type)?.value || "";
      return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get(
        "minute"
      )}:${get("second")}`;
    };

    const toCsvValue = (value: any) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes("\"") || stringValue.includes(",") || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      ["Travel Report - " + vehicleName],
      ["Period", `${startDate} to ${endDate}`],
      ["Generated", formatJamaicaDateTime(new Date()) + " (Jamaica)"],
      [""],
      ["Summary"],
      ["Total Distance (km)", stats.totalDistance],
      ["Total Alerts", stats.totalAlerts],
      ["Major Stops", stats.majorStops],
      ["Location Points", stats.locationPoints.length],
      [""],
      ["Location History"],
      ["Time", "Latitude", "Longitude", "Speed (km/h)"],
      ...stats.locationPoints.map((p) => [
        formatJamaicaDateTime(p.time),
        p.lat.toFixed(6),
        p.lng.toFixed(6),
        typeof p.speed === "number" ? p.speed.toFixed(1) : p.speed,
      ]),
    ]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `travel-report-${vehicleName}-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    const vehicleName = vehicle?.name || "Vehicle";
    const vehicleDisplayTitle = vehicle?.make && vehicle?.model
      ? `${vehicle.make} ${vehicle.model}`
      : vehicleName;

    // Create PDF (A4 size)
    const { default: JsPDF } = await import("jspdf");
    const pdf = new JsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Colors
    const primaryColor: [number, number, number] = [31, 41, 55]; // #1f2937
    const secondaryColor: [number, number, number] = [107, 114, 128]; // #6b7280
    const accentColor: [number, number, number] = [59, 130, 246]; // #3B82F6

    // === HEADER SECTION ===
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, pageWidth, 35, "F");

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont("helvetica", "bold");
    pdf.text("Travel Report", margin, 18);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(vehicleDisplayTitle, margin, 28);

    // Helper: format date in Jamaica timezone
    const formatJamaicaDate = (dateStr: any) => {
      return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "America/Jamaica",
      });
    };
    const formatJamaicaDateTime = (date: any) => {
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Jamaica",
      });
    };

    // Report metadata on right side
    const periodStart = formatJamaicaDate(startDate);
    const periodEnd = formatJamaicaDate(endDate);
    pdf.setFontSize(9);
    pdf.text(`Generated: ${formatJamaicaDateTime(new Date())}`, pageWidth - margin, 18, { align: "right" });
    pdf.text(`Period: ${periodStart} to ${periodEnd}`, pageWidth - margin, 26, { align: "right" });

    yPosition = 50;

    // === VEHICLE INFO SECTION ===
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Vehicle Information", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...secondaryColor);

    const vehicleInfo = [
      ["Vehicle Name:", vehicleName],
      ["Plate Number:", vehicle?.plate_number || "N/A"],
      ["Make/Model:", vehicle?.make && vehicle?.model ? `${vehicle.make} ${vehicle.model}` : "N/A"],
    ];

    vehicleInfo.forEach(([label, value]) => {
      pdf.setTextColor(...secondaryColor);
      pdf.text(label, margin, yPosition);
      pdf.setTextColor(...primaryColor);
      pdf.setFont("helvetica", "bold");
      pdf.text(value, margin + 35, yPosition);
      pdf.setFont("helvetica", "normal");
      yPosition += 6;
    });

    yPosition += 8;

    // === STATISTICS SECTION ===
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("Trip Statistics", margin, yPosition);
    yPosition += 10;

    // Stats boxes
    const statsData: { label: string; value: string; color: [number, number, number] }[] = [
      { label: "Total Distance", value: `${stats.totalDistance.toLocaleString()} km`, color: [5, 150, 105] },
      { label: "Total Alerts", value: stats.totalAlerts.toString(), color: [220, 38, 38] },
      { label: "Major Stops", value: stats.majorStops.toString(), color: [79, 70, 229] },
      { label: "Data Points", value: stats.locationPoints.length.toString(), color: [217, 119, 6] },
    ];

    const boxWidth = (pageWidth - 2 * margin - 15) / 4;
    const boxHeight = 25;

    statsData.forEach((stat, index) => {
      const xPos = margin + index * (boxWidth + 5);

      // Box background
      pdf.setFillColor(249, 250, 251);
      pdf.roundedRect(xPos, yPosition, boxWidth, boxHeight, 3, 3, "F");

      // Colored accent line
      pdf.setFillColor(...stat.color);
      pdf.rect(xPos, yPosition, boxWidth, 3, "F");

      // Label
      pdf.setFontSize(8);
      pdf.setTextColor(...secondaryColor);
      pdf.text(stat.label, xPos + boxWidth / 2, yPosition + 11, { align: "center" });

      // Value
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text(stat.value, xPos + boxWidth / 2, yPosition + 20, { align: "center" });
      pdf.setFont("helvetica", "normal");
    });

    yPosition += boxHeight + 15;

    // === MAP SECTION ===
    if (stats.locationPoints.length > 0) {
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Route Visualization", margin, yPosition);
      yPosition += 8;

      try {
        // Generate Mapbox Static Image URL with route
        const mapImageUrl = generateMapboxStaticUrl(stats.locationPoints);

        // Fetch and add map image to PDF
        const mapImage = await loadImage(mapImageUrl);
        const mapWidth = pageWidth - 2 * margin;
        const mapHeight = 100; // Fixed height for map in PDF

        // Add border for map
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, yPosition, mapWidth, mapHeight);

        pdf.addImage(mapImage as string, "PNG", margin, yPosition, mapWidth, mapHeight);

        // Add legend below map
        yPosition += mapHeight + 5;
        pdf.setFontSize(8);
        pdf.setTextColor(...secondaryColor);

        // Start marker legend
        pdf.setFillColor(16, 185, 129); // Green
        pdf.circle(margin + 3, yPosition + 2, 2, "F");
        pdf.text("Start", margin + 8, yPosition + 4);

        // End marker legend
        pdf.setFillColor(239, 68, 68); // Red
        pdf.circle(margin + 30, yPosition + 2, 2, "F");
        pdf.text("End", margin + 35, yPosition + 4);

        // Route legend
        pdf.setFillColor(...accentColor);
        pdf.rect(margin + 55, yPosition + 1, 10, 2, "F");
        pdf.text("Route", margin + 68, yPosition + 4);

        yPosition += 15;
      } catch (error) {
        console.error("Error generating map image:", error);
        pdf.setTextColor(220, 38, 38);
        pdf.setFontSize(10);
        pdf.text("Unable to load map image", margin, yPosition);
        yPosition += 15;
      }
    }

    // === TRIP DETAILS SECTION ===
    if (yPosition < pageHeight - 60) {
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Trip Details", margin, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");

      const tripDetails = [
        ["Start Date:", startDate],
        ["End Date:", endDate],
        ["Total Distance:", `${stats.totalDistance.toLocaleString()} km`],
        ["Alerts Recorded:", stats.totalAlerts.toString()],
        ["Major Stops:", stats.majorStops.toString()],
        ["Location Points:", stats.locationPoints.length.toString()],
      ];

      tripDetails.forEach(([label, value]) => {
        if (yPosition > pageHeight - 20) return; // Avoid overflow
        pdf.setTextColor(...secondaryColor);
        pdf.text(label, margin, yPosition);
        pdf.setTextColor(...primaryColor);
        pdf.setFont("helvetica", "bold");
        pdf.text(value, margin + 40, yPosition);
        pdf.setFont("helvetica", "normal");
        yPosition += 6;
      });
    }

    // === PAGE 2+: ALERT DETAILS ===
    const alertEvents = stats.alertEvents || [];
    if (alertEvents.length > 0) {
      pdf.addPage();
      yPosition = margin;

      // Header bar
      pdf.setFillColor(59, 130, 246);
      pdf.rect(0, 0, pageWidth, 30, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text("Alert Details", margin, 16);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${vehicleDisplayTitle} \u00B7 Period: ${periodStart} to ${periodEnd}`, margin, 24);

      yPosition = 42;

      // Alert Summary boxes
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Alert Summary", margin, yPosition);
      yPosition += 10;

      const criticalCount = alertEvents.filter((e) => e.severity === "critical").length;
      const warningCount = alertEvents.filter((e) => e.severity === "warning").length;
      const harshTypes = ["harsh_braking", "harsh_acceleration", "harsh_cornering"];
      const harshCount = alertEvents.filter((e) => harshTypes.includes(e.event_type)).length;
      const dtcCount = alertEvents.filter((e) => e.event_type === "dtc_detected").length;
      const collisionCount = alertEvents.filter((e) => e.event_type === "collision_detected").length;
      const overspeedCount = alertEvents.filter((e) => e.event_type === "overspeed").length;

      const summaryBoxes: { label: string; value: string; color: [number, number, number] }[] = [
        { label: "Critical", value: criticalCount.toString(), color: [244, 67, 54] },
        { label: "Warning", value: warningCount.toString(), color: [251, 140, 0] },
        { label: "Harsh Events", value: harshCount.toString(), color: [79, 70, 229] },
        { label: "Overspeed", value: overspeedCount.toString(), color: [217, 119, 6] },
        { label: "DTCs", value: dtcCount.toString(), color: [220, 38, 38] },
        { label: "Collisions", value: collisionCount.toString(), color: [156, 39, 176] },
      ];

      const summaryBoxWidth = (pageWidth - 2 * margin - 25) / 6;
      summaryBoxes.forEach((box, index) => {
        const xPos = margin + index * (summaryBoxWidth + 5);
        pdf.setFillColor(249, 250, 251);
        pdf.roundedRect(xPos, yPosition, summaryBoxWidth, 22, 2, 2, "F");
        pdf.setFillColor(...box.color);
        pdf.rect(xPos, yPosition, summaryBoxWidth, 2.5, "F");
        pdf.setFontSize(7);
        pdf.setTextColor(...secondaryColor);
        pdf.text(box.label, xPos + summaryBoxWidth / 2, yPosition + 9, { align: "center" });
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...primaryColor);
        pdf.text(box.value, xPos + summaryBoxWidth / 2, yPosition + 18, { align: "center" });
        pdf.setFont("helvetica", "normal");
      });

      yPosition += 32;

      // Behavior score
      let behaviorLabel = "Good";
      let behaviorColor: [number, number, number] = [5, 150, 105]; // green
      if (harshCount >= 3) {
        behaviorLabel = "Poor";
        behaviorColor = [220, 38, 38]; // red
      } else if (harshCount >= 1) {
        behaviorLabel = "Fair";
        behaviorColor = [217, 119, 6]; // amber
      }

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...primaryColor);
      pdf.text("Driving Behavior Score:", margin, yPosition);
      pdf.setTextColor(...behaviorColor);
      pdf.text(behaviorLabel, margin + 52, yPosition);
      pdf.setFont("helvetica", "normal");
      yPosition += 12;

      // Alert Log table
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("Alert Log", margin, yPosition);
      yPosition += 8;

      // Table header
      const colWidths = [10, 35, 50, 22, 63]; // #, Time, Type, Severity, Details
      const tableWidth = colWidths.reduce((a, b) => a + b, 0);

      const drawTableHeader = () => {
        pdf.setFillColor(59, 130, 246);
        pdf.rect(margin, yPosition, tableWidth, 8, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        const headers = ["#", "Time", "Event Type", "Severity", "Details"];
        let xOff = margin + 2;
        headers.forEach((h, i) => {
          pdf.text(h, xOff, yPosition + 5.5);
          xOff += colWidths[i];
        });
        yPosition += 8;
      };

      // Helper: format alert detail string
      const getAlertDetail = (event: any) => {
        const data = event.event_data || {};
        switch (event.event_type) {
          case "harsh_braking":
            return data.deceleration_g ? `Decel: ${Number(data.deceleration_g).toFixed(2)}g` : "";
          case "harsh_acceleration":
            return data.acceleration_g ? `Accel: ${Number(data.acceleration_g).toFixed(2)}g` : "";
          case "harsh_cornering":
            return data.lateral_g ? `Lateral: ${Number(data.lateral_g).toFixed(2)}g` : "";
          case "overspeed":
            return data.recorded_speed
              ? `${Number(data.recorded_speed).toFixed(1)} km/h (limit: ${Number(data.speed_limit).toFixed(1)})`
              : "";
          case "collision_detected":
            return data.impact_direction
              ? `${data.impact_direction} ${data.impact_g ? Number(data.impact_g).toFixed(1) + "g" : ""}`
              : "";
          case "dtc_detected":
            return data.dtc_code
              ? `${data.dtc_code}: ${data.dtc_description || "Diagnostic fault"}`
              : event.event_subtype || "";
          default:
            return "";
        }
      };

      // Helper: format time for table
      const formatAlertTime = (dateStr: any) => {
        const d = new Date(dateStr);
        return d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/Jamaica",
        });
      };

      drawTableHeader();

      alertEvents.forEach((event, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin + 5;
          drawTableHeader();
        }

        const rowHeight = 7;
        // Alternating row background
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPosition, tableWidth, rowHeight, "F");
        }

        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");

        let xOff = margin + 2;

        // # column
        pdf.setTextColor(...primaryColor);
        pdf.text((index + 1).toString(), xOff, yPosition + 5);
        xOff += colWidths[0];

        // Time column
        pdf.setTextColor(...secondaryColor);
        pdf.text(formatAlertTime(event.event_at), xOff, yPosition + 5);
        xOff += colWidths[1];

        // Event Type column
        pdf.setTextColor(...primaryColor);
        const typeLabel = (EVENT_LABELS as any)[event.event_type] || event.event_type;
        pdf.text(typeLabel.substring(0, 28), xOff, yPosition + 5);
        xOff += colWidths[2];

        // Severity column
        if (event.severity === "critical") {
          pdf.setTextColor(244, 67, 54);
        } else {
          pdf.setTextColor(251, 140, 0);
        }
        pdf.setFont("helvetica", "bold");
        pdf.text(event.severity.charAt(0).toUpperCase() + event.severity.slice(1), xOff, yPosition + 5);
        xOff += colWidths[3];

        // Details column
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...secondaryColor);
        const detail = getAlertDetail(event);
        pdf.text(detail.substring(0, 38), xOff, yPosition + 5);

        yPosition += rowHeight;
      });

      // Bottom line under table
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition, margin + tableWidth, yPosition);
    }

    // === FOOTERS ON ALL PAGES ===
    const totalPages = (pdf.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(...secondaryColor);
      pdf.text(
        `EntryFleet - Vehicle Travel Report | Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Save PDF
    pdf.save(`travel-report-${vehicleName.replace(/\s+/g, "-")}-${startDate}-to-${endDate}.pdf`);
  };

  // Helper function to generate Mapbox Static Image URL
  const generateMapboxStaticUrl = (points: any) => {
    if (points.length === 0) return null;

    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN_PUBLIC;

    // Calculate bounds with padding
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    points.forEach((p: any) => {
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
    });

    // Add padding to bounds (5% on each side)
    const lngPadding = (maxLng - minLng) * 0.08;
    const latPadding = (maxLat - minLat) * 0.08;
    minLng -= lngPadding;
    maxLng += lngPadding;
    minLat -= latPadding;
    maxLat += latPadding;

    // Simplify path for URL (Mapbox has URL length limits ~8192 chars)
    const simplifiedPoints = simplifyPath(points, 80);

    // Encode path using polyline encoding for Mapbox
    const encodedPolyline = encodePolyline(simplifiedPoints);

    // Start and end markers
    const startPoint = points[0];
    const endPoint = points[points.length - 1];

    // Build overlays - use encoded polyline format
    const pathOverlay = `path-4+3B82F6-0.8(${encodeURIComponent(encodedPolyline)})`;
    const startMarker = `pin-s-a+10B981(${startPoint.lng.toFixed(5)},${startPoint.lat.toFixed(5)})`;
    const endMarker = `pin-s-b+EF4444(${endPoint.lng.toFixed(5)},${endPoint.lat.toFixed(5)})`;

    // Use explicit bounds format: [minLng,minLat,maxLng,maxLat]
    const boundsStr = `[${minLng.toFixed(5)},${minLat.toFixed(5)},${maxLng.toFixed(5)},${maxLat.toFixed(5)}]`;

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${pathOverlay},${startMarker},${endMarker}/${boundsStr}/800x500@2x?access_token=${accessToken}`;
  };

  // Polyline encoding algorithm (Google's format, used by Mapbox)
  const encodePolyline = (points: any) => {
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const point of points) {
      const lat = Math.round(point.lat * 1e5);
      const lng = Math.round(point.lng * 1e5);

      encoded += encodeNumber(lat - prevLat);
      encoded += encodeNumber(lng - prevLng);

      prevLat = lat;
      prevLng = lng;
    }

    return encoded;
  };

  const encodeNumber = (num: any) => {
    let encoded = '';
    let value = num < 0 ? ~(num << 1) : (num << 1);

    while (value >= 0x20) {
      encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
      value >>= 5;
    }
    encoded += String.fromCharCode(value + 63);

    return encoded;
  };

  // Helper function to simplify path (reduce number of points)
  const simplifyPath = (points: any, maxPoints: any) => {
    if (points.length <= maxPoints) return points;

    const step = Math.ceil(points.length / maxPoints);
    const simplified = [];

    for (let i = 0; i < points.length; i += step) {
      simplified.push(points[i]);
    }

    // Always include the last point
    if (simplified[simplified.length - 1] !== points[points.length - 1]) {
      simplified.push(points[points.length - 1]);
    }

    return simplified;
  };

  // Helper function to load image as base64
  const loadImage = (url: any) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  // Calculate max date (30 days back from today)
  const maxStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (vehicleLoading && !vehicle) {
    return (
      <div className="flex items-center justify-center py-20 px-5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const vehicleTitle = vehicle?.make && vehicle?.model
    ? `${vehicle.make} ${vehicle.model}`
    : vehicle?.name || "Vehicle";

  return (
    <div className="travel-report-print print:p-0 print:m-0 print:overflow-visible">
      {/* Print-only header */}
      <h1 className="hidden print:block text-xl font-bold mb-2 text-foreground">
        Travel Report - {vehicleTitle}
      </h1>
      <p className="hidden print:block text-xs text-muted-foreground mb-4">
        Period: {startDate} to {endDate} | Generated: {new Date().toLocaleString()}
      </p>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:mb-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            className="rounded-lg bg-muted p-2 text-foreground transition-colors hover:bg-muted print:hidden shrink-0"
            onClick={() => history.push(`/admin/vehicle/${vehicleId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground m-0">Travel Report</h1>
            <p className="text-sm text-muted-foreground mt-1 mb-0 truncate">
              {vehicleTitle} - Historical travel data
            </p>
          </div>
        </div>
        <div className="flex gap-2 md:gap-3 print:hidden">
          <button
            className="inline-flex items-center rounded-lg bg-emerald-600 px-3 md:px-5 py-2 md:py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
            onClick={handleExportCSV}
          >
            <Download className="mr-1.5 md:mr-2 h-4 w-4" />
            CSV
          </button>
          <button
            className="inline-flex items-center rounded-lg bg-red-600 px-3 md:px-5 py-2 md:py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
            onClick={handleExportPDF}
          >
            <FileText className="mr-1.5 md:mr-2 h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card className="rounded-xl shadow-sm border border-border mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-5">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-foreground mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={maxStartDate}
              max={endDate}
              className="flex h-9 rounded-lg border border-border bg-transparent px-3 py-1 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-foreground mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={today}
              className="flex h-9 rounded-lg border border-border bg-transparent px-3 py-1 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <span className="text-muted-foreground text-xs sm:text-sm sm:self-end sm:pb-1.5">
            Maximum period: 30 days
          </span>
        </div>
      </Card>

      {/* Stats Cards */}
      <GridContainer className="mb-6">
        <GridItem xs={12} sm={6} md={3}>
          <Card className="rounded-xl shadow-sm border border-border h-full print:shadow-none print:border-border">
            <CardBody className="p-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 bg-emerald-50">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium m-0 mb-1">Total Distance</p>
                <p className="text-[28px] font-bold text-foreground m-0 leading-tight">
                  {stats.totalDistance.toLocaleString()}
                  <span className="text-sm text-muted-foreground font-medium ml-1">km</span>
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} md={3}>
          <Card className="rounded-xl shadow-sm border border-border h-full print:shadow-none print:border-border">
            <CardBody className="p-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium m-0 mb-1">Total Alerts</p>
                <p className="text-[28px] font-bold text-foreground m-0 leading-tight">{stats.totalAlerts}</p>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} md={3}>
          <Card className="rounded-xl shadow-sm border border-border h-full print:shadow-none print:border-border">
            <CardBody className="p-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 bg-indigo-50">
                <MapPin className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium m-0 mb-1">Major Stops</p>
                <p className="text-[28px] font-bold text-foreground m-0 leading-tight">{stats.majorStops}</p>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} md={3}>
          <Card className="rounded-xl shadow-sm border border-border h-full print:shadow-none print:border-border">
            <CardBody className="p-6 flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 bg-amber-50">
                <Car className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium m-0 mb-1">Location Points</p>
                <p className="text-[28px] font-bold text-foreground m-0 leading-tight">{stats.locationPoints.length}</p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      <GridContainer>
        {/* Map */}
        <GridItem xs={12} md={8}>
          <Card className="rounded-xl shadow-sm border border-border print:shadow-none print:border-border print:min-h-[550px] print:overflow-visible print:mb-5">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground m-0">Route Visualization</h3>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Start
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  End
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-1 w-5 rounded-sm bg-blue-500" />
                  Route
                </div>
              </div>
            </div>
            <div className="h-[400px] relative print:h-[500px] print:min-h-[500px]">
              <div ref={mapContainerRef} className="w-full h-full" />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-[1]">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
              )}
              {stats.locationPoints.length === 0 && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/50 text-muted-foreground text-sm">
                  <Activity className="h-12 w-12 mb-4 text-muted-foreground" />
                  <p>No travel data available for selected period</p>
                </div>
              )}
            </div>
          </Card>
        </GridItem>

        {/* Summary */}
        <GridItem xs={12} md={4}>
          <Card className="rounded-xl shadow-sm border border-border print:shadow-none print:border-border">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground m-0">Report Summary</h3>
            </div>
            <CardBody className="p-6">
              {[
                ["Vehicle", vehicleTitle],
                ["Plate Number", vehicle?.plate_number || "N/A"],
                ["Period", `${startDate} to ${endDate}`],
                ["Distance Traveled", `${stats.totalDistance} km`],
                ["Alerts Recorded", stats.totalAlerts],
                ["Major Stops", stats.majorStops],
                ["Data Points", stats.locationPoints.length],
                ["Report Generated", formatDateOnly(new Date())],
              ].map(([label, value], idx, arr) => (
                <div
                  key={label}
                  className={`flex items-center justify-between py-3 ${
                    idx < arr.length - 1 ? "border-b border-border/50" : ""
                  }`}
                >
                  <span className="text-sm text-muted-foreground font-medium">{label}</span>
                  <span className="text-sm text-foreground font-semibold">{value}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
