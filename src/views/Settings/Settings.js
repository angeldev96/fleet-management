import React from "react";
import { useHistory } from "react-router-dom";

// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";

// @material-ui/icons
import DirectionsCar from "@material-ui/icons/DirectionsCar";
import DevicesOther from "@material-ui/icons/DevicesOther";
import Person from "@material-ui/icons/Person";
import Notifications from "@material-ui/icons/Notifications";
import Security from "@material-ui/icons/Security";
import Business from "@material-ui/icons/Business";
import ChevronRight from "@material-ui/icons/ChevronRight";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";

const useStyles = makeStyles(() => ({
  pageTitle: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "8px",
  },
  pageSubtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "32px",
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "24px",
    cursor: "pointer",
    border: "1px solid #E5E7EB",
    transition: "all 0.2s ease",
    display: "flex",
    alignItems: "center",
    "&:hover": {
      borderColor: "#3E4D6C",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      transform: "translateY(-2px)",
    },
  },
  settingsCardDisabled: {
    backgroundColor: "#F9FAFB",
    borderRadius: "12px",
    padding: "24px",
    border: "1px solid #E5E7EB",
    display: "flex",
    alignItems: "center",
    opacity: 0.6,
    cursor: "not-allowed",
  },
  iconContainer: {
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginRight: "20px",
    flexShrink: 0,
  },
  icon: {
    fontSize: "28px",
    color: "#FFFFFF",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "4px",
  },
  cardDescription: {
    fontSize: "13px",
    color: "#6b7280",
    lineHeight: "1.4",
  },
  chevron: {
    color: "#9CA3AF",
    fontSize: "24px",
  },
  comingSoon: {
    fontSize: "11px",
    color: "#9CA3AF",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginTop: "6px",
  },
}));

const settingsOptions = [
  {
    id: "vehicles",
    title: "Vehicle Data Upload",
    description:
      "Add vehicles to your fleet individually or upload customer data in bulk via CSV.",
    icon: DirectionsCar,
    color: "#2563EB",
    path: "/admin/settings/vehicles",
    enabled: true,
  },
  {
    id: "devices",
    title: "Device Management",
    description:
      "Link GPS devices to your fleet vehicles. Manage device configurations, firmware versions, and assignments.",
    icon: DevicesOther,
    color: "#3E4D6C",
    path: "/admin/settings/devices",
    enabled: true,
  },
  {
    id: "users",
    title: "User Management",
    description: "Manage team members, roles, and permissions for your organization.",
    icon: Person,
    color: "#8B5CF6",
    path: "/admin/settings/users",
    enabled: true,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure alert preferences, email notifications, and push settings.",
    icon: Notifications,
    color: "#F59E0B",
    path: "/admin/settings/notifications",
    enabled: false,
  },
  {
    id: "security",
    title: "Security",
    description: "Password settings, two-factor authentication, and session management.",
    icon: Security,
    color: "#10B981",
    path: "/admin/settings/security",
    enabled: false,
  },
  {
    id: "fleet",
    title: "Fleet Settings",
    description: "Customize your fleet branding. Upload your organization's logo.",
    icon: Business,
    color: "#3B82F6",
    path: "/admin/settings/fleet",
    enabled: true,
  },
];

export default function Settings() {
  const classes = useStyles();
  const history = useHistory();

  const handleCardClick = (option) => {
    if (option.enabled) {
      history.push(option.path);
    }
  };

  return (
    <div>
      <h1 className={classes.pageTitle}>Settings</h1>
      <p className={classes.pageSubtitle}>
        Manage your fleet configuration, users, and preferences
      </p>

      <GridContainer spacing={3}>
        {settingsOptions.map((option) => (
          <GridItem xs={12} sm={6} lg={4} key={option.id}>
            <div
              className={option.enabled ? classes.settingsCard : classes.settingsCardDisabled}
              onClick={() => handleCardClick(option)}
            >
              <div className={classes.iconContainer} style={{ backgroundColor: option.color }}>
                <option.icon className={classes.icon} />
              </div>
              <div className={classes.cardContent}>
                <div className={classes.cardTitle}>{option.title}</div>
                <div className={classes.cardDescription}>{option.description}</div>
                {!option.enabled && <div className={classes.comingSoon}>Coming Soon</div>}
              </div>
              {option.enabled && <ChevronRight className={classes.chevron} />}
            </div>
          </GridItem>
        ))}
      </GridContainer>
    </div>
  );
}
