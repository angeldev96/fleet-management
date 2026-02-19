import { jsPDF } from "jspdf";
import { SERVICE_TYPE_LABELS } from "types/database";

// ============================================================================
// SHARED HELPERS
// ============================================================================

function formatStatus(status) {
  const statusMap = {
    pending: "Pending",
    in_progress: "In Progress",
    completed: "Completed",
    overdue: "Overdue",
  };
  return statusMap[status] || status;
}

function escapeCSV(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildRows(events) {
  return events.map((e) => ({
    date: e.service_date || "",
    vehicle: e.vehicle_name || "",
    plate: e.plate_number || "",
    type: SERVICE_TYPE_LABELS[e.service_type] || e.service_type || "",
    items: e.service_items || "",
    status: formatStatus(e.computed_status || e.status),
    mileage: e.mileage ? `${e.mileage} km` : "",
    location: e.location || "",
    cost: e.cost ? `J$${parseFloat(e.cost).toFixed(2)}` : "",
    notes: e.notes || "",
  }));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// CSV EXPORT
// ============================================================================

export function exportToCSV(serviceEvents, vehicleName) {
  if (!serviceEvents || serviceEvents.length === 0) return;

  const headers = ["Date", "Vehicle", "Plate", "Service Type", "Service Items", "Status", "Mileage", "Location", "Cost (JMD)", "Notes"];
  const rows = buildRows(serviceEvents);

  const totalCost = serviceEvents.reduce((sum, e) => sum + (parseFloat(e.cost) || 0), 0);

  const csvContent = [
    headers.join(","),
    ...rows.map((r) =>
      [r.date, r.vehicle, r.plate, r.type, r.items, r.status, r.mileage, r.location, r.cost, r.notes]
        .map(escapeCSV)
        .join(",")
    ),
    "",
    `,,,,,,,,${escapeCSV(`J$${totalCost.toFixed(2)}`)},Total Service Cost (JMD)`,
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const prefix = vehicleName ? `service_${vehicleName.replace(/\s+/g, "_")}` : "service_fleet_report";
  downloadBlob(blob, `${prefix}_${new Date().toISOString().split("T")[0]}.csv`);
}

// ============================================================================
// PDF EXPORT
// ============================================================================

export function exportToPDF(serviceEvents, vehicleName) {
  if (!serviceEvents || serviceEvents.length === 0) return;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const rows = buildRows(serviceEvents);

  // --- Header ---
  doc.setFillColor(79, 70, 229); // indigo-600 (matches --color-primary)
  doc.rect(0, 0, pageWidth, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  const title = vehicleName ? `Service Report — ${vehicleName}` : "Fleet Service Report";
  doc.text(title, margin, 14);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, pageWidth - margin, 14, { align: "right" });

  // --- Summary ---
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(10);
  let y = 30;
  const total = rows.length;
  const completed = rows.filter((r) => r.status === "Completed").length;
  const pending = rows.filter((r) => r.status === "Pending").length;
  const overdue = rows.filter((r) => r.status === "Overdue").length;
  const inProgress = rows.filter((r) => r.status === "In Progress").length;
  const totalCost = serviceEvents.reduce((sum, e) => sum + (parseFloat(e.cost) || 0), 0);

  doc.setFont("helvetica", "bold");
  doc.text("Summary", margin, y);
  doc.setFont("helvetica", "normal");
  y += 6;
  doc.text(`Total Events: ${total}  |  Completed: ${completed}  |  Pending: ${pending}  |  In Progress: ${inProgress}  |  Overdue: ${overdue}`, margin, y);
  y += 6;
  doc.text(`Total Service Cost: J$${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JMD`, margin, y);
  y += 10;

  // --- Table header ---
  const cols = [
    { label: "Date", width: 24 },
    { label: "Vehicle", width: 35 },
    { label: "Plate", width: 22 },
    { label: "Type", width: 35 },
    { label: "Service Items", width: 45 },
    { label: "Status", width: 22 },
    { label: "Mileage", width: 22 },
    { label: "Location", width: 30 },
    { label: "Cost", width: 18 },
    { label: "Notes", width: 36 },
  ];

  const drawTableHeader = (startY) => {
    doc.setFillColor(243, 244, 246); // #F3F4F6
    doc.rect(margin, startY, pageWidth - margin * 2, 8, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(55, 65, 81);
    let x = margin + 2;
    cols.forEach((col) => {
      doc.text(col.label, x, startY + 5.5);
      x += col.width;
    });
    return startY + 10;
  };

  y = drawTableHeader(y);

  // --- Table rows ---
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);

  rows.forEach((row, index) => {
    if (y > pageHeight - 16) {
      doc.addPage();
      y = 14;
      y = drawTableHeader(y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
    }

    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 3.5, pageWidth - margin * 2, 7, "F");
    }

    doc.setTextColor(55, 65, 81);
    let x = margin + 2;
    const values = [row.date, row.vehicle, row.plate, row.type, row.items, row.status, row.mileage, row.location, row.cost, row.notes];
    values.forEach((val, i) => {
      const maxWidth = cols[i].width - 3;
      const text = doc.splitTextToSize(String(val), maxWidth)[0] || "";
      doc.text(text, x, y);
      x += cols[i].width;
    });

    y += 7;
  });

  // --- Footer ---
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    doc.text("Entry Fleet Management", margin, pageHeight - 8);
  }

  const prefix = vehicleName ? `service_${vehicleName.replace(/\s+/g, "_")}` : "service_fleet_report";
  doc.save(`${prefix}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export default exportToCSV;
