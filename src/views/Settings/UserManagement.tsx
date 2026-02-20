import React from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import { ArrowLeft, UserPlus, Search, Shield, Users, User, Eye } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer";
import GridItem from "components/Grid/GridItem";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import Table from "components/Table/Table";
import Button from "components/CustomButtons/Button";

import { cn } from "lib/utils";

const mockUsers = [
  {
    id: "U-1001",
    name: "Angel V",
    email: "angel@entryfleet.com",
    role: "Superadmin",
    status: "Active",
    lastActive: "2 min ago",
  },
  {
    id: "U-1002",
    name: "Howard Gordon",
    email: "howard@entryfleet.com",
    role: "Admin",
    status: "Active",
    lastActive: "12 min ago",
  },
  {
    id: "U-1003",
    name: "Karen Blake",
    email: "karen@entryfleet.com",
    role: "User",
    status: "Active",
    lastActive: "1 hour ago",
  },
  {
    id: "U-1004",
    name: "Felix Reyes",
    email: "felix@entryfleet.com",
    role: "Viewer",
    status: "Invited",
    lastActive: "Pending",
  },
];

export default function UserManagement() {
  const history = useHistory();

  const tableData = mockUsers.map((user) => [
    user.name,
    user.email,
    <span
      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 w-fit inline-block"
      key={`role-${user.id}`}
    >
      {user.role}
    </span>,
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-xs font-semibold w-fit inline-block",
        user.status === "Active"
          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
          : "bg-amber-50 text-amber-600 border border-amber-200"
      )}
      key={`status-${user.id}`}
    >
      {user.status}
    </span>,
    user.lastActive,
    <Button
      key={`action-${user.id}`}
      className="bg-muted/50 border border-border rounded-lg px-3 py-2 normal-case text-foreground hover:bg-muted text-sm"
    >
      Manage
    </Button>,
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button
            className="bg-muted/50 border border-border rounded-lg px-3 py-2 normal-case text-foreground hover:bg-muted"
            onClick={() => history.push("/admin/settings")}
          >
            <ArrowLeft className="w-[18px] h-[18px] mr-1.5" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground m-0">User Management</h1>
            <div className="text-sm text-muted-foreground mt-1">
              Superadmins can add users and manage roles within their fleet.
            </div>
          </div>
        </div>
        <Button className="bg-primary text-primary-foreground px-[18px] py-2.5 normal-case font-semibold rounded-lg hover:bg-primary/90">
          <UserPlus className="w-[18px] h-[18px] mr-2" />
          Invite User
        </Button>
      </div>

      <GridContainer spacing={3}>
        <GridItem xs={12} md={4}>
          <Card className="rounded-xl border border-border shadow-sm">
            <CardBody>
              <div className="flex items-center gap-3 py-3 border-b border-dashed border-border">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white bg-blue-500"
                >
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-0.5">Superadmin</div>
                  <div className="text-xs text-muted-foreground">Full access across the fleet</div>
                </div>
                <div className="ml-auto text-sm font-semibold text-foreground">1</div>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-dashed border-border">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white bg-emerald-500"
                >
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-0.5">Admin</div>
                  <div className="text-xs text-muted-foreground">Manage users and settings</div>
                </div>
                <div className="ml-auto text-sm font-semibold text-foreground">2</div>
              </div>
              <div className="flex items-center gap-3 py-3 border-b border-dashed border-border">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white bg-violet-500"
                >
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-0.5">User</div>
                  <div className="text-xs text-muted-foreground">Standard fleet access</div>
                </div>
                <div className="ml-auto text-sm font-semibold text-foreground">1</div>
              </div>
              <div className="flex items-center gap-3 py-3">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white bg-amber-500"
                >
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground mb-0.5">Viewer</div>
                  <div className="text-xs text-muted-foreground">Read-only access</div>
                </div>
                <div className="ml-auto text-sm font-semibold text-foreground">1</div>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} md={8}>
          <Card className="rounded-xl border border-border shadow-sm mt-2">
            <CardBody>
              <div className="relative w-full">
                <Search className="w-5 h-5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name or email"
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </CardBody>
          </Card>

          <Card className="rounded-xl border border-border shadow-sm mt-4">
            <CardBody>
              <Table
                tableHead={["User", "Email", "Role", "Status", "Last Active", "Actions"]}
                tableData={tableData}
                tableHeaderColor="gray"
              />
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
