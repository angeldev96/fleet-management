import React from "react";

// Lucide icons
import { AlertTriangle, Pencil, Send, ChevronRight } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import NavPills from "components/NavPills/NavPills.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Badge from "components/Badge/Badge.js";
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";

export default function Dashboard() {
  const diagnosticsContent = (
    <div>
      <Card>
        <CardBody>
          <GridContainer>
            <GridItem xs={12} md={6}>
              <div className="p-5">
                <h4 className="flex items-center">
                  Status:{" "}
                  <span className="text-red-500 ml-2.5 font-bold">Alert</span>
                </h4>
                <br />
                <GridContainer>
                  <GridItem xs={6}>
                    <p className="text-gray-400 mb-0">Battery Voltage:</p>
                  </GridItem>
                  <GridItem xs={6}>
                    <p className="font-medium">12.6 V</p>
                  </GridItem>
                  <GridItem xs={6}>
                    <p className="text-gray-400 mb-0">Last Location:</p>
                  </GridItem>
                  <GridItem xs={6}>
                    <p className="font-medium">6 min ago</p>
                  </GridItem>
                </GridContainer>
                <div className="mt-5 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="m-0 font-medium">Last Update:</p>
                    <p className="m-0 ml-2.5 text-gray-500">6 min ago</p>
                  </div>
                  <ChevronRight className="h-5 w-5" />
                </div>
              </div>
            </GridItem>
            <GridItem xs={12} md={6}>
              <div
                className="h-[200px] w-full bg-gray-200 rounded-lg bg-cover bg-center mt-5"
                style={{
                  backgroundImage:
                    "url('https://placehold.co/600x300/e9ecef/31343c?text=Vehicle+Location+Map')",
                }}
              >
                {/* Normally we would use a proper Map component here */}
              </div>
            </GridItem>
          </GridContainer>
        </CardBody>
      </Card>

      <div className="mt-8">
        <h3 className="font-normal mb-5">Diagnostics</h3>
        <Card>
          <CardBody>
            <Table
              tableHead={["DTC Code", "Description", "Severity", "Timestamp", "Date", ""]}
              tableData={[
                [
                  "P0301",
                  "Misfire Detected Cylinder 1",
                  <Badge color="danger" key="b1">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Critical
                  </Badge>,
                  "Today at 08:42 AM",
                  "",
                  <div key="a1" className="flex">
                    <Button justIcon round color="warning" size="sm" className="mr-1">
                      <Send className="h-3.5 w-3.5 text-white" />
                    </Button>
                    <Button justIcon round color="primary" size="sm">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>,
                ],
                [
                  "P0171",
                  "System Too Lean (Bank 1)",
                  <Badge color="warning" key="b2">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Warning
                  </Badge>,
                  "Yesterday at 09:30 PM",
                  "",
                  <div key="a2" className="flex">
                    <Button justIcon round color="warning" size="sm" className="mr-1">
                      <Send className="h-3.5 w-3.5 text-white" />
                    </Button>
                    <Button justIcon round color="primary" size="sm">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>,
                ],
              ]}
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
