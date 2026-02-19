import React from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import { Car, Smartphone, User, Bell, Shield, Building, ChevronRight } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";

import { cn } from "lib/utils";

const settingsOptions = [
  {
    id: "vehicles",
    title: "Vehicle Data Upload",
    description:
      "Add vehicles to your fleet individually or upload customer data in bulk via CSV.",
    icon: Car,
    bgColor: "bg-blue-600",
    path: "/admin/settings/vehicles",
    enabled: true,
  },
  {
    id: "devices",
    title: "Device Management",
    description:
      "Link GPS devices to your fleet vehicles. Manage device configurations, firmware versions, and assignments.",
    icon: Smartphone,
    bgColor: "bg-primary",
    path: "/admin/settings/devices",
    enabled: true,
  },
  {
    id: "users",
    title: "User Management",
    description: "Manage team members, roles, and permissions for your organization.",
    icon: User,
    bgColor: "bg-violet-500",
    path: "/admin/settings/users",
    enabled: true,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure alert preferences, email notifications, and push settings.",
    icon: Bell,
    bgColor: "bg-amber-500",
    path: "/admin/settings/notifications",
    enabled: false,
  },
  {
    id: "security",
    title: "Security",
    description: "Password settings, two-factor authentication, and session management.",
    icon: Shield,
    bgColor: "bg-emerald-500",
    path: "/admin/settings/security",
    enabled: false,
  },
  {
    id: "fleet",
    title: "Fleet Settings",
    description: "Customize your fleet branding. Upload your organization's logo.",
    icon: Building,
    bgColor: "bg-blue-500",
    path: "/admin/settings/fleet",
    enabled: true,
  },
];

export default function Settings() {
  const history = useHistory();

  const handleCardClick = (option) => {
    if (option.enabled) {
      history.push(option.path);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground mb-2">Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Manage your fleet configuration, users, and preferences
      </p>

      <GridContainer spacing={3}>
        {settingsOptions.map((option) => (
          <GridItem xs={12} sm={6} lg={4} key={option.id}>
            <div
              className={cn(
                "rounded-xl p-6 flex items-center border transition-all duration-200",
                option.enabled
                  ? "bg-white border-border cursor-pointer hover:border-primary hover:shadow-md hover:-translate-y-0.5"
                  : "bg-muted/50 border-border opacity-60 cursor-not-allowed"
              )}
              onClick={() => handleCardClick(option)}
            >
              <div
                className={cn("w-14 h-14 rounded-xl flex items-center justify-center mr-5 shrink-0", option.bgColor)}
              >
                <option.icon className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-foreground mb-1">{option.title}</div>
                <div className="text-[13px] text-muted-foreground leading-snug">{option.description}</div>
                {!option.enabled && (
                  <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mt-1.5">
                    Coming Soon
                  </div>
                )}
              </div>
              {option.enabled && <ChevronRight className="w-6 h-6 text-muted-foreground" />}
            </div>
          </GridItem>
        ))}
      </GridContainer>
    </div>
  );
}
