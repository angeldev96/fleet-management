import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// @material-ui/icons
import Warning from "@material-ui/icons/Warning";
import Edit from "@material-ui/icons/Edit";
import Send from "@material-ui/icons/Send";
import ChevronRight from "@material-ui/icons/ChevronRight";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import NavPills from "components/NavPills/NavPills.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Badge from "components/Badge/Badge.js";
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";

import styles from "assets/jss/material-dashboard-pro-react/views/dashboardStyle.js";

const useStyles = makeStyles(styles);

export default function Dashboard() {
  const classes = useStyles();

  const diagnosticsContent = (
    <div>
      <Card>
        <CardBody>
          <GridContainer>
            <GridItem xs={12} md={6}>
              <div style={{ padding: "20px" }}>
                <h4 style={{ display: "flex", alignItems: "center" }}>
                  Status:{" "}
                  <span
                    style={{
                      color: "#f44336",
                      marginLeft: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    Alert
                  </span>
                </h4>
                <br />
                <GridContainer>
                  <GridItem xs={6}>
                    <p style={{ color: "#999", marginBottom: "0" }}>Battery Voltage:</p>
                  </GridItem>
                  <GridItem xs={6}>
                    <p style={{ fontWeight: "500" }}>12.6 V</p>
                  </GridItem>
                  <GridItem xs={6}>
                    <p style={{ color: "#999", marginBottom: "0" }}>Last Location:</p>
                  </GridItem>
                  <GridItem xs={6}>
                    <p style={{ fontWeight: "500" }}>6 min ago</p>
                  </GridItem>
                </GridContainer>
                <div
                  style={{
                    marginTop: "20px",
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <p style={{ margin: 0, fontWeight: "500" }}>Last Update:</p>
                    <p style={{ margin: "0 0 0 10px", color: "#666" }}>6 min ago</p>
                  </div>
                  <ChevronRight />
                </div>
              </div>
            </GridItem>
            <GridItem xs={12} md={6}>
              <div
                style={{
                  height: "200px",
                  width: "100%",
                  backgroundColor: "#e9ecef",
                  borderRadius: "8px",
                  backgroundImage:
                    "url('https://placehold.co/600x300/e9ecef/31343c?text=Vehicle+Location+Map')", // Placeholder image
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  marginTop: "20px",
                }}
              >
                {/* Normally we would use a proper Map component here */}
              </div>
            </GridItem>
          </GridContainer>
        </CardBody>
      </Card>

      <div style={{ marginTop: "30px" }}>
        <h3 style={{ fontWeight: "400", marginBottom: "20px" }}>Diagnostics</h3>
        <Card>
          <CardBody>
            <Table
              tableHead={["DTC Code", "Description", "Severity", "Timestamp", "Date", ""]}
              tableData={[
                [
                  "P0301",
                  "Misfire Detected Cylinder 1",
                  <Badge color="danger" key="b1">
                    <Warning style={{ fontSize: "14px", marginRight: "5px" }} /> Critical
                  </Badge>,
                  "Today at 08:42 AM",
                  "",
                  <div key="a1" style={{ display: "flex" }}>
                    <Button justIcon round color="warning" size="sm" style={{ marginRight: "5px" }}>
                      <Send style={{ fontSize: "14px", color: "white" }} />
                    </Button>
                    <Button justIcon round color="github" size="sm">
                      <Edit style={{ fontSize: "14px" }} />
                    </Button>
                  </div>,
                ],
                [
                  "P0171",
                  "System Too Lean (Bank 1)",
                  <Badge color="warning" key="b2">
                    <Warning style={{ fontSize: "14px", marginRight: "5px" }} /> Warning
                  </Badge>,
                  "Yesterday at 09:30 PM",
                  "",
                  <div key="a2" style={{ display: "flex" }}>
                    <Button justIcon round color="warning" size="sm" style={{ marginRight: "5px" }}>
                      <Send style={{ fontSize: "14px", color: "white" }} />
                    </Button>
                    <Button justIcon round color="github" size="sm">
                      <Edit style={{ fontSize: "14px" }} />
                    </Button>
                  </div>,
                ],
              ]}
              customCellClasses={[
                classes.center,
                classes.center,
                classes.center,
                classes.center,
                classes.center,
                classes.right,
              ]}
              customClassesForCells={[0, 1, 2, 3, 4, 5]}
              customHeadCellClasses={[
                classes.center,
                classes.center,
                classes.center,
                classes.center,
                classes.center,
                classes.right,
              ]}
              customHeadClassesForCells={[0, 1, 2, 3, 4, 5]}
            />
          </CardBody>
        </Card>
      </div>
    </div>
  );

  return (
    <div>
      <NavPills
        color="info"
        tabs={[
          {
            tabButton: "Summary",
            tabContent: <div>Summary Content</div>,
          },
          {
            tabButton: "Diagnostics",
            tabContent: diagnosticsContent,
          },
          {
            tabButton: "Behavior",
            tabContent: <div>Behavior Content</div>,
          },
        ]}
        active={1} // Select Diagnostics by default
      />
    </div>
  );
}
