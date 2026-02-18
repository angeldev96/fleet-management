import React from "react";
import { useHistory } from "react-router-dom";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

// @material-ui/icons
import ArrowBack from "@material-ui/icons/ArrowBack";
import PersonAdd from "@material-ui/icons/PersonAdd";
import Search from "@material-ui/icons/Search";
import Shield from "@material-ui/icons/Security";
import Group from "@material-ui/icons/Group";
import Person from "@material-ui/icons/Person";
import Visibility from "@material-ui/icons/Visibility";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import Table from "components/Table/Table.js";
import Button from "components/CustomButtons/Button.js";

const useStyles = makeStyles(() => ({
  pageHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    gap: "16px",
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  backButton: {
    backgroundColor: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    padding: "8px 12px",
    textTransform: "none",
    color: "#374151",
    "&:hover": {
      backgroundColor: "#F3F4F6",
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
    marginTop: "4px",
  },
  primaryButton: {
    backgroundColor: "#3E4D6C",
    color: "#FFFFFF",
    padding: "10px 18px",
    textTransform: "none",
    fontWeight: "600",
    borderRadius: "8px",
    "&:hover": {
      backgroundColor: "#2E3B55",
    },
  },
  rolesCard: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  roleItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 0",
    borderBottom: "1px dashed #E5E7EB",
  },
  roleIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFFFFF",
  },
  roleTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "2px",
  },
  roleDesc: {
    fontSize: "12px",
    color: "#6b7280",
  },
  roleCount: {
    marginLeft: "auto",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
  },
  searchCard: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    marginTop: "8px",
  },
  searchInput: {
    width: "100%",
  },
  tableCard: {
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    width: "fit-content",
  },
  statusActive: {
    backgroundColor: "#ECFDF5",
    color: "#059669",
    border: "1px solid #A7F3D0",
  },
  statusInvited: {
    backgroundColor: "#FFFBEB",
    color: "#D97706",
    border: "1px solid #FDE68A",
  },
  rolePill: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#EEF2FF",
    color: "#4F46E5",
    border: "1px solid #C7D2FE",
    width: "fit-content",
  },
}));

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
  const classes = useStyles();
  const history = useHistory();

  const tableData = mockUsers.map((user) => [
    user.name,
    user.email,
    <span className={classes.rolePill} key={`role-${user.id}`}>
      {user.role}
    </span>,
    <span
      className={`${classes.statusBadge} ${
        user.status === "Active" ? classes.statusActive : classes.statusInvited
      }`}
      key={`status-${user.id}`}
    >
      {user.status}
    </span>,
    user.lastActive,
    <Button key={`action-${user.id}`} className={classes.backButton}>
      Manage
    </Button>,
  ]);

  return (
    <div>
      <div className={classes.pageHeader}>
        <div className={classes.headerLeft}>
          <Button className={classes.backButton} onClick={() => history.push("/admin/settings")}>
            <ArrowBack style={{ fontSize: "18px", marginRight: "6px" }} />
            Back
          </Button>
          <div>
            <h1 className={classes.pageTitle}>User Management</h1>
            <div className={classes.pageSubtitle}>
              Superadmins can add users and manage roles within their fleet.
            </div>
          </div>
        </div>
        <Button className={classes.primaryButton}>
          <PersonAdd style={{ fontSize: "18px", marginRight: "8px" }} />
          Invite User
        </Button>
      </div>

      <GridContainer spacing={3}>
        <GridItem xs={12} md={4}>
          <Card className={classes.rolesCard}>
            <CardBody>
              <div className={classes.roleItem}>
                <div className={classes.roleIcon} style={{ backgroundColor: "#3B82F6" }}>
                  <Shield />
                </div>
                <div>
                  <div className={classes.roleTitle}>Superadmin</div>
                  <div className={classes.roleDesc}>Full access across the fleet</div>
                </div>
                <div className={classes.roleCount}>1</div>
              </div>
              <div className={classes.roleItem}>
                <div className={classes.roleIcon} style={{ backgroundColor: "#10B981" }}>
                  <Group />
                </div>
                <div>
                  <div className={classes.roleTitle}>Admin</div>
                  <div className={classes.roleDesc}>Manage users and settings</div>
                </div>
                <div className={classes.roleCount}>2</div>
              </div>
              <div className={classes.roleItem}>
                <div className={classes.roleIcon} style={{ backgroundColor: "#8B5CF6" }}>
                  <Person />
                </div>
                <div>
                  <div className={classes.roleTitle}>User</div>
                  <div className={classes.roleDesc}>Standard fleet access</div>
                </div>
                <div className={classes.roleCount}>1</div>
              </div>
              <div className={classes.roleItem} style={{ borderBottom: "none" }}>
                <div className={classes.roleIcon} style={{ backgroundColor: "#F59E0B" }}>
                  <Visibility />
                </div>
                <div>
                  <div className={classes.roleTitle}>Viewer</div>
                  <div className={classes.roleDesc}>Read-only access</div>
                </div>
                <div className={classes.roleCount}>1</div>
              </div>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem xs={12} md={8}>
          <Card className={classes.searchCard}>
            <CardBody>
              <TextField
                className={classes.searchInput}
                placeholder="Search by name or email"
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search style={{ color: "#9CA3AF" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </CardBody>
          </Card>

          <Card className={classes.tableCard} style={{ marginTop: "16px" }}>
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
