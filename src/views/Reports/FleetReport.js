import React from "react";
import { useHistory } from "react-router-dom";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";

// @material-ui/icons
import ArrowBack from "@material-ui/icons/ArrowBack";
import DirectionsCar from "@material-ui/icons/DirectionsCar";
import Warning from "@material-ui/icons/Warning";
import Speed from "@material-ui/icons/Speed";
import Timeline from "@material-ui/icons/Timeline";
import AttachMoney from "@material-ui/icons/AttachMoney";
import GetApp from "@material-ui/icons/GetApp";
import PictureAsPdf from "@material-ui/icons/PictureAsPdf";

import jsPDF from "jspdf";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Button from "components/CustomButtons/Button.js";

// hooks & utils
import { useFleetReport } from "hooks/useFleetReport";
import { formatDateOnly } from "types/database";

const useStyles = makeStyles(() => ({
  // Print styles
  "@media print": {
    "@global": {
      body: {
        "print-color-adjust": "exact",
        WebkitPrintColorAdjust: "exact",
      },
    },
  },
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "32px",
    "@media print": {
      marginBottom: "16px",
    },
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  backButton: {
    backgroundColor: "#F3F4F6",
    color: "#374151",
    padding: "8px",
    minWidth: "40px",
    borderRadius: "8px",
    "&:hover": {
      backgroundColor: "#E5E7EB",
    },
    "@media print": {
      display: "none",
    },
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
    margin: "4px 0 0 0",
  },
  exportButtons: {
    display: "flex",
    gap: "12px",
    "@media print": {
      display: "none",
    },
  },
  exportBtn: {
    padding: "10px 20px",
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  csvBtn: {
    backgroundColor: "#059669",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#047857",
    },
  },
  pdfBtn: {
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    "&:hover": {
      backgroundColor: "#B91C1C",
    },
  },
  statsGrid: {
    marginBottom: "32px",
  },
  statCard: {
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #E5E7EB",
    height: "100%",
    "@media print": {
      boxShadow: "none",
      pageBreakInside: "avoid",
    },
  },
  statCardBody: {
    padding: "24px",
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
  },
  statIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: "14px",
    color: "#6b7280",
    margin: "0 0 4px 0",
    fontWeight: "500",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#1f2937",
    margin: 0,
    lineHeight: 1.2,
  },
  statUnit: {
    fontSize: "14px",
    color: "#9ca3af",
    fontWeight: "500",
    marginLeft: "4px",
  },
  summaryCard: {
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    border: "1px solid #E5E7EB",
    "@media print": {
      boxShadow: "none",
      pageBreakInside: "avoid",
    },
  },
  summaryHeader: {
    padding: "20px 24px",
    borderBottom: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#1f2937",
    margin: 0,
  },
  summaryBody: {
    padding: "24px",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid #F3F4F6",
    "&:last-child": {
      borderBottom: "none",
    },
  },
  summaryLabel: {
    fontSize: "14px",
    color: "#6b7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: "16px",
    color: "#1f2937",
    fontWeight: "600",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "80px 20px",
  },
  reportDate: {
    fontSize: "13px",
    color: "#9ca3af",
    padding: "8px 16px",
    backgroundColor: "#F9FAFB",
    borderRadius: "6px",
  },
  printContainer: {
    "@media print": {
      padding: "0",
      margin: "0",
    },
  },
  printTitle: {
    display: "none",
    "@media print": {
      display: "block",
      fontSize: "22px",
      fontWeight: "700",
      marginBottom: "8px",
      color: "#1f2937",
    },
  },
  printMeta: {
    display: "none",
    "@media print": {
      display: "block",
      fontSize: "12px",
      color: "#6b7280",
      marginBottom: "20px",
    },
  },
}));

export default function FleetReport() {
  const classes = useStyles();
  const history = useHistory();

  const { stats, loading } = useFleetReport();

  const handleExportCSV = () => {
    const csvContent = [
      ["Fleet Summary Report"],
      ["Generated", new Date().toLocaleString()],
      [""],
      ["Metric", "Value"],
      ["Total Vehicles", stats.totalVehicles],
      ["Active Vehicles", stats.activeVehicles],
      ["Total Distance (km)", stats.totalDistance],
      ["Total Service Cost (JMD)", `J$${stats.totalServiceCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ["Total DTCs", stats.totalDTCs],
      ["Driving Behavior Alerts", stats.totalBehaviorAlerts],
    ]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fleet-report-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    let y = 18;

    const primaryColor = [31, 41, 55]; // #1f2937
    const secondaryColor = [107, 114, 128]; // #6b7280
    const headerBlue = [59, 130, 246]; // #3B82F6
    const cardBorder = [229, 231, 235]; // #E5E7EB

    // Header
    pdf.setFillColor(...headerBlue);
    pdf.rect(0, 0, pageWidth, 30, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text("Fleet Summary Report", margin, 18);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 16, { align: "right" });
    pdf.text("Period: Last 24 hours", pageWidth - margin, 23, { align: "right" });

    y = 42;

    // Vehicle Information block
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Fleet Overview", margin, y);
    y += 6;

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...secondaryColor);
    pdf.text("High-level performance and alert summary for your fleet.", margin, y);
    y += 10;

    // Stat cards
    const cardWidth = (pageWidth - margin * 2 - 10) / 3;
    const cardHeight = 26;

    const drawStatCard = (x, yPos, color, label, value) => {
      pdf.setDrawColor(...cardBorder);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(x, yPos, cardWidth, cardHeight, "FD");
      pdf.setFillColor(...color);
      pdf.rect(x, yPos, cardWidth, 3, "F");
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(8.5);
      pdf.text(label, x + 6, yPos + 12);
      pdf.setTextColor(...primaryColor);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(value, x + 6, yPos + 20);
      pdf.setFont("helvetica", "normal");
    };

    drawStatCard(margin, y, [16, 185, 129], "Active Vehicles", `${stats.activeVehicles}`);
    drawStatCard(margin + cardWidth + 5, y, [239, 68, 68], "Total Vehicles", `${stats.totalVehicles}`);
    drawStatCard(margin + (cardWidth + 5) * 2, y, [245, 158, 11], "Total Distance", `${stats.totalDistance} km`);

    y += cardHeight + 8;
    drawStatCard(margin, y, [99, 102, 241], "Total DTCs", `${stats.totalDTCs}`);
    drawStatCard(margin + cardWidth + 5, y, [59, 130, 246], "Behavior Alerts", `${stats.totalBehaviorAlerts}`);
    drawStatCard(margin + (cardWidth + 5) * 2, y, [5, 150, 105], "Total Service Cost", `J$${stats.totalServiceCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}`);

    // Footer note
    const footerY = pageHeight - 12;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(8);
    pdf.text("Generated by Entry Fleet • Confidential", margin, footerY);

    pdf.save(`fleet-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className={classes.printContainer}>
      {/* Print-only header */}
      <h1 className={classes.printTitle}>Fleet Summary Report</h1>
      <p className={classes.printMeta}>
        Generated: {new Date().toLocaleString()}
      </p>

      {/* Page Header */}
      <div className={classes.pageHeader}>
        <div className={classes.headerLeft}>
          <Button
            className={classes.backButton}
            onClick={() => history.push("/admin/reports")}
          >
            <ArrowBack style={{ fontSize: "20px" }} />
          </Button>
          <div>
            <h1 className={classes.pageTitle}>Fleet Summary Report</h1>
            <p className={classes.pageSubtitle}>
              Overview of your entire fleet performance and statistics
            </p>
          </div>
        </div>
        <div className={classes.exportButtons}>
          <Button
            className={`${classes.exportBtn} ${classes.csvBtn}`}
            onClick={handleExportCSV}
          >
            <GetApp style={{ marginRight: "8px", fontSize: "18px" }} />
            Export CSV
          </Button>
          <Button
            className={`${classes.exportBtn} ${classes.pdfBtn}`}
            onClick={handleExportPDF}
          >
            <PictureAsPdf style={{ marginRight: "8px", fontSize: "18px" }} />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <GridContainer className={classes.statsGrid}>
        <GridItem xs={12} sm={6} md={3}>
          <Card className={classes.statCard}>
            <CardBody className={classes.statCardBody}>
              <div
                className={classes.statIcon}
                style={{ backgroundColor: "#EEF2FF" }}
              >
                <DirectionsCar style={{ fontSize: "24px", color: "#4F46E5" }} />
              </div>
              <div className={classes.statContent}>
                <p className={classes.statLabel}>Active Vehicles</p>
                <p className={classes.statValue}>
                  {stats.activeVehicles}
                  <span className={classes.statUnit}>/ {stats.totalVehicles}</span>
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} md={3}>
          <Card className={classes.statCard}>
            <CardBody className={classes.statCardBody}>
              <div
                className={classes.statIcon}
                style={{ backgroundColor: "#ECFDF5" }}
              >
                <Timeline style={{ fontSize: "24px", color: "#059669" }} />
              </div>
              <div className={classes.statContent}>
                <p className={classes.statLabel}>Total Distance</p>
                <p className={classes.statValue}>
                  {stats.totalDistance.toLocaleString()}
                  <span className={classes.statUnit}>km</span>
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} md={3}>
          <Card className={classes.statCard}>
            <CardBody className={classes.statCardBody}>
              <div
                className={classes.statIcon}
                style={{ backgroundColor: "#FEF2F2" }}
              >
                <Warning style={{ fontSize: "24px", color: "#DC2626" }} />
              </div>
              <div className={classes.statContent}>
                <p className={classes.statLabel}>Total DTCs</p>
                <p className={classes.statValue}>{stats.totalDTCs}</p>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={6} md={3}>
          <Card className={classes.statCard}>
            <CardBody className={classes.statCardBody}>
              <div
                className={classes.statIcon}
                style={{ backgroundColor: "#FFFBEB" }}
              >
                <Speed style={{ fontSize: "24px", color: "#D97706" }} />
              </div>
              <div className={classes.statContent}>
                <p className={classes.statLabel}>Behavior Alerts</p>
                <p className={classes.statValue}>{stats.totalBehaviorAlerts}</p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      {/* Service Cost Card */}
      <GridContainer style={{ marginBottom: "32px" }}>
        <GridItem xs={12} sm={6} md={4}>
          <Card className={classes.statCard}>
            <CardBody className={classes.statCardBody}>
              <div
                className={classes.statIcon}
                style={{ backgroundColor: "#ECFDF5" }}
              >
                <AttachMoney style={{ fontSize: "24px", color: "#059669" }} />
              </div>
              <div className={classes.statContent}>
                <p className={classes.statLabel}>Total Service Cost</p>
                <p className={classes.statValue}>
                  J${stats.totalServiceCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className={classes.statUnit}>JMD</span>
                </p>
              </div>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>

      {/* Detailed Summary */}
      <GridContainer>
        <GridItem xs={12} md={8}>
          <Card className={classes.summaryCard}>
            <div className={classes.summaryHeader}>
              <h3 className={classes.summaryTitle}>Detailed Summary</h3>
              <span className={classes.reportDate}>
                Report generated: {formatDateOnly(new Date())}
              </span>
            </div>
            <CardBody className={classes.summaryBody}>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Total Vehicles in Fleet</span>
                <span className={classes.summaryValue}>{stats.totalVehicles} vehicles</span>
              </div>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Currently Active Vehicles</span>
                <span className={classes.summaryValue}>{stats.activeVehicles} vehicles</span>
              </div>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Offline Vehicles</span>
                <span className={classes.summaryValue}>{stats.totalVehicles - stats.activeVehicles} vehicles</span>
              </div>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Overall Distance Traveled</span>
                <span className={classes.summaryValue}>{stats.totalDistance.toLocaleString()} km</span>
              </div>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Diagnostic Trouble Codes (DTCs)</span>
                <span className={classes.summaryValue}>{stats.totalDTCs} codes</span>
              </div>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Driving Behavior Alerts</span>
                <span className={classes.summaryValue}>{stats.totalBehaviorAlerts} alerts</span>
              </div>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Total Service Cost</span>
                <span className={classes.summaryValue}>
                  J${stats.totalServiceCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} JMD
                </span>
              </div>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Alert Types Included</span>
                <span className={classes.summaryValue}>Harsh Braking, Acceleration, Cornering, Overspeed</span>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} md={4}>
          <Card className={classes.summaryCard}>
            <div className={classes.summaryHeader}>
              <h3 className={classes.summaryTitle}>Fleet Health</h3>
            </div>
            <CardBody className={classes.summaryBody}>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Online Rate</span>
                <span className={classes.summaryValue}>
                  {stats.totalVehicles > 0
                    ? Math.round((stats.activeVehicles / stats.totalVehicles) * 100)
                    : 0}%
                </span>
              </div>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Avg DTCs per Vehicle</span>
                <span className={classes.summaryValue}>
                  {stats.totalVehicles > 0
                    ? (stats.totalDTCs / stats.totalVehicles).toFixed(1)
                    : 0}
                </span>
              </div>
              <div className={classes.summaryRow}>
                <span className={classes.summaryLabel}>Avg Alerts per Vehicle</span>
                <span className={classes.summaryValue}>
                  {stats.totalVehicles > 0
                    ? (stats.totalBehaviorAlerts / stats.totalVehicles).toFixed(1)
                    : 0}
                </span>
              </div>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
